/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { SyncConflict, SyncStateInfo, SyncStatus } from '@crossmodel/protocol';
import * as React from 'react';

/**
 * 同步状态指示器属性接口
 * Sync status indicator props interface
 */
export interface SyncStatusIndicatorProps {
   /** 同步状态信息 */
   stateInfo?: SyncStateInfo;
   /** 是否显示详细信息 */
   showDetails?: boolean;
   /** 手动同步回调 */
   onManualSync?: () => void;
   /** 重置回调 */
   onReset?: () => void;
   /** 解决冲突回调 */
   onResolveConflict?: (conflict: SyncConflict, strategy: 'use_local' | 'use_remote' | 'merge') => void;
   /** 自定义类名 */
   className?: string;
}

/**
 * 获取状态图标
 * Get status icon
 */
function getStatusIcon(status: SyncStatus): string {
   switch (status) {
      case SyncStatus.IDLE:
         return '○'; // 空心圆
      case SyncStatus.SYNCING:
         return '◐'; // 半圆
      case SyncStatus.SYNCED:
         return '●'; // 实心圆
      case SyncStatus.CONFLICT:
         return '⚠'; // 警告
      case SyncStatus.ERROR:
         return '✕'; // 错误
      default:
         return '?';
   }
}

/**
 * 获取状态颜色
 * Get status color
 */
function getStatusColor(status: SyncStatus): string {
   switch (status) {
      case SyncStatus.IDLE:
         return '#888888';
      case SyncStatus.SYNCING:
         return '#2196F3';
      case SyncStatus.SYNCED:
         return '#4CAF50';
      case SyncStatus.CONFLICT:
         return '#FF9800';
      case SyncStatus.ERROR:
         return '#F44336';
      default:
         return '#888888';
   }
}

/**
 * 获取状态文本
 * Get status text
 */
function getStatusText(status: SyncStatus): string {
   switch (status) {
      case SyncStatus.IDLE:
         return '空闲';
      case SyncStatus.SYNCING:
         return '同步中...';
      case SyncStatus.SYNCED:
         return '已同步';
      case SyncStatus.CONFLICT:
         return '存在冲突';
      case SyncStatus.ERROR:
         return '同步错误';
      default:
         return '未知状态';
   }
}

/**
 * 格式化时间戳
 * Format timestamp
 */
function formatTimestamp(timestamp?: number): string {
   if (!timestamp) return '从未同步';
   const date = new Date(timestamp);
   return date.toLocaleTimeString();
}

/**
 * 同步状态指示器组件
 * Sync status indicator component
 *
 * 需求 8.4-8.5: 同步状态的可视化指示
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
   stateInfo,
   showDetails = false,
   onManualSync,
   onReset,
   onResolveConflict,
   className
}) => {
   const status = stateInfo?.status ?? SyncStatus.IDLE;
   const icon = getStatusIcon(status);
   const color = getStatusColor(status);
   const text = getStatusText(status);

   const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: 'var(--theia-editor-background, #1e1e1e)',
      border: `1px solid ${color}`,
      fontSize: '12px'
   };

   const iconStyle: React.CSSProperties = {
      color,
      fontSize: '14px',
      animation: status === SyncStatus.SYNCING ? 'spin 1s linear infinite' : 'none'
   };

   const textStyle: React.CSSProperties = {
      color: 'var(--theia-foreground, #cccccc)'
   };

   const buttonStyle: React.CSSProperties = {
      padding: '2px 6px',
      fontSize: '11px',
      border: '1px solid var(--theia-button-border, #555)',
      borderRadius: '3px',
      backgroundColor: 'var(--theia-button-background, #333)',
      color: 'var(--theia-button-foreground, #ccc)',
      cursor: 'pointer'
   };

   return (
      <div className={className} style={containerStyle}>
         <span style={iconStyle}>{icon}</span>
         <span style={textStyle}>{text}</span>

         {showDetails && stateInfo && (
            <>
               {stateInfo.lastSyncTime && (
                  <span style={{ ...textStyle, fontSize: '10px', opacity: 0.7 }}>上次同步: {formatTimestamp(stateInfo.lastSyncTime)}</span>
               )}

               {stateInfo.pendingChanges > 0 && (
                  <span style={{ ...textStyle, fontSize: '10px', color: '#FF9800' }}>待同步: {stateInfo.pendingChanges}</span>
               )}
            </>
         )}

         {/* 操作按钮 */}
         <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            {onManualSync && status !== SyncStatus.SYNCING && (
               <button style={buttonStyle} onClick={onManualSync} title='手动同步'>
                  ↻
               </button>
            )}

            {onReset && (
               <button style={buttonStyle} onClick={onReset} title='重置同步状态'>
                  ⟲
               </button>
            )}
         </div>

         {/* 冲突列表 */}
         {status === SyncStatus.CONFLICT && stateInfo?.activeConflicts && stateInfo.activeConflicts.length > 0 && (
            <ConflictList conflicts={stateInfo.activeConflicts} onResolve={onResolveConflict} />
         )}
      </div>
   );
};

/**
 * 冲突列表属性接口
 * Conflict list props interface
 */
interface ConflictListProps {
   conflicts: SyncConflict[];
   onResolve?: (conflict: SyncConflict, strategy: 'use_local' | 'use_remote' | 'merge') => void;
}

/**
 * 冲突列表组件
 * Conflict list component
 */
const ConflictList: React.FC<ConflictListProps> = ({ conflicts, onResolve }) => {
   const [expanded, setExpanded] = React.useState(false);

   const containerStyle: React.CSSProperties = {
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'var(--theia-editorWidget-background, #252526)',
      borderRadius: '4px',
      border: '1px solid #FF9800'
   };

   const conflictItemStyle: React.CSSProperties = {
      padding: '4px 0',
      borderBottom: '1px solid var(--theia-panel-border, #444)',
      fontSize: '11px'
   };

   const buttonStyle: React.CSSProperties = {
      padding: '2px 6px',
      fontSize: '10px',
      border: '1px solid var(--theia-button-border, #555)',
      borderRadius: '3px',
      backgroundColor: 'var(--theia-button-background, #333)',
      color: 'var(--theia-button-foreground, #ccc)',
      cursor: 'pointer',
      marginRight: '4px'
   };

   return (
      <div style={containerStyle}>
         <div style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '4px' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? '▼' : '▶'} {conflicts.length} 个冲突
         </div>

         {expanded &&
            conflicts.map((conflict, index) => (
               <div key={index} style={conflictItemStyle}>
                  <div style={{ marginBottom: '4px' }}>
                     <strong>{conflict.conflictType}</strong>: {conflict.description}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>
                     本地: {conflict.localMethod} (v{conflict.localVersion}) | 远程: {conflict.remoteMethod} (v{conflict.remoteVersion})
                  </div>
                  {onResolve && (
                     <div style={{ marginTop: '4px' }}>
                        <button style={buttonStyle} onClick={() => onResolve(conflict, 'use_local')}>
                           使用本地
                        </button>
                        <button style={buttonStyle} onClick={() => onResolve(conflict, 'use_remote')}>
                           使用远程
                        </button>
                        <button style={buttonStyle} onClick={() => onResolve(conflict, 'merge')}>
                           合并
                        </button>
                     </div>
                  )}
               </div>
            ))}
      </div>
   );
};

/**
 * CSS 动画样式（需要在全局样式中添加）
 * CSS animation styles (need to add in global styles)
 */
export const syncStatusStyles = `
@keyframes spin {
   from { transform: rotate(0deg); }
   to { transform: rotate(360deg); }
}
`;

export default SyncStatusIndicator;
