/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ConflictResolutionStrategy, SyncConflict, SyncEvent, SyncListener, SyncResult, SyncStatus } from '@crossmodel/protocol';

/**
 * 通知类型
 * Notification type
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知消息接口
 * Notification message interface
 */
export interface NotificationMessage {
   id: string;
   type: NotificationType;
   title: string;
   message: string;
   timestamp: number;
   duration?: number; // 自动关闭时间（毫秒），undefined 表示不自动关闭
   actions?: NotificationAction[];
}

/**
 * 通知动作接口
 * Notification action interface
 */
export interface NotificationAction {
   label: string;
   callback: () => void;
}

/**
 * 通知监听器
 * Notification listener
 */
export type NotificationListener = (notification: NotificationMessage) => void;

/**
 * 同步通知服务
 * Sync notification service
 *
 * 需求 8.4-8.5: 实现同步错误的用户友好提示
 */
export class SyncNotificationService implements SyncListener {
   private listeners: Set<NotificationListener> = new Set();
   private notificationIdCounter = 0;
   private activeNotifications: Map<string, NotificationMessage> = new Map();

   /**
    * 生成通知ID
    * Generate notification ID
    */
   private generateId(): string {
      return `sync-notification-${++this.notificationIdCounter}`;
   }

   /**
    * 添加通知监听器
    * Add notification listener
    */
   addNotificationListener(listener: NotificationListener): void {
      this.listeners.add(listener);
   }

   /**
    * 移除通知监听器
    * Remove notification listener
    */
   removeNotificationListener(listener: NotificationListener): void {
      this.listeners.delete(listener);
   }

   /**
    * 发送通知
    * Send notification
    */
   notify(notification: Omit<NotificationMessage, 'id' | 'timestamp'>): NotificationMessage {
      const fullNotification: NotificationMessage = {
         ...notification,
         id: this.generateId(),
         timestamp: Date.now()
      };

      this.activeNotifications.set(fullNotification.id, fullNotification);

      // 通知所有监听器
      for (const listener of this.listeners) {
         try {
            listener(fullNotification);
         } catch (error) {
            console.error('Error in notification listener:', error);
         }
      }

      // 如果设置了自动关闭时间，安排关闭
      if (fullNotification.duration) {
         setTimeout(() => {
            this.dismiss(fullNotification.id);
         }, fullNotification.duration);
      }

      return fullNotification;
   }

   /**
    * 关闭通知
    * Dismiss notification
    */
   dismiss(notificationId: string): void {
      this.activeNotifications.delete(notificationId);
   }

   /**
    * 获取所有活动通知
    * Get all active notifications
    */
   getActiveNotifications(): NotificationMessage[] {
      return Array.from(this.activeNotifications.values());
   }

   /**
    * 清除所有通知
    * Clear all notifications
    */
   clearAll(): void {
      this.activeNotifications.clear();
   }

   // ============================================================================
   // SyncListener 实现 - SyncListener Implementation
   // ============================================================================

   /**
    * 同步开始时的通知
    * Notification when sync starts
    */
   onSyncStart(event: SyncEvent): void {
      this.notify({
         type: 'info',
         title: '同步开始',
         message: `正在同步 ${this.getMethodName(event.sourceMethod)} 的更改...`,
         duration: 2000
      });
   }

   /**
    * 同步完成时的通知
    * Notification when sync completes
    */
   onSyncComplete(result: SyncResult): void {
      if (result.success) {
         this.notify({
            type: 'success',
            title: '同步成功',
            message: `模型已成功同步到版本 ${result.syncedVersion}`,
            duration: 3000
         });
      } else if (result.conflicts && result.conflicts.length > 0) {
         this.notify({
            type: 'warning',
            title: '同步完成但存在冲突',
            message: `检测到 ${result.conflicts.length} 个冲突，请手动解决`,
            actions: [
               {
                  label: '查看冲突',
                  callback: () => {
                     // 这里可以触发打开冲突解决对话框
                     console.log('View conflicts:', result.conflicts);
                  }
               }
            ]
         });
      }
   }

   /**
    * 同步错误时的通知
    * Notification when sync error occurs
    */
   onSyncError(error: Error, event: SyncEvent): void {
      this.notify({
         type: 'error',
         title: '同步失败',
         message: this.formatErrorMessage(error, event),
         actions: [
            {
               label: '重试',
               callback: () => {
                  // 这里可以触发重试同步
                  console.log('Retry sync for:', event.uri);
               }
            },
            {
               label: '忽略',
               callback: () => {
                  // 忽略错误
               }
            }
         ]
      });
   }

   /**
    * 检测到冲突时的通知
    * Notification when conflict is detected
    */
   onConflictDetected(conflict: SyncConflict): void {
      this.notify({
         type: 'warning',
         title: '检测到同步冲突',
         message: this.formatConflictMessage(conflict),
         actions: [
            {
               label: '使用本地版本',
               callback: () => {
                  console.log('Use local version for conflict:', conflict);
               }
            },
            {
               label: '使用远程版本',
               callback: () => {
                  console.log('Use remote version for conflict:', conflict);
               }
            },
            {
               label: '手动解决',
               callback: () => {
                  console.log('Manual resolve for conflict:', conflict);
               }
            }
         ]
      });
   }

   /**
    * 冲突解决时的通知
    * Notification when conflict is resolved
    */
   onConflictResolved(conflict: SyncConflict, strategy: ConflictResolutionStrategy): void {
      this.notify({
         type: 'success',
         title: '冲突已解决',
         message: `使用 ${this.getStrategyName(strategy)} 策略解决了 ${this.getMethodName(conflict.localMethod)} 和 ${this.getMethodName(conflict.remoteMethod)} 之间的冲突`,
         duration: 3000
      });
   }

   /**
    * 状态变化时的通知
    * Notification when status changes
    */
   onStatusChange(uri: string, oldStatus: SyncStatus, newStatus: SyncStatus): void {
      // 只在特定状态变化时通知
      if (newStatus === SyncStatus.ERROR) {
         this.notify({
            type: 'error',
            title: '同步状态异常',
            message: `同步状态从 ${this.getStatusName(oldStatus)} 变为 ${this.getStatusName(newStatus)}`,
            duration: 5000
         });
      } else if (newStatus === SyncStatus.CONFLICT && oldStatus !== SyncStatus.CONFLICT) {
         this.notify({
            type: 'warning',
            title: '需要解决冲突',
            message: '检测到数据冲突，请选择解决方案',
            duration: 5000
         });
      }
   }

   // ============================================================================
   // 辅助方法 - Helper Methods
   // ============================================================================

   /**
    * 获取建模方式名称
    * Get modeling method name
    */
   private getMethodName(method: string): string {
      switch (method) {
         case 'text':
            return '文本编辑器';
         case 'graphical':
            return '图形编辑器';
         case 'form':
            return '表单编辑器';
         default:
            return method;
      }
   }

   /**
    * 获取策略名称
    * Get strategy name
    */
   private getStrategyName(strategy: ConflictResolutionStrategy): string {
      switch (strategy) {
         case 'use_local':
            return '使用本地版本';
         case 'use_remote':
            return '使用远程版本';
         case 'merge':
            return '合并';
         case 'manual':
            return '手动解决';
         default:
            return strategy;
      }
   }

   /**
    * 获取状态名称
    * Get status name
    */
   private getStatusName(status: SyncStatus): string {
      switch (status) {
         case SyncStatus.IDLE:
            return '空闲';
         case SyncStatus.SYNCING:
            return '同步中';
         case SyncStatus.SYNCED:
            return '已同步';
         case SyncStatus.CONFLICT:
            return '冲突';
         case SyncStatus.ERROR:
            return '错误';
         default:
            return status;
      }
   }

   /**
    * 格式化错误消息
    * Format error message
    */
   private formatErrorMessage(error: Error, event: SyncEvent): string {
      const methodName = this.getMethodName(event.sourceMethod);
      const errorMessage = error.message || '未知错误';

      // 提供用户友好的错误消息
      if (errorMessage.includes('timeout')) {
         return `${methodName} 同步超时，请检查网络连接后重试`;
      }
      if (errorMessage.includes('version')) {
         return `${methodName} 版本冲突，请刷新后重试`;
      }
      if (errorMessage.includes('permission')) {
         return `${methodName} 同步失败：没有写入权限`;
      }

      return `${methodName} 同步失败：${errorMessage}`;
   }

   /**
    * 格式化冲突消息
    * Format conflict message
    */
   private formatConflictMessage(conflict: SyncConflict): string {
      const localMethod = this.getMethodName(conflict.localMethod);
      const remoteMethod = this.getMethodName(conflict.remoteMethod);

      switch (conflict.conflictType) {
         case 'version_mismatch':
            return `${localMethod}（版本 ${conflict.localVersion}）和 ${remoteMethod}（版本 ${conflict.remoteVersion}）版本不匹配`;
         case 'concurrent_edit':
            return `${localMethod} 和 ${remoteMethod} 同时进行了编辑`;
         case 'data_inconsistency':
            return `${localMethod} 和 ${remoteMethod} 的数据不一致`;
         default:
            return conflict.description;
      }
   }
}

/**
 * 创建同步通知服务
 * Create sync notification service
 */
export function createSyncNotificationService(): SyncNotificationService {
   return new SyncNotificationService();
}

export default SyncNotificationService;
