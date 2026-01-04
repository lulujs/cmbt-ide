/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程验证错误代码命名空间
 * Workflow validation error codes namespace
 */
export namespace WorkflowValidationErrors {
   // ============================================
   // 节点相关错误代码 (Node-related error codes)
   // ============================================

   // 开始节点错误
   export const BeginNodeHasExpectedValue = 'workflow.begin-node.has-expected-value';
   export const BeginNodeMissingName = 'workflow.begin-node.missing-name';

   // 结束节点错误
   export const EndNodeMissingExpectedValue = 'workflow.end-node.missing-expected-value';
   export const EndNodeMissingName = 'workflow.end-node.missing-name';

   // 异常节点错误
   export const ExceptionNodeMissingExpectedValue = 'workflow.exception-node.missing-expected-value';
   export const ExceptionNodeMissingName = 'workflow.exception-node.missing-name';

   // 过程节点错误
   export const ProcessNodeMultipleOutgoingEdges = 'workflow.process-node.multiple-outgoing-edges';
   export const ProcessNodeMissingName = 'workflow.process-node.missing-name';

   // 分支节点错误
   export const DecisionNodeDuplicateBranchValues = 'workflow.decision-node.duplicate-branch-values';
   export const DecisionNodeInsufficientBranches = 'workflow.decision-node.insufficient-branches';
   export const DecisionNodeMissingName = 'workflow.decision-node.missing-name';
   export const DecisionNodeEmptyBranchValue = 'workflow.decision-node.empty-branch-value';

   // 决策表节点错误
   export const DecisionTableMissingDecisionColumns = 'workflow.decision-table.missing-decision-columns';
   export const DecisionTableMissingOutputColumns = 'workflow.decision-table.missing-output-columns';
   export const DecisionTableDuplicateDecisionRows = 'workflow.decision-table.duplicate-decision-rows';
   export const DecisionTableMissingName = 'workflow.decision-table.missing-name';
   export const DecisionTableEmptyRows = 'workflow.decision-table.empty-rows';
   export const DecisionTableDuplicateColumnIds = 'workflow.decision-table.duplicate-column-ids';
   export const DecisionTableDuplicateRowIds = 'workflow.decision-table.duplicate-row-ids';

   // 子流程节点错误
   export const SubprocessNodeMissingReferencePath = 'workflow.subprocess-node.missing-reference-path';
   export const SubprocessNodeInvalidReferencePath = 'workflow.subprocess-node.invalid-reference-path';
   export const SubprocessNodeMissingName = 'workflow.subprocess-node.missing-name';

   // 并发节点错误
   export const ConcurrentNodeContainsBeginNode = 'workflow.concurrent-node.contains-begin-node';
   export const ConcurrentNodeContainsEndNode = 'workflow.concurrent-node.contains-end-node';
   export const ConcurrentNodeContainsExceptionNode = 'workflow.concurrent-node.contains-exception-node';
   export const ConcurrentNodeContainsCycle = 'workflow.concurrent-node.contains-cycle';
   export const ConcurrentNodeEmptyBranches = 'workflow.concurrent-node.empty-branches';
   export const ConcurrentNodeMissingName = 'workflow.concurrent-node.missing-name';
   export const ConcurrentNodeDisconnectedNodes = 'workflow.concurrent-node.disconnected-nodes';

   // Auto节点错误
   export const AutoNodeMissingName = 'workflow.auto-node.missing-name';
   export const AutoNodeMissingConfig = 'workflow.auto-node.missing-config';

   // API节点错误
   export const ApiNodeMissingName = 'workflow.api-node.missing-name';
   export const ApiNodeMissingEndpoint = 'workflow.api-node.missing-endpoint';
   export const ApiNodeInvalidEndpoint = 'workflow.api-node.invalid-endpoint';

   // 引用节点错误
   export const ReferenceNodeMissingSourceId = 'workflow.reference-node.missing-source-id';
   export const ReferenceNodeSourceNotFound = 'workflow.reference-node.source-not-found';
   export const ReferenceNodeInvalidEdit = 'workflow.reference-node.invalid-edit';

   // ============================================
   // 边相关错误代码 (Edge-related error codes)
   // ============================================
   export const EdgeMissingSource = 'workflow.edge.missing-source';
   export const EdgeMissingTarget = 'workflow.edge.missing-target';
   export const EdgeSourceNotFound = 'workflow.edge.source-not-found';
   export const EdgeTargetNotFound = 'workflow.edge.target-not-found';
   export const EdgeSelfLoop = 'workflow.edge.self-loop';
   export const EdgeDuplicate = 'workflow.edge.duplicate';

   // ============================================
   // 泳道相关错误代码 (Swimlane-related error codes)
   // ============================================
   export const SwimlaneMissingName = 'workflow.swimlane.missing-name';
   export const SwimlaneInvalidSize = 'workflow.swimlane.invalid-size';
   export const SwimlaneDuplicateNodeIds = 'workflow.swimlane.duplicate-node-ids';
   export const SwimlaneNodeNotFound = 'workflow.swimlane.node-not-found';

   // ============================================
   // 工作流程模型相关错误代码 (Workflow model error codes)
   // ============================================
   export const WorkflowMissingName = 'workflow.model.missing-name';
   export const WorkflowEmptyNodes = 'workflow.model.empty-nodes';
   export const WorkflowMissingBeginNode = 'workflow.model.missing-begin-node';
   export const WorkflowMissingEndNode = 'workflow.model.missing-end-node';
   export const WorkflowMultipleBeginNodes = 'workflow.model.multiple-begin-nodes';
   export const WorkflowDisconnectedNodes = 'workflow.model.disconnected-nodes';
   export const WorkflowContainsCycle = 'workflow.model.contains-cycle';

   // ============================================
   // 测试数据相关错误代码 (Test data error codes)
   // ============================================
   export const TestDataMissingName = 'workflow.test-data.missing-name';
   export const TestDataMissingEdgeBinding = 'workflow.test-data.missing-edge-binding';
   export const TestDataInvalidEdgeBinding = 'workflow.test-data.invalid-edge-binding';

   // ============================================
   // 自动化动作相关错误代码 (Automation action error codes)
   // ============================================
   export const AutomationActionMissingName = 'workflow.automation-action.missing-name';
   export const AutomationActionMissingType = 'workflow.automation-action.missing-type';
   export const AutomationActionMissingEdgeBinding = 'workflow.automation-action.missing-edge-binding';
   export const AutomationActionInvalidConfig = 'workflow.automation-action.invalid-config';

   // ============================================
   // 辅助函数 (Helper functions)
   // ============================================

   /**
    * 检查错误代码是否为节点相关错误
    * Check if error code is node-related
    */
   export function isNodeError(code: string): boolean {
      return code.startsWith('workflow.') && code.includes('-node.');
   }

   /**
    * 检查错误代码是否为边相关错误
    * Check if error code is edge-related
    */
   export function isEdgeError(code: string): boolean {
      return code.startsWith('workflow.edge.');
   }

   /**
    * 检查错误代码是否为泳道相关错误
    * Check if error code is swimlane-related
    */
   export function isSwimlaneError(code: string): boolean {
      return code.startsWith('workflow.swimlane.');
   }

   /**
    * 检查错误代码是否为工作流程模型相关错误
    * Check if error code is workflow model-related
    */
   export function isWorkflowModelError(code: string): boolean {
      return code.startsWith('workflow.model.');
   }

   /**
    * 检查错误代码是否为决策表相关错误
    * Check if error code is decision table-related
    */
   export function isDecisionTableError(code: string): boolean {
      return code.startsWith('workflow.decision-table.');
   }

   /**
    * 检查错误代码是否为并发流程相关错误
    * Check if error code is concurrent process-related
    */
   export function isConcurrentError(code: string): boolean {
      return code.startsWith('workflow.concurrent-node.');
   }

   /**
    * 获取错误代码的节点类型
    * Get node type from error code
    */
   export function getNodeTypeFromCode(code: string): string | undefined {
      const match = code.match(/workflow\.([a-z-]+)-node\./);
      return match ? match[1] : undefined;
   }
}

/**
 * 工作流程验证错误严重程度
 * Workflow validation error severity
 */
export type WorkflowValidationSeverity = 'error' | 'warning' | 'info';

/**
 * 工作流程验证错误接口
 * Workflow validation error interface
 */
export interface WorkflowValidationError {
   code: string;
   message: string;
   messageZh: string; // 中文消息
   severity: WorkflowValidationSeverity;
   nodeId?: string;
   nodeName?: string;
   nodeType?: string;
   property?: string;
   suggestion?: string;
   suggestionZh?: string; // 中文建议
}

/**
 * 工作流程验证结果接口
 * Workflow validation result interface
 */
export interface WorkflowValidationResult {
   isValid: boolean;
   errors: WorkflowValidationError[];
   warnings: WorkflowValidationError[];
   infos: WorkflowValidationError[];
}

/**
 * 创建空的验证结果
 * Create empty validation result
 */
export function createEmptyValidationResult(): WorkflowValidationResult {
   return {
      isValid: true,
      errors: [],
      warnings: [],
      infos: []
   };
}

/**
 * 合并验证结果
 * Merge validation results
 */
export function mergeValidationResults(...results: WorkflowValidationResult[]): WorkflowValidationResult {
   const merged = createEmptyValidationResult();

   for (const result of results) {
      merged.errors.push(...result.errors);
      merged.warnings.push(...result.warnings);
      merged.infos.push(...result.infos);
   }

   merged.isValid = merged.errors.length === 0;
   return merged;
}

/**
 * 添加错误到验证结果
 * Add error to validation result
 */
export function addValidationError(result: WorkflowValidationResult, error: WorkflowValidationError): void {
   switch (error.severity) {
      case 'error':
         result.errors.push(error);
         result.isValid = false;
         break;
      case 'warning':
         result.warnings.push(error);
         break;
      case 'info':
         result.infos.push(error);
         break;
   }
}
