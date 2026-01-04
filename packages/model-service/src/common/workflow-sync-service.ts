/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   ConflictResolutionStrategy,
   DEFAULT_SYNC_CONFIG,
   ModelingMethod,
   SyncConfig,
   SyncConflict,
   SyncListener,
   SyncResult,
   SyncStateInfo,
   SyncStatus,
   VersionInfo,
   createSyncEvent,
   createVersionInfo,
   detectConflict
} from '@crossmodel/protocol';

/**
 * 工作流程同步服务接口
 * Workflow synchronization service interface
 *
 * 需求 8.4: 保持数据同步
 * 需求 8.5: 实时更新其他建模方式的显示
 */
export interface WorkflowSyncService {
   // 同步操作
   sync(uri: string, sourceMethod: ModelingMethod, clientId: string): Promise<SyncResult>;
   forceSyncAll(uri: string): Promise<SyncResult[]>;

   // 状态管理
   getStatus(uri: string): SyncStatus;
   getStateInfo(uri: string): SyncStateInfo | undefined;

   // 冲突管理
   getConflicts(uri: string): SyncConflict[];
   resolveConflict(uri: string, conflict: SyncConflict, strategy: ConflictResolutionStrategy): Promise<SyncResult>;
   resolveAllConflicts(uri: string, strategy: ConflictResolutionStrategy): Promise<SyncResult[]>;

   // 版本管理
   getVersion(uri: string, method: ModelingMethod): VersionInfo | undefined;
   updateVersion(uri: string, method: ModelingMethod, version: number, content?: string): void;

   // 监听器管理
   addListener(listener: SyncListener): void;
   removeListener(listener: SyncListener): void;

   // 配置管理
   getConfig(): SyncConfig;
   updateConfig(config: Partial<SyncConfig>): void;

   // 手动同步控制
   enableAutoSync(uri: string): void;
   disableAutoSync(uri: string): void;
   reset(uri: string): void;
}

/**
 * 工作流程同步服务实现
 * Workflow synchronization service implementation
 */
export class WorkflowSyncServiceImpl implements WorkflowSyncService {
   private config: SyncConfig = { ...DEFAULT_SYNC_CONFIG };
   private listeners: Set<SyncListener> = new Set();
   private stateMap: Map<string, SyncStateInfo> = new Map();
   private versionMap: Map<string, Map<ModelingMethod, VersionInfo>> = new Map();
   private autoSyncTimers: Map<string, NodeJS.Timeout> = new Map();
   private pendingSync: Map<string, Promise<SyncResult>> = new Map();

   constructor(config?: Partial<SyncConfig>) {
      if (config) {
         this.config = { ...this.config, ...config };
      }
   }

   /**
    * 同步指定URI的模型
    * Synchronize model for specified URI
    */
   async sync(uri: string, sourceMethod: ModelingMethod, clientId: string): Promise<SyncResult> {
      // 检查是否已有同步进行中
      const pending = this.pendingSync.get(uri);
      if (pending) {
         return pending;
      }

      const syncPromise = this.performSync(uri, sourceMethod, clientId);
      this.pendingSync.set(uri, syncPromise);

      try {
         const result = await syncPromise;
         return result;
      } finally {
         this.pendingSync.delete(uri);
      }
   }

   /**
    * 执行同步操作
    * Perform synchronization
    */
   private async performSync(uri: string, sourceMethod: ModelingMethod, clientId: string): Promise<SyncResult> {
      const state = this.getOrCreateState(uri);

      // 更新状态为同步中
      this.updateStatus(uri, SyncStatus.SYNCING);

      // 获取当前版本信息
      const versions = this.versionMap.get(uri);
      const sourceVersion = versions?.get(sourceMethod);

      if (!sourceVersion) {
         this.updateStatus(uri, SyncStatus.ERROR);
         return {
            success: false,
            uri,
            error: `No version info found for ${sourceMethod}`
         };
      }

      // 创建同步事件
      const syncEvent = createSyncEvent(uri, sourceMethod, clientId, sourceVersion.version, 'update');
      this.notifyListeners('onSyncStart', syncEvent);

      try {
         // 检测与其他建模方式的冲突
         const conflicts: SyncConflict[] = [];
         const methods: ModelingMethod[] = ['text', 'graphical', 'form'];

         for (const method of methods) {
            if (method === sourceMethod) continue;

            const targetVersion = versions?.get(method);
            if (targetVersion) {
               const conflict = detectConflict(sourceVersion, targetVersion);
               if (conflict) {
                  conflict.uri = uri;
                  conflicts.push(conflict);
               }
            }
         }

         // 如果有冲突，根据策略处理
         if (conflicts.length > 0) {
            state.activeConflicts = conflicts;

            for (const conflict of conflicts) {
               this.notifyListeners('onConflictDetected', conflict);
            }

            // 使用默认策略自动解决冲突
            if (this.config.defaultConflictResolution !== 'manual') {
               const resolvedConflicts: SyncConflict[] = [];
               for (const conflict of conflicts) {
                  await this.resolveConflict(uri, conflict, this.config.defaultConflictResolution);
                  resolvedConflicts.push(conflict);
               }

               this.updateStatus(uri, SyncStatus.SYNCED);
               const result: SyncResult = {
                  success: true,
                  uri,
                  syncedVersion: sourceVersion.version,
                  conflicts,
                  resolvedConflicts
               };
               this.notifyListeners('onSyncComplete', result);
               return result;
            }

            // 手动解决冲突
            this.updateStatus(uri, SyncStatus.CONFLICT);
            return {
               success: false,
               uri,
               conflicts,
               error: 'Conflicts detected, manual resolution required'
            };
         }

         // 没有冲突，同步成功
         state.lastSyncTime = Date.now();
         state.pendingChanges = 0;
         this.updateStatus(uri, SyncStatus.SYNCED);

         const result: SyncResult = {
            success: true,
            uri,
            syncedVersion: sourceVersion.version
         };
         this.notifyListeners('onSyncComplete', result);
         return result;
      } catch (error) {
         this.updateStatus(uri, SyncStatus.ERROR);
         const errorMessage = error instanceof Error ? error.message : String(error);
         this.notifyListeners('onSyncError', new Error(errorMessage), syncEvent);
         return {
            success: false,
            uri,
            error: errorMessage
         };
      }
   }

   /**
    * 强制同步所有建模方式
    * Force sync all modeling methods
    */
   async forceSyncAll(uri: string): Promise<SyncResult[]> {
      const results: SyncResult[] = [];
      const methods: ModelingMethod[] = ['text', 'graphical', 'form'];

      for (const method of methods) {
         const versions = this.versionMap.get(uri);
         const version = versions?.get(method);
         if (version) {
            const result = await this.sync(uri, method, version.clientId);
            results.push(result);
         }
      }

      return results;
   }

   /**
    * 获取同步状态
    * Get synchronization status
    */
   getStatus(uri: string): SyncStatus {
      return this.stateMap.get(uri)?.status ?? SyncStatus.IDLE;
   }

   /**
    * 获取同步状态信息
    * Get synchronization state info
    */
   getStateInfo(uri: string): SyncStateInfo | undefined {
      return this.stateMap.get(uri);
   }

   /**
    * 获取冲突列表
    * Get conflicts list
    */
   getConflicts(uri: string): SyncConflict[] {
      return this.stateMap.get(uri)?.activeConflicts ?? [];
   }

   /**
    * 解决冲突
    * Resolve conflict
    */
   async resolveConflict(uri: string, conflict: SyncConflict, strategy: ConflictResolutionStrategy): Promise<SyncResult> {
      const state = this.getOrCreateState(uri);

      try {
         switch (strategy) {
            case 'use_local':
               // 使用本地版本，更新远程版本信息
               this.updateVersion(uri, conflict.remoteMethod, conflict.localVersion);
               break;

            case 'use_remote':
               // 使用远程版本，更新本地版本信息
               this.updateVersion(uri, conflict.localMethod, conflict.remoteVersion);
               break;

            case 'merge':
               // 合并策略：使用较新的版本
               const newerVersion = conflict.localTimestamp > conflict.remoteTimestamp ? conflict.localVersion : conflict.remoteVersion;
               this.updateVersion(uri, conflict.localMethod, newerVersion);
               this.updateVersion(uri, conflict.remoteMethod, newerVersion);
               break;

            case 'manual':
               // 手动解决，不做任何操作
               return {
                  success: false,
                  uri,
                  error: 'Manual resolution required'
               };
         }

         // 从活动冲突列表中移除
         state.activeConflicts = state.activeConflicts.filter(
            c => c.localMethod !== conflict.localMethod || c.remoteMethod !== conflict.remoteMethod
         );

         this.notifyListeners('onConflictResolved', conflict, strategy);

         // 如果没有更多冲突，更新状态
         if (state.activeConflicts.length === 0) {
            this.updateStatus(uri, SyncStatus.SYNCED);
         }

         return {
            success: true,
            uri,
            resolvedConflicts: [conflict]
         };
      } catch (error) {
         return {
            success: false,
            uri,
            error: error instanceof Error ? error.message : String(error)
         };
      }
   }

   /**
    * 解决所有冲突
    * Resolve all conflicts
    */
   async resolveAllConflicts(uri: string, strategy: ConflictResolutionStrategy): Promise<SyncResult[]> {
      const conflicts = this.getConflicts(uri);
      const results: SyncResult[] = [];

      for (const conflict of conflicts) {
         const result = await this.resolveConflict(uri, conflict, strategy);
         results.push(result);
      }

      return results;
   }

   /**
    * 获取版本信息
    * Get version info
    */
   getVersion(uri: string, method: ModelingMethod): VersionInfo | undefined {
      return this.versionMap.get(uri)?.get(method);
   }

   /**
    * 更新版本信息
    * Update version info
    */
   updateVersion(uri: string, method: ModelingMethod, version: number, content?: string): void {
      let versions = this.versionMap.get(uri);
      if (!versions) {
         versions = new Map();
         this.versionMap.set(uri, versions);
      }

      const existingVersion = versions.get(method);
      const newVersion = createVersionInfo(version, existingVersion?.clientId ?? 'unknown', method, content);

      versions.set(method, newVersion);

      // 增加待处理更改计数
      const state = this.getOrCreateState(uri);
      state.pendingChanges++;

      // 如果启用了自动同步，安排同步
      if (this.config.autoSyncEnabled) {
         this.scheduleAutoSync(uri, method, newVersion.clientId);
      }
   }

   /**
    * 添加监听器
    * Add listener
    */
   addListener(listener: SyncListener): void {
      this.listeners.add(listener);
   }

   /**
    * 移除监听器
    * Remove listener
    */
   removeListener(listener: SyncListener): void {
      this.listeners.delete(listener);
   }

   /**
    * 获取配置
    * Get configuration
    */
   getConfig(): SyncConfig {
      return { ...this.config };
   }

   /**
    * 更新配置
    * Update configuration
    */
   updateConfig(config: Partial<SyncConfig>): void {
      this.config = { ...this.config, ...config };
   }

   /**
    * 启用自动同步
    * Enable auto sync
    */
   enableAutoSync(_uri: string): void {
      // 自动同步已在配置级别启用
   }

   /**
    * 禁用自动同步
    * Disable auto sync
    */
   disableAutoSync(uri: string): void {
      const timer = this.autoSyncTimers.get(uri);
      if (timer) {
         clearTimeout(timer);
         this.autoSyncTimers.delete(uri);
      }
   }

   /**
    * 重置同步状态
    * Reset synchronization state
    */
   reset(uri: string): void {
      this.disableAutoSync(uri);
      this.stateMap.delete(uri);
      this.versionMap.delete(uri);
      this.pendingSync.delete(uri);
   }

   /**
    * 获取或创建状态
    * Get or create state
    */
   private getOrCreateState(uri: string): SyncStateInfo {
      let state = this.stateMap.get(uri);
      if (!state) {
         state = {
            uri,
            status: SyncStatus.IDLE,
            pendingChanges: 0,
            activeConflicts: [],
            connectedClients: []
         };
         this.stateMap.set(uri, state);
      }
      return state;
   }

   /**
    * 更新状态
    * Update status
    */
   private updateStatus(uri: string, newStatus: SyncStatus): void {
      const state = this.getOrCreateState(uri);
      const oldStatus = state.status;
      state.status = newStatus;

      if (oldStatus !== newStatus) {
         this.notifyListeners('onStatusChange', uri, oldStatus, newStatus);
      }
   }

   /**
    * 安排自动同步
    * Schedule auto sync
    */
   private scheduleAutoSync(uri: string, method: ModelingMethod, clientId: string): void {
      // 清除现有的定时器
      const existingTimer = this.autoSyncTimers.get(uri);
      if (existingTimer) {
         clearTimeout(existingTimer);
      }

      // 设置新的定时器
      const timer = setTimeout(async () => {
         await this.sync(uri, method, clientId);
         this.autoSyncTimers.delete(uri);
      }, this.config.autoSyncInterval);

      this.autoSyncTimers.set(uri, timer);
   }

   /**
    * 通知监听器
    * Notify listeners
    */
   private notifyListeners(event: keyof SyncListener, ...args: any[]): void {
      for (const listener of this.listeners) {
         const handler = listener[event];
         if (handler) {
            try {
               (handler as Function).apply(listener, args);
            } catch (error) {
               console.error(`Error in sync listener ${event}:`, error);
            }
         }
      }
   }
}

/**
 * 创建工作流程同步服务
 * Create workflow sync service
 */
export function createWorkflowSyncService(config?: Partial<SyncConfig>): WorkflowSyncService {
   return new WorkflowSyncServiceImpl(config);
}
