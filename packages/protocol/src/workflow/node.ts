/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { AutomationAction, NodeType, Position, TestData } from './types';

/**
 * 节点属性接口
 * Node properties interface
 */
export interface NodeProperties {
   description?: string;
   stepDisplay?: boolean;
   [key: string]: unknown;
}

/**
 * 工作流程节点基础接口
 * Workflow node base interface
 */
export interface WorkflowNode {
   id: string;
   type: NodeType;
   name: string;
   properties: NodeProperties;
   position: Position;
   testData?: TestData[];
   automationActions?: AutomationAction[];
}

/**
 * 开始节点接口 - 没有预期值
 * Begin node interface - no expected value
 */
export interface BeginNode extends WorkflowNode {
   type: NodeType.BEGIN;
}

/**
 * 结束节点接口 - 带有预期值
 * End node interface - with expected value
 */
export interface EndNode extends WorkflowNode {
   type: NodeType.END;
   expectedValue: unknown;
}

/**
 * 异常节点接口 - 特殊的结束节点，带有预期值
 * Exception node interface - special end node with expected value
 */
export interface ExceptionNode extends WorkflowNode {
   type: NodeType.EXCEPTION;
   expectedValue: unknown;
}

/**
 * 过程节点接口 - 只允许一条出边
 * Process node interface - only one outgoing edge allowed
 */
export interface ProcessNode extends WorkflowNode {
   type: NodeType.PROCESS;
}

/**
 * 分支条件接口
 * Branch condition interface
 */
export interface BranchCondition {
   id: string;
   value: string;
   isDefault?: boolean;
}

/**
 * 分支节点接口 - 默认两条输出边，所有输出边的值不相同
 * Decision node interface - default two output edges, all edge values must be unique
 */
export interface DecisionNode extends WorkflowNode {
   type: NodeType.DECISION;
   branches: BranchCondition[];
}

/**
 * 子流程节点接口 - 允许嵌套指定页生成的路径
 * Subprocess node interface - allows nested path from specified page
 */
export interface SubprocessNode extends WorkflowNode {
   type: NodeType.SUBPROCESS;
   referencePath: string;
}

/**
 * 并发节点接口 - 支持并行处理的流程节点
 * Concurrent node interface - supports parallel processing
 */
export interface ConcurrentNode extends WorkflowNode {
   type: NodeType.CONCURRENT;
   parallelBranches: string[]; // 并行分支的节点ID列表
}

/**
 * Auto节点接口 - 用于自动化对接的节点
 * Auto node interface - for automation integration
 */
export interface AutoNode extends WorkflowNode {
   type: NodeType.AUTO;
   automationConfig?: Record<string, unknown>;
}

/**
 * API节点接口 - 用于绑定统一自动化平台单接口实例的节点
 * API node interface - for binding unified automation platform single interface instance
 */
export interface ApiNode extends WorkflowNode {
   type: NodeType.API;
   apiEndpoint?: string;
   apiConfig?: Record<string, unknown>;
}

/**
 * 引用节点接口 - 只允许编辑节点名称和步骤显示按钮
 * Reference node interface - only name and stepDisplay can be edited
 */
export interface ReferenceNode extends WorkflowNode {
   sourceNodeId: string;
   isReference: true;
   editableProperties: readonly ['name', 'stepDisplay'];
}

/**
 * 所有节点类型的联合类型
 * Union type of all node types
 */
export type AnyWorkflowNode =
   | BeginNode
   | EndNode
   | ExceptionNode
   | ProcessNode
   | DecisionNode
   | SubprocessNode
   | ConcurrentNode
   | AutoNode
   | ApiNode;

/**
 * 类型守卫函数
 * Type guard functions
 */
export function isBeginNode(node: WorkflowNode): node is BeginNode {
   return node.type === NodeType.BEGIN;
}

export function isEndNode(node: WorkflowNode): node is EndNode {
   return node.type === NodeType.END;
}

export function isExceptionNode(node: WorkflowNode): node is ExceptionNode {
   return node.type === NodeType.EXCEPTION;
}

export function isProcessNode(node: WorkflowNode): node is ProcessNode {
   return node.type === NodeType.PROCESS;
}

export function isDecisionNode(node: WorkflowNode): node is DecisionNode {
   return node.type === NodeType.DECISION;
}

export function isSubprocessNode(node: WorkflowNode): node is SubprocessNode {
   return node.type === NodeType.SUBPROCESS;
}

export function isConcurrentNode(node: WorkflowNode): node is ConcurrentNode {
   return node.type === NodeType.CONCURRENT;
}

export function isAutoNode(node: WorkflowNode): node is AutoNode {
   return node.type === NodeType.AUTO;
}

export function isApiNode(node: WorkflowNode): node is ApiNode {
   return node.type === NodeType.API;
}

export function isReferenceNode(node: WorkflowNode): node is ReferenceNode {
   return 'isReference' in node && node.isReference === true;
}

/**
 * 检查节点是否支持引用
 * Check if node supports reference
 */
export function supportsReference(node: WorkflowNode): boolean {
   const referenceableTypes: NodeType[] = [
      NodeType.BEGIN,
      NodeType.END,
      NodeType.PROCESS,
      NodeType.DECISION,
      NodeType.DECISION_TABLE,
      NodeType.AUTO,
      NodeType.EXCEPTION
   ];
   return referenceableTypes.includes(node.type);
}
