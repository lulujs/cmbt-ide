/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 * Workflow Sync Service - 工作流程同步服务
 * 需求 8.4: 优化图形渲染和实时同步性能
 ********************************************************************************/

import { Disposable, Emitter, Event, MessageService } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';

export interface SyncEvent {
   type: 'model-changed' | 'view-changed' | 'selection-changed';
   source: 'text' | 'diagram' | 'form';
   target?: 'text' | 'diagram' | 'form' | 'all';
   data: any;
   timestamp: number;
}

export interface SyncState {
   isSync: boolean;
   lastSyncTime: number;
   pendingChanges: number;
   conflictCount: number;
}

export interface SyncConflict {
   id: string;
   type: 'concurrent-edit' | 'version-mismatch' | 'data-corruption';
   source: string;
   target: string;
   description: string;
   timestamp: number;
   resolved: boolean;
}

/**
 * Service for managing real-time synchronization between different modeling views
 * 管理不同建模视图间实时同步的服务
 */
@injectable()
export class WorkflowSyncService implements Disposable {
   private readonly onSyncEventEmitter = new Emitter<SyncEvent>();
   private readonly onSyncStateChangedEmitter = new Emitter<SyncState>();
   private readonly onConflictDetectedEmitter = new Emitter<SyncConflict>();

   readonly onSyncEvent: Event<SyncEvent> = this.onSyncEventEmitter.event;
   readonly onSyncStateChanged: Event<SyncState> = this.onSyncStateChangedEmitter.event;
   readonly onConflictDetected: Event<SyncConflict> = this.onConflictDetectedEmitter.event;

   private syncState: SyncState = {
      isSync: true,
      lastSyncTime: Date.now(),
      pendingChanges: 0,
      conflictCount: 0
   };

   private pendingEvents: SyncEvent[] = [];
   private syncQueue: Map<string, SyncEvent[]> = new Map();
   private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
   private conflicts: Map<string, SyncConflict> = new Map();
   private isProcessingSyncQueue = false;

   // Sync optimization settings
   private readonly DEBOUNCE_DELAY = 150; // ms
   private readonly BATCH_SIZE = 10;
   private readonly MAX_QUEUE_SIZE = 100;
   private readonly CONFLICT_TIMEOUT = 5000; // ms

   constructor(@inject(MessageService) private readonly messageService: MessageService) {
      this.initializeSyncMonitoring();
   }

   /**
    * Initialize sync monitoring and optimization
    * 初始化同步监控和优化
    */
   private initializeSyncMonitoring(): void {
      // Monitor sync performance
      setInterval(() => {
         this.checkSyncHealth();
      }, 1000);

      // Process sync queue periodically
      setInterval(() => {
         this.processSyncQueue();
      }, 50);
   }

   /**
    * Emit sync event with debouncing and batching
    * 发出同步事件，带防抖和批处理
    */
   emitSyncEvent(event: SyncEvent): void {
      // Add timestamp if not provided
      if (!event.timestamp) {
         event.timestamp = Date.now();
      }

      // Check for conflicts
      this.detectConflicts(event);

      // Add to pending events
      this.pendingEvents.push(event);
      this.syncState.pendingChanges++;

      // Debounce by source
      const debounceKey = `${event.source}-${event.type}`;

      if (this.debounceTimers.has(debounceKey)) {
         clearTimeout(this.debounceTimers.get(debounceKey)!);
      }

      const timer = setTimeout(() => {
         this.processPendingEvents(event.source);
         this.debounceTimers.delete(debounceKey);
      }, this.DEBOUNCE_DELAY);

      this.debounceTimers.set(debounceKey, timer);
   }

   /**
    * Process pending events for a specific source
    * 处理特定源的待处理事件
    */
   private processPendingEvents(source: string): void {
      const sourceEvents = this.pendingEvents.filter(e => e.source === source);
      if (sourceEvents.length === 0) return;

      // Remove processed events from pending
      this.pendingEvents = this.pendingEvents.filter(e => e.source !== source);

      // Batch events by type
      const batches = this.batchEventsByType(sourceEvents);

      // Add batches to sync queue
      batches.forEach(batch => {
         const queueKey = `${source}-${batch[0].type}`;
         if (!this.syncQueue.has(queueKey)) {
            this.syncQueue.set(queueKey, []);
         }
         this.syncQueue.get(queueKey)!.push(...batch);
      });

      // Limit queue size to prevent memory issues
      this.limitQueueSize();
   }

   /**
    * Batch events by type for efficient processing
    * 按类型批处理事件以提高处理效率
    */
   private batchEventsByType(events: SyncEvent[]): SyncEvent[][] {
      const batches: Map<string, SyncEvent[]> = new Map();

      events.forEach(event => {
         const key = event.type;
         if (!batches.has(key)) {
            batches.set(key, []);
         }
         batches.get(key)!.push(event);
      });

      return Array.from(batches.values());
   }

   /**
    * Limit queue size to prevent memory issues
    * 限制队列大小以防止内存问题
    */
   private limitQueueSize(): void {
      this.syncQueue.forEach((events, key) => {
         if (events.length > this.MAX_QUEUE_SIZE) {
            // Keep only the most recent events
            const excess = events.length - this.MAX_QUEUE_SIZE;
            events.splice(0, excess);
            console.warn(`Sync queue for ${key} exceeded limit, dropped ${excess} events`);
         }
      });
   }

   /**
    * Process sync queue with batching
    * 批处理同步队列
    */
   private async processSyncQueue(): Promise<void> {
      if (this.isProcessingSyncQueue || this.syncQueue.size === 0) {
         return;
      }

      this.isProcessingSyncQueue = true;

      try {
         for (const [queueKey, events] of this.syncQueue.entries()) {
            if (events.length === 0) continue;

            // Process events in batches
            const batch = events.splice(0, this.BATCH_SIZE);

            // Emit batched events
            for (const event of batch) {
               this.onSyncEventEmitter.fire(event);
               this.syncState.pendingChanges = Math.max(0, this.syncState.pendingChanges - 1);
            }

            // Update sync state
            this.syncState.lastSyncTime = Date.now();
            this.onSyncStateChangedEmitter.fire({ ...this.syncState });

            // Clean up empty queues
            if (events.length === 0) {
               this.syncQueue.delete(queueKey);
            }

            // Yield control to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 0));
         }
      } catch (error) {
         console.error('Error processing sync queue:', error);
         this.messageService.error('同步处理出现错误');
      } finally {
         this.isProcessingSyncQueue = false;
      }
   }

   /**
    * Detect sync conflicts
    * 检测同步冲突
    */
   private detectConflicts(event: SyncEvent): void {
      const now = Date.now();

      // Check for concurrent edits
      const recentEvents = this.pendingEvents.filter(
         e => now - e.timestamp < this.CONFLICT_TIMEOUT && e.type === event.type && e.source !== event.source
      );

      if (recentEvents.length > 0) {
         const conflictId = `conflict-${now}-${Math.random().toString(36).substr(2, 9)}`;
         const conflict: SyncConflict = {
            id: conflictId,
            type: 'concurrent-edit',
            source: event.source,
            target: recentEvents[0].source,
            description: `并发编辑检测: ${event.source} 和 ${recentEvents[0].source} 同时修改了 ${event.type}`,
            timestamp: now,
            resolved: false
         };

         this.conflicts.set(conflictId, conflict);
         this.syncState.conflictCount++;
         this.onConflictDetectedEmitter.fire(conflict);
      }
   }

   /**
    * Resolve sync conflict
    * 解决同步冲突
    */
   resolveConflict(conflictId: string, resolution: 'accept-source' | 'accept-target' | 'merge'): void {
      const conflict = this.conflicts.get(conflictId);
      if (!conflict) return;

      conflict.resolved = true;
      this.syncState.conflictCount = Math.max(0, this.syncState.conflictCount - 1);

      // Apply resolution logic here
      switch (resolution) {
         case 'accept-source':
            // Keep source changes, discard target changes
            break;
         case 'accept-target':
            // Keep target changes, discard source changes
            break;
         case 'merge':
            // Attempt to merge changes
            break;
      }

      this.conflicts.delete(conflictId);
      this.onSyncStateChangedEmitter.fire({ ...this.syncState });
   }

   /**
    * Check sync health and performance
    * 检查同步健康状况和性能
    */
   private checkSyncHealth(): void {
      const now = Date.now();
      const timeSinceLastSync = now - this.syncState.lastSyncTime;

      // Check if sync is lagging
      if (timeSinceLastSync > 5000 && this.syncState.pendingChanges > 0) {
         this.syncState.isSync = false;
         console.warn('Sync is lagging, pending changes:', this.syncState.pendingChanges);
      } else if (this.syncState.pendingChanges === 0) {
         this.syncState.isSync = true;
      }

      // Clean up old conflicts
      this.cleanupOldConflicts(now);
   }

   /**
    * Clean up old unresolved conflicts
    * 清理旧的未解决冲突
    */
   private cleanupOldConflicts(now: number): void {
      const oldConflicts = Array.from(this.conflicts.entries()).filter(
         ([_, conflict]) => now - conflict.timestamp > this.CONFLICT_TIMEOUT * 2
      );

      oldConflicts.forEach(([id, conflict]) => {
         if (!conflict.resolved) {
            console.warn(`Auto-resolving old conflict: ${id}`);
            this.resolveConflict(id, 'accept-source'); // Default resolution
         }
      });
   }

   /**
    * Force sync all views
    * 强制同步所有视图
    */
   forceSyncAll(): void {
      const syncAllEvent: SyncEvent = {
         type: 'model-changed',
         source: 'text', // Use text as authoritative source
         target: 'all',
         data: { forceSync: true },
         timestamp: Date.now()
      };

      this.emitSyncEvent(syncAllEvent);
      this.messageService.info('已强制同步所有视图');
   }

   /**
    * Pause sync temporarily
    * 暂时暂停同步
    */
   pauseSync(): void {
      this.syncState.isSync = false;
      this.onSyncStateChangedEmitter.fire({ ...this.syncState });
   }

   /**
    * Resume sync
    * 恢复同步
    */
   resumeSync(): void {
      this.syncState.isSync = true;
      this.onSyncStateChangedEmitter.fire({ ...this.syncState });

      // Process any pending events
      this.processSyncQueue();
   }

   /**
    * Get current sync state
    * 获取当前同步状态
    */
   getSyncState(): SyncState {
      return { ...this.syncState };
   }

   /**
    * Get active conflicts
    * 获取活跃的冲突
    */
   getActiveConflicts(): SyncConflict[] {
      return Array.from(this.conflicts.values()).filter(c => !c.resolved);
   }

   /**
    * Clear all pending changes and conflicts
    * 清除所有待处理的更改和冲突
    */
   clearPendingChanges(): void {
      this.pendingEvents = [];
      this.syncQueue.clear();
      this.conflicts.clear();

      // Clear debounce timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();

      this.syncState = {
         isSync: true,
         lastSyncTime: Date.now(),
         pendingChanges: 0,
         conflictCount: 0
      };

      this.onSyncStateChangedEmitter.fire({ ...this.syncState });
      this.messageService.info('已清除所有待处理的同步更改');
   }

   /**
    * Get sync performance metrics
    * 获取同步性能指标
    */
   getSyncMetrics(): SyncMetrics {
      return {
         pendingEvents: this.pendingEvents.length,
         queueSize: Array.from(this.syncQueue.values()).reduce((sum, events) => sum + events.length, 0),
         activeConflicts: this.getActiveConflicts().length,
         lastSyncTime: this.syncState.lastSyncTime,
         averageLatency: this.calculateAverageLatency(),
         throughput: this.calculateThroughput()
      };
   }

   /**
    * Calculate average sync latency
    * 计算平均同步延迟
    */
   private calculateAverageLatency(): number {
      const now = Date.now();
      const recentEvents = this.pendingEvents.filter(e => now - e.timestamp < 10000);

      if (recentEvents.length === 0) return 0;

      const totalLatency = recentEvents.reduce((sum, event) => sum + (now - event.timestamp), 0);
      return totalLatency / recentEvents.length;
   }

   /**
    * Calculate sync throughput (events per second)
    * 计算同步吞吐量（每秒事件数）
    */
   private calculateThroughput(): number {
      const now = Date.now();
      const recentEvents = this.pendingEvents.filter(e => now - e.timestamp < 1000);
      return recentEvents.length; // Events in the last second
   }

   /**
    * Optimize sync performance
    * 优化同步性能
    */
   optimizeSyncPerformance(): void {
      // Reduce debounce delay for better responsiveness
      if (this.syncState.pendingChanges < 5) {
         // Low load, reduce delay
         (this as any).DEBOUNCE_DELAY = 100;
      } else if (this.syncState.pendingChanges > 20) {
         // High load, increase delay
         (this as any).DEBOUNCE_DELAY = 300;
      }

      // Adjust batch size based on performance
      const metrics = this.getSyncMetrics();
      if (metrics.averageLatency > 200) {
         // High latency, increase batch size
         (this as any).BATCH_SIZE = Math.min(20, this.BATCH_SIZE * 1.5);
      } else if (metrics.averageLatency < 50) {
         // Low latency, decrease batch size for better responsiveness
         (this as any).BATCH_SIZE = Math.max(5, this.BATCH_SIZE * 0.8);
      }
   }

   /**
    * Dispose resources
    * 释放资源
    */
   dispose(): void {
      // Clear all timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();

      // Clear all data
      this.pendingEvents = [];
      this.syncQueue.clear();
      this.conflicts.clear();

      // Dispose emitters
      this.onSyncEventEmitter.dispose();
      this.onSyncStateChangedEmitter.dispose();
      this.onConflictDetectedEmitter.dispose();
   }
}

export interface SyncMetrics {
   pendingEvents: number;
   queueSize: number;
   activeConflicts: number;
   lastSyncTime: number;
   averageLatency: number;
   throughput: number;
}
