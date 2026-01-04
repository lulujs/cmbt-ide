/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowValidationError, WorkflowValidationResult, WorkflowValidationSeverity } from './validation-errors';

/**
 * 验证状态接口
 * Validation status interface
 */
export interface ValidationStatus {
   isValid: boolean;
   errorCount: number;
   warningCount: number;
   infoCount: number;
   lastValidated: Date;
   validationDuration?: number; // 验证耗时（毫秒）
}

/**
 * 验证状态指示器类型
 * Validation status indicator type
 */
export type ValidationIndicatorType = 'success' | 'error' | 'warning' | 'info' | 'pending';

/**
 * 验证状态指示器接口
 * Validation status indicator interface
 */
export interface ValidationStatusIndicator {
   type: ValidationIndicatorType;
   label: string;
   labelZh: string;
   tooltip: string;
   tooltipZh: string;
   color: string;
   icon: string;
}

/**
 * 节点验证状态接口
 * Node validation status interface
 */
export interface NodeValidationStatus {
   nodeId: string;
   nodeName?: string;
   nodeType?: string;
   isValid: boolean;
   errors: WorkflowValidationError[];
   warnings: WorkflowValidationError[];
}

/**
 * 工作流程验证状态摘要接口
 * Workflow validation status summary interface
 */
export interface WorkflowValidationSummary {
   workflowName?: string;
   status: ValidationStatus;
   indicator: ValidationStatusIndicator;
   nodeStatuses: Map<string, NodeValidationStatus>;
   topErrors: WorkflowValidationError[];
   topWarnings: WorkflowValidationError[];
}

/**
 * 创建验证状态
 * Create validation status from validation result
 */
export function createValidationStatus(result: WorkflowValidationResult, duration?: number): ValidationStatus {
   return {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      infoCount: result.infos.length,
      lastValidated: new Date(),
      validationDuration: duration
   };
}

/**
 * 获取验证状态指示器
 * Get validation status indicator
 */
export function getValidationIndicator(status: ValidationStatus): ValidationStatusIndicator {
   if (status.errorCount > 0) {
      return {
         type: 'error',
         label: `${status.errorCount} error(s)`,
         labelZh: `${status.errorCount} 个错误`,
         tooltip: `Workflow has ${status.errorCount} error(s) that need to be fixed`,
         tooltipZh: `工作流程有 ${status.errorCount} 个需要修复的错误`,
         color: '#f44336',
         icon: 'error'
      };
   }

   if (status.warningCount > 0) {
      return {
         type: 'warning',
         label: `${status.warningCount} warning(s)`,
         labelZh: `${status.warningCount} 个警告`,
         tooltip: `Workflow has ${status.warningCount} warning(s) that should be reviewed`,
         tooltipZh: `工作流程有 ${status.warningCount} 个需要检查的警告`,
         color: '#ff9800',
         icon: 'warning'
      };
   }

   if (status.infoCount > 0) {
      return {
         type: 'info',
         label: `${status.infoCount} info(s)`,
         labelZh: `${status.infoCount} 个提示`,
         tooltip: `Workflow has ${status.infoCount} informational message(s)`,
         tooltipZh: `工作流程有 ${status.infoCount} 个提示信息`,
         color: '#2196f3',
         icon: 'info'
      };
   }

   return {
      type: 'success',
      label: 'Valid',
      labelZh: '有效',
      tooltip: 'Workflow is valid with no issues',
      tooltipZh: '工作流程有效，没有问题',
      color: '#4caf50',
      icon: 'check_circle'
   };
}

/**
 * 创建待验证状态指示器
 * Create pending validation indicator
 */
export function getPendingIndicator(): ValidationStatusIndicator {
   return {
      type: 'pending',
      label: 'Validating...',
      labelZh: '验证中...',
      tooltip: 'Workflow validation is in progress',
      tooltipZh: '工作流程验证进行中',
      color: '#9e9e9e',
      icon: 'hourglass_empty'
   };
}

/**
 * 验证状态管理器类
 * Validation status manager class
 */
export class ValidationStatusManager {
   private status: ValidationStatus;
   private nodeStatuses: Map<string, NodeValidationStatus> = new Map();
   private listeners: Array<(status: ValidationStatus) => void> = [];

   constructor() {
      this.status = {
         isValid: true,
         errorCount: 0,
         warningCount: 0,
         infoCount: 0,
         lastValidated: new Date()
      };
   }

   /**
    * 获取当前验证状态
    * Get current validation status
    */
   getStatus(): ValidationStatus {
      return { ...this.status };
   }

   /**
    * 获取验证状态指示器
    * Get validation status indicator
    */
   getIndicator(): ValidationStatusIndicator {
      return getValidationIndicator(this.status);
   }

   /**
    * 获取节点验证状态
    * Get node validation status
    */
   getNodeStatus(nodeId: string): NodeValidationStatus | undefined {
      return this.nodeStatuses.get(nodeId);
   }

   /**
    * 获取所有节点验证状态
    * Get all node validation statuses
    */
   getAllNodeStatuses(): Map<string, NodeValidationStatus> {
      return new Map(this.nodeStatuses);
   }

   /**
    * 更新验证结果
    * Update validation result
    */
   updateFromResult(result: WorkflowValidationResult, duration?: number): void {
      this.status = createValidationStatus(result, duration);

      // 按节点分组错误和警告
      this.nodeStatuses.clear();
      this.groupErrorsByNode(result.errors);
      this.groupErrorsByNode(result.warnings);

      // 通知监听器
      this.notifyListeners();
   }

   /**
    * 按节点分组错误
    * Group errors by node
    */
   private groupErrorsByNode(errors: WorkflowValidationError[]): void {
      for (const error of errors) {
         if (error.nodeId) {
            let nodeStatus = this.nodeStatuses.get(error.nodeId);
            if (!nodeStatus) {
               nodeStatus = {
                  nodeId: error.nodeId,
                  nodeName: error.nodeName,
                  nodeType: error.nodeType,
                  isValid: true,
                  errors: [],
                  warnings: []
               };
               this.nodeStatuses.set(error.nodeId, nodeStatus);
            }

            if (error.severity === 'error') {
               nodeStatus.errors.push(error);
               nodeStatus.isValid = false;
            } else if (error.severity === 'warning') {
               nodeStatus.warnings.push(error);
            }
         }
      }
   }

   /**
    * 添加状态变更监听器
    * Add status change listener
    */
   addListener(listener: (status: ValidationStatus) => void): void {
      this.listeners.push(listener);
   }

   /**
    * 移除状态变更监听器
    * Remove status change listener
    */
   removeListener(listener: (status: ValidationStatus) => void): void {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
         this.listeners.splice(index, 1);
      }
   }

   /**
    * 通知所有监听器
    * Notify all listeners
    */
   private notifyListeners(): void {
      for (const listener of this.listeners) {
         listener(this.status);
      }
   }

   /**
    * 重置验证状态
    * Reset validation status
    */
   reset(): void {
      this.status = {
         isValid: true,
         errorCount: 0,
         warningCount: 0,
         infoCount: 0,
         lastValidated: new Date()
      };
      this.nodeStatuses.clear();
      this.notifyListeners();
   }

   /**
    * 创建验证摘要
    * Create validation summary
    */
   createSummary(workflowName?: string, maxItems: number = 5): WorkflowValidationSummary {
      const allErrors: WorkflowValidationError[] = [];
      const allWarnings: WorkflowValidationError[] = [];

      for (const nodeStatus of this.nodeStatuses.values()) {
         allErrors.push(...nodeStatus.errors);
         allWarnings.push(...nodeStatus.warnings);
      }

      return {
         workflowName,
         status: this.getStatus(),
         indicator: this.getIndicator(),
         nodeStatuses: this.getAllNodeStatuses(),
         topErrors: allErrors.slice(0, maxItems),
         topWarnings: allWarnings.slice(0, maxItems)
      };
   }
}

/**
 * 格式化验证错误为用户友好的消息
 * Format validation error to user-friendly message
 */
export function formatValidationError(error: WorkflowValidationError, useZh: boolean = false): string {
   const message = useZh ? error.messageZh : error.message;
   const suggestion = useZh ? error.suggestionZh : error.suggestion;

   if (suggestion) {
      return `${message}\n建议: ${suggestion}`;
   }
   return message;
}

/**
 * 获取验证错误的严重程度图标
 * Get severity icon for validation error
 */
export function getSeverityIcon(severity: WorkflowValidationSeverity): string {
   switch (severity) {
      case 'error':
         return '❌';
      case 'warning':
         return '⚠️';
      case 'info':
         return 'ℹ️';
      default:
         return '•';
   }
}

/**
 * 获取验证错误的严重程度颜色
 * Get severity color for validation error
 */
export function getSeverityColor(severity: WorkflowValidationSeverity): string {
   switch (severity) {
      case 'error':
         return '#f44336';
      case 'warning':
         return '#ff9800';
      case 'info':
         return '#2196f3';
      default:
         return '#9e9e9e';
   }
}
