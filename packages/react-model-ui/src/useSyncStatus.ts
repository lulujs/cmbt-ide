/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowSyncService } from '@crossmodel/model-service/lib/common';
import { ConflictResolutionStrategy, ModelingMethod, SyncConflict, SyncStateInfo, SyncStatus } from '@crossmodel/protocol';
import * as React from 'react';
import { NotificationMessage, SyncNotificationService } from './SyncNotificationService';

/**
 * 同步状态 Hook 返回值接口
 * Sync status hook return interface
 */
export interface UseSyncStatusReturn {
   /** 当前同步状态 */
   status: SyncStatus;
   /** 同步状态详细信息 */
   stateInfo: SyncStateInfo | undefined;
   /** 活动冲突列表 */
   conflicts: SyncConflict[];
   /** 活动通知列表 */
   notifications: NotificationMessage[];
   /** 是否正在同步 */
   isSyncing: boolean;
   /** 是否有冲突 */
   hasConflicts: boolean;
   /** 是否有错误 */
   hasError: boolean;
   /** 手动触发同步 */
   sync: (method: ModelingMethod, clientId: string) => Promise<void>;
   /** 强制同步所有 */
   forceSyncAll: () => Promise<void>;
   /** 解决冲突 */
   resolveConflict: (conflict: SyncConflict, strategy: ConflictResolutionStrategy) => Promise<void>;
   /** 解决所有冲突 */
   resolveAllConflicts: (strategy: ConflictResolutionStrategy) => Promise<void>;
   /** 重置同步状态 */
   reset: () => void;
   /** 关闭通知 */
   dismissNotification: (id: string) => void;
   /** 清除所有通知 */
   clearAllNotifications: () => void;
}

/**
 * 同步状态 Hook 配置接口
 * Sync status hook config interface
 */
export interface UseSyncStatusConfig {
   /** 文档 URI */
   uri: string;
   /** 同步服务实例 */
   syncService: WorkflowSyncService;
   /** 通知服务实例（可选） */
   notificationService?: SyncNotificationService;
   /** 是否启用通知 */
   enableNotifications?: boolean;
}

/**
 * 同步状态 Hook
 * Sync status hook
 *
 * 需求 8.4-8.5: 提供同步状态管理和用户反馈
 */
export function useSyncStatus(config: UseSyncStatusConfig): UseSyncStatusReturn {
   const { uri, syncService, notificationService, enableNotifications = true } = config;

   // 状态
   const [status, setStatus] = React.useState<SyncStatus>(SyncStatus.IDLE);
   const [stateInfo, setStateInfo] = React.useState<SyncStateInfo | undefined>(undefined);
   const [conflicts, setConflicts] = React.useState<SyncConflict[]>([]);
   const [notifications, setNotifications] = React.useState<NotificationMessage[]>([]);

   // 计算属性
   const isSyncing = status === SyncStatus.SYNCING;
   const hasConflicts = status === SyncStatus.CONFLICT || conflicts.length > 0;
   const hasError = status === SyncStatus.ERROR;

   // 初始化和清理
   React.useEffect(() => {
      // 获取初始状态
      const initialState = syncService.getStateInfo(uri);
      if (initialState) {
         setStateInfo(initialState);
         setStatus(initialState.status);
         setConflicts(initialState.activeConflicts);
      }

      // 添加同步监听器
      const syncListener = {
         onStatusChange: (changedUri: string, _oldStatus: SyncStatus, newStatus: SyncStatus) => {
            if (changedUri === uri) {
               setStatus(newStatus);
               const newState = syncService.getStateInfo(uri);
               setStateInfo(newState);
               setConflicts(newState?.activeConflicts ?? []);
            }
         },
         onConflictDetected: (conflict: SyncConflict) => {
            if (conflict.uri === uri) {
               setConflicts(prev => [...prev, conflict]);
            }
         },
         onConflictResolved: (conflict: SyncConflict) => {
            if (conflict.uri === uri) {
               setConflicts(prev => prev.filter(c => c.localMethod !== conflict.localMethod || c.remoteMethod !== conflict.remoteMethod));
            }
         }
      };

      syncService.addListener(syncListener);

      // 添加通知监听器
      if (enableNotifications && notificationService) {
         const notificationListener = (notification: NotificationMessage) => {
            setNotifications(prev => [...prev, notification]);
         };
         notificationService.addNotificationListener(notificationListener);
         syncService.addListener(notificationService);

         return () => {
            syncService.removeListener(syncListener);
            syncService.removeListener(notificationService);
            notificationService.removeNotificationListener(notificationListener);
         };
      }

      return () => {
         syncService.removeListener(syncListener);
      };
   }, [uri, syncService, notificationService, enableNotifications]);

   // 手动同步
   const sync = React.useCallback(
      async (method: ModelingMethod, clientId: string) => {
         await syncService.sync(uri, method, clientId);
      },
      [uri, syncService]
   );

   // 强制同步所有
   const forceSyncAll = React.useCallback(async () => {
      await syncService.forceSyncAll(uri);
   }, [uri, syncService]);

   // 解决冲突
   const resolveConflict = React.useCallback(
      async (conflict: SyncConflict, strategy: ConflictResolutionStrategy) => {
         await syncService.resolveConflict(uri, conflict, strategy);
      },
      [uri, syncService]
   );

   // 解决所有冲突
   const resolveAllConflicts = React.useCallback(
      async (strategy: ConflictResolutionStrategy) => {
         await syncService.resolveAllConflicts(uri, strategy);
      },
      [uri, syncService]
   );

   // 重置
   const reset = React.useCallback(() => {
      syncService.reset(uri);
      setStatus(SyncStatus.IDLE);
      setStateInfo(undefined);
      setConflicts([]);
   }, [uri, syncService]);

   // 关闭通知
   const dismissNotification = React.useCallback(
      (id: string) => {
         if (notificationService) {
            notificationService.dismiss(id);
         }
         setNotifications(prev => prev.filter(n => n.id !== id));
      },
      [notificationService]
   );

   // 清除所有通知
   const clearAllNotifications = React.useCallback(() => {
      if (notificationService) {
         notificationService.clearAll();
      }
      setNotifications([]);
   }, [notificationService]);

   return {
      status,
      stateInfo,
      conflicts,
      notifications,
      isSyncing,
      hasConflicts,
      hasError,
      sync,
      forceSyncAll,
      resolveConflict,
      resolveAllConflicts,
      reset,
      dismissNotification,
      clearAllNotifications
   };
}

export default useSyncStatus;
