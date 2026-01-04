/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 同步状态枚举
 * Synchronization status enumeration
 */
export enum SyncStatus {
   IDLE = 'idle',
   SYNCING = 'syncing',
   SYNCED = 'synced',
   CONFLICT = 'conflict',
   ERROR = 'error'
}

/**
 * 建模方式类型
 * Modeling method type
 */
export type ModelingMethod = 'text' | 'graphical' | 'form';

/**
 * 同步事件接口
 * Synchronization event interface
 */
export interface SyncEvent {
   uri: string;
   sourceMethod: ModelingMethod;
   sourceClientId: string;
   timestamp: number;
   version: number;
   changeType: 'create' | 'update' | 'delete';
}

/**
 * 同步冲突接口
 * Synchronization conflict interface
 */
export interface SyncConflict {
   uri: string;
   localVersion: number;
   remoteVersion: number;
   localMethod: ModelingMethod;
   remoteMethod: ModelingMethod;
   localTimestamp: number;
   remoteTimestamp: number;
   conflictType: 'version_mismatch' | 'concurrent_edit' | 'data_inconsistency';
   description: string;
}

/**
 * 冲突解决策略
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy = 'use_local' | 'use_remote' | 'merge' | 'manual';

/**
 * 同步状态信息接口
 * Synchronization state info interface
 */
export interface SyncStateInfo {
   uri: string;
   status: SyncStatus;
   lastSyncTime?: number;
   pendingChanges: number;
   activeConflicts: SyncConflict[];
   connectedClients: string[];
}

/**
 * 同步配置接口
 * Synchronization configuration interface
 */
export interface SyncConfig {
   /** 自动同步间隔（毫秒） */
   autoSyncInterval: number;
   /** 是否启用自动同步 */
   autoSyncEnabled: boolean;
   /** 默认冲突解决策略 */
   defaultConflictResolution: ConflictResolutionStrategy;
   /** 同步超时时间（毫秒） */
   syncTimeout: number;
   /** 最大重试次数 */
   maxRetries: number;
}

/**
 * 默认同步配置
 * Default synchronization configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
   autoSyncInterval: 500,
   autoSyncEnabled: true,
   defaultConflictResolution: 'use_remote',
   syncTimeout: 5000,
   maxRetries: 3
};

/**
 * 同步结果接口
 * Synchronization result interface
 */
export interface SyncResult {
   success: boolean;
   uri: string;
   syncedVersion?: number;
   error?: string;
   conflicts?: SyncConflict[];
   resolvedConflicts?: SyncConflict[];
}

/**
 * 同步监听器接口
 * Synchronization listener interface
 */
export interface SyncListener {
   onSyncStart?: (event: SyncEvent) => void;
   onSyncComplete?: (result: SyncResult) => void;
   onSyncError?: (error: Error, event: SyncEvent) => void;
   onConflictDetected?: (conflict: SyncConflict) => void;
   onConflictResolved?: (conflict: SyncConflict, strategy: ConflictResolutionStrategy) => void;
   onStatusChange?: (uri: string, oldStatus: SyncStatus, newStatus: SyncStatus) => void;
}

/**
 * 版本信息接口
 * Version info interface
 */
export interface VersionInfo {
   version: number;
   timestamp: number;
   clientId: string;
   method: ModelingMethod;
   checksum?: string;
}

/**
 * 计算简单的字符串校验和
 * Calculate simple string checksum
 */
export function calculateChecksum(content: string): string {
   let hash = 0;
   for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
   }
   return hash.toString(16);
}

/**
 * 检测是否存在冲突
 * Detect if there is a conflict
 */
export function detectConflict(localVersion: VersionInfo, remoteVersion: VersionInfo): SyncConflict | undefined {
   // 如果版本相同且校验和相同，没有冲突
   if (localVersion.version === remoteVersion.version && localVersion.checksum === remoteVersion.checksum) {
      return undefined;
   }

   // 如果远程版本更新，没有冲突（直接使用远程版本）
   if (remoteVersion.version > localVersion.version) {
      return undefined;
   }

   // 如果本地版本更新，没有冲突（本地更改将被推送）
   if (localVersion.version > remoteVersion.version) {
      return undefined;
   }

   // 版本相同但校验和不同，存在数据不一致冲突
   if (localVersion.version === remoteVersion.version && localVersion.checksum !== remoteVersion.checksum) {
      return {
         uri: '',
         localVersion: localVersion.version,
         remoteVersion: remoteVersion.version,
         localMethod: localVersion.method,
         remoteMethod: remoteVersion.method,
         localTimestamp: localVersion.timestamp,
         remoteTimestamp: remoteVersion.timestamp,
         conflictType: 'data_inconsistency',
         description: `Data inconsistency detected: same version (${localVersion.version}) but different content`
      };
   }

   // 并发编辑冲突
   const timeDiff = Math.abs(localVersion.timestamp - remoteVersion.timestamp);
   if (timeDiff < 1000) {
      // 1秒内的编辑视为并发
      return {
         uri: '',
         localVersion: localVersion.version,
         remoteVersion: remoteVersion.version,
         localMethod: localVersion.method,
         remoteMethod: remoteVersion.method,
         localTimestamp: localVersion.timestamp,
         remoteTimestamp: remoteVersion.timestamp,
         conflictType: 'concurrent_edit',
         description: `Concurrent edit detected from ${localVersion.method} and ${remoteVersion.method}`
      };
   }

   return undefined;
}

/**
 * 创建同步事件
 * Create sync event
 */
export function createSyncEvent(
   uri: string,
   sourceMethod: ModelingMethod,
   sourceClientId: string,
   version: number,
   changeType: 'create' | 'update' | 'delete'
): SyncEvent {
   return {
      uri,
      sourceMethod,
      sourceClientId,
      timestamp: Date.now(),
      version,
      changeType
   };
}

/**
 * 创建版本信息
 * Create version info
 */
export function createVersionInfo(version: number, clientId: string, method: ModelingMethod, content?: string): VersionInfo {
   return {
      version,
      timestamp: Date.now(),
      clientId,
      method,
      checksum: content ? calculateChecksum(content) : undefined
   };
}
