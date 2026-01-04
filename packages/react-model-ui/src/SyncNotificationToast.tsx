/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import * as React from 'react';
import { NotificationMessage, NotificationType } from './SyncNotificationService';

/**
 * 通知 Toast 属性接口
 * Notification toast props interface
 */
export interface SyncNotificationToastProps {
   notification: NotificationMessage;
   onDismiss: (id: string) => void;
}

/**
 * 获取通知图标
 * Get notification icon
 */
function getNotificationIcon(type: NotificationType): string {
   switch (type) {
      case 'info':
         return 'ℹ';
      case 'success':
         return '✓';
      case 'warning':
         return '⚠';
      case 'error':
         return '✕';
      default:
         return 'ℹ';
   }
}

/**
 * 获取通知颜色
 * Get notification color
 */
function getNotificationColor(type: NotificationType): string {
   switch (type) {
      case 'info':
         return '#2196F3';
      case 'success':
         return '#4CAF50';
      case 'warning':
         return '#FF9800';
      case 'error':
         return '#F44336';
      default:
         return '#2196F3';
   }
}

/**
 * 同步通知 Toast 组件
 * Sync notification toast component
 */
export const SyncNotificationToast: React.FC<SyncNotificationToastProps> = ({ notification, onDismiss }) => {
   const color = getNotificationColor(notification.type);
   const icon = getNotificationIcon(notification.type);

   const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '4px',
      backgroundColor: 'var(--theia-notifications-background, #252526)',
      border: `1px solid ${color}`,
      borderLeft: `4px solid ${color}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
   };

   const headerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px'
   };

   const titleStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 'bold',
      color: 'var(--theia-foreground, #cccccc)'
   };

   const iconStyle: React.CSSProperties = {
      color,
      fontSize: '16px'
   };

   const closeButtonStyle: React.CSSProperties = {
      background: 'none',
      border: 'none',
      color: 'var(--theia-foreground, #cccccc)',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '0',
      opacity: 0.7
   };

   const messageStyle: React.CSSProperties = {
      color: 'var(--theia-foreground, #cccccc)',
      fontSize: '13px',
      lineHeight: '1.4'
   };

   const actionsStyle: React.CSSProperties = {
      display: 'flex',
      gap: '8px',
      marginTop: '12px'
   };

   const actionButtonStyle: React.CSSProperties = {
      padding: '4px 12px',
      fontSize: '12px',
      border: `1px solid ${color}`,
      borderRadius: '3px',
      backgroundColor: 'transparent',
      color,
      cursor: 'pointer'
   };

   const timestampStyle: React.CSSProperties = {
      fontSize: '10px',
      color: 'var(--theia-descriptionForeground, #888)',
      marginTop: '8px'
   };

   return (
      <div style={containerStyle}>
         <div style={headerStyle}>
            <div style={titleStyle}>
               <span style={iconStyle}>{icon}</span>
               <span>{notification.title}</span>
            </div>
            <button style={closeButtonStyle} onClick={() => onDismiss(notification.id)} title='关闭'>
               ×
            </button>
         </div>

         <div style={messageStyle}>{notification.message}</div>

         {notification.actions && notification.actions.length > 0 && (
            <div style={actionsStyle}>
               {notification.actions.map((action, index) => (
                  <button
                     key={index}
                     style={actionButtonStyle}
                     onClick={() => {
                        action.callback();
                        onDismiss(notification.id);
                     }}
                  >
                     {action.label}
                  </button>
               ))}
            </div>
         )}

         <div style={timestampStyle}>{new Date(notification.timestamp).toLocaleTimeString()}</div>
      </div>
   );
};

/**
 * 通知容器属性接口
 * Notification container props interface
 */
export interface SyncNotificationContainerProps {
   notifications: NotificationMessage[];
   onDismiss: (id: string) => void;
   position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * 同步通知容器组件
 * Sync notification container component
 */
export const SyncNotificationContainer: React.FC<SyncNotificationContainerProps> = ({
   notifications,
   onDismiss,
   position = 'top-right'
}) => {
   const getPositionStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
         position: 'fixed',
         zIndex: 10000,
         display: 'flex',
         flexDirection: 'column'
      };

      switch (position) {
         case 'top-right':
            return { ...base, top: '16px', right: '16px' };
         case 'top-left':
            return { ...base, top: '16px', left: '16px' };
         case 'bottom-right':
            return { ...base, bottom: '16px', right: '16px', flexDirection: 'column-reverse' };
         case 'bottom-left':
            return { ...base, bottom: '16px', left: '16px', flexDirection: 'column-reverse' };
         default:
            return { ...base, top: '16px', right: '16px' };
      }
   };

   if (notifications.length === 0) {
      return null;
   }

   return (
      <div style={getPositionStyle()}>
         {notifications.map(notification => (
            <SyncNotificationToast key={notification.id} notification={notification} onDismiss={onDismiss} />
         ))}
      </div>
   );
};

/**
 * CSS 动画样式
 * CSS animation styles
 */
export const notificationStyles = `
@keyframes slideIn {
   from {
      transform: translateX(100%);
      opacity: 0;
   }
   to {
      transform: translateX(0);
      opacity: 1;
   }
}

@keyframes slideOut {
   from {
      transform: translateX(0);
      opacity: 1;
   }
   to {
      transform: translateX(100%);
      opacity: 0;
   }
}
`;

export default SyncNotificationToast;
