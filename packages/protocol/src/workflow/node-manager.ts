/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   AnyWorkflowNode,
   ApiNode,
   AutoNode,
   BeginNode,
   BranchCondition,
   ConcurrentNode,
   DecisionNode,
   EndNode,
   ExceptionNode,
   NodeProperties,
   ProcessNode,
   ReferenceNode,
   SubprocessNode,
   WorkflowNode
} from './node';
import { NodeType, Position } from './types';

/**
 * 节点验证结果接口
 * Node validation result interface
 */
export interface NodeValidationResult {
   isValid: boolean;
   errors: string[];
   warnings?: string[];
}

/**
 * 节点创建参数接口
 * Node creation parameters interface
 */
export interface CreateNodeParams {
   id: string;
   name: string;
   position: Position;
   properties?: NodeProperties;
}

/**
 * 节点管理器基类
 * Base node manager class
 */
export abstract class BaseNodeManager<T extends WorkflowNode> {
   protected node: T;

   constructor(node: T) {
      this.node = node;
   }

   /**
    * 获取节点
    * Get the node
    */
   getNode(): T {
      return this.node;
   }

   /**
    * 更新节点属性
    * Update node properties
    */
   updateProperties(properties: Partial<NodeProperties>): void {
      this.node.properties = { ...this.node.properties, ...properties };
   }

   /**
    * 更新节点位置
    * Update node position
    */
   updatePosition(position: Position): void {
      this.node.position = position;
   }

   /**
    * 更新节点名称
    * Update node name
    */
   updateName(name: string): void {
      this.node.name = name;
   }

   /**
    * 验证节点
    * Validate the node
    */
   abstract validate(outgoingEdgeCount?: number): NodeValidationResult;
}

/**
 * 开始节点管理器
 * Begin node manager - 需求 1.1: 开始节点没有预期值
 */
export class BeginNodeManager extends BaseNodeManager<BeginNode> {
   constructor(params: CreateNodeParams) {
      const node: BeginNode = {
         id: params.id,
         type: NodeType.BEGIN,
         name: params.name,
         position: params.position,
         properties: params.properties || {}
      };
      super(node);
   }

   /**
    * 验证开始节点
    * Validate begin node
    * 属性 1: 开始节点无预期值约束
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 开始节点不应该有预期值
      if ('expectedValue' in this.node) {
         errors.push(`开始节点 "${this.node.name}" 不应该有预期值 (Begin node should not have expected value)`);
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`开始节点应该有一个名称 (Begin node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 结束节点管理器
 * End node manager - 需求 1.2: 结束节点带有预期值
 */
export class EndNodeManager extends BaseNodeManager<EndNode> {
   constructor(params: CreateNodeParams & { expectedValue?: unknown }) {
      const node: EndNode = {
         id: params.id,
         type: NodeType.END,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         expectedValue: params.expectedValue ?? null
      };
      super(node);
   }

   /**
    * 设置预期值
    * Set expected value
    */
   setExpectedValue(value: unknown): void {
      this.node.expectedValue = value;
   }

   /**
    * 获取预期值
    * Get expected value
    */
   getExpectedValue(): unknown {
      return this.node.expectedValue;
   }

   /**
    * 验证结束节点
    * Validate end node
    * 属性 2: 结束节点预期值约束
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 结束节点必须有预期值属性（即使值为null）
      // EndNode type guarantees expectedValue property exists
      // This validation is for runtime safety when dealing with external data
      if (!Object.prototype.hasOwnProperty.call(this.node, 'expectedValue')) {
         errors.push(`结束节点 "${this.node.name}" 必须有预期值属性 (End node must have expectedValue property)`);
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`结束节点应该有一个名称 (End node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 异常节点管理器
 * Exception node manager - 需求 1.3: 异常节点是特殊的结束节点，带有预期值
 */
export class ExceptionNodeManager extends BaseNodeManager<ExceptionNode> {
   constructor(params: CreateNodeParams & { expectedValue?: unknown }) {
      const node: ExceptionNode = {
         id: params.id,
         type: NodeType.EXCEPTION,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         expectedValue: params.expectedValue ?? null
      };
      super(node);
   }

   /**
    * 设置预期值
    * Set expected value
    */
   setExpectedValue(value: unknown): void {
      this.node.expectedValue = value;
   }

   /**
    * 获取预期值
    * Get expected value
    */
   getExpectedValue(): unknown {
      return this.node.expectedValue;
   }

   /**
    * 验证异常节点
    * Validate exception node
    * 属性 3: 异常节点特殊结束约束
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 异常节点必须有预期值属性（即使值为null）
      // ExceptionNode type guarantees expectedValue property exists
      // This validation is for runtime safety when dealing with external data
      if (!Object.prototype.hasOwnProperty.call(this.node, 'expectedValue')) {
         errors.push(`异常节点 "${this.node.name}" 必须有预期值属性 (Exception node must have expectedValue property)`);
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`异常节点应该有一个名称 (Exception node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 过程节点管理器
 * Process node manager - 需求 1.4: 过程节点只允许一条出边
 */
export class ProcessNodeManager extends BaseNodeManager<ProcessNode> {
   constructor(params: CreateNodeParams) {
      const node: ProcessNode = {
         id: params.id,
         type: NodeType.PROCESS,
         name: params.name,
         position: params.position,
         properties: params.properties || {}
      };
      super(node);
   }

   /**
    * 验证过程节点
    * Validate process node
    * 属性 4: 过程节点出边限制
    */
   validate(outgoingEdgeCount: number = 0): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 过程节点只允许一条出边
      if (outgoingEdgeCount > 1) {
         errors.push(
            `过程节点 "${this.node.name}" 只允许一条出边，当前有 ${outgoingEdgeCount} 条 (Process node allows only one outgoing edge, currently has ${outgoingEdgeCount})`
         );
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`过程节点应该有一个名称 (Process node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 分支节点管理器
 * Decision node manager - 需求 1.5, 1.6: 分支节点默认两条输出边，所有输出边的值不相同
 */
export class DecisionNodeManager extends BaseNodeManager<DecisionNode> {
   constructor(params: CreateNodeParams & { branches?: BranchCondition[] }) {
      const defaultBranches: BranchCondition[] = [
         { id: 'branch_1', value: 'true', isDefault: false },
         { id: 'branch_2', value: 'false', isDefault: true }
      ];

      const node: DecisionNode = {
         id: params.id,
         type: NodeType.DECISION,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         branches: params.branches || defaultBranches
      };
      super(node);
   }

   /**
    * 获取分支
    * Get branches
    */
   getBranches(): BranchCondition[] {
      return this.node.branches;
   }

   /**
    * 添加分支
    * Add branch
    */
   addBranch(branch: BranchCondition): NodeValidationResult {
      // 检查值是否唯一
      const existingValues = this.node.branches.map(b => b.value);
      if (existingValues.includes(branch.value)) {
         return {
            isValid: false,
            errors: [`分支值 "${branch.value}" 已存在 (Branch value "${branch.value}" already exists)`]
         };
      }

      this.node.branches.push(branch);
      return { isValid: true, errors: [] };
   }

   /**
    * 移除分支
    * Remove branch
    */
   removeBranch(branchId: string): boolean {
      const index = this.node.branches.findIndex(b => b.id === branchId);
      if (index > -1) {
         this.node.branches.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 更新分支值
    * Update branch value
    */
   updateBranchValue(branchId: string, newValue: string): NodeValidationResult {
      const branch = this.node.branches.find(b => b.id === branchId);
      if (!branch) {
         return {
            isValid: false,
            errors: [`分支 "${branchId}" 不存在 (Branch "${branchId}" does not exist)`]
         };
      }

      // 检查新值是否与其他分支冲突
      const otherValues = this.node.branches.filter(b => b.id !== branchId).map(b => b.value);
      if (otherValues.includes(newValue)) {
         return {
            isValid: false,
            errors: [`分支值 "${newValue}" 已被其他分支使用 (Branch value "${newValue}" is already used by another branch)`]
         };
      }

      branch.value = newValue;
      return { isValid: true, errors: [] };
   }

   /**
    * 验证分支节点
    * Validate decision node
    * 属性 5: 分支节点默认输出边
    * 属性 6: 分支节点输出边值唯一性
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证分支数量（至少需要两条）
      if (this.node.branches.length < 2) {
         warnings.push(`分支节点 "${this.node.name}" 应该至少有两条分支 (Decision node should have at least two branches)`);
      }

      // 验证分支值唯一性
      const values = this.node.branches.map(b => b.value).filter((v): v is string => v !== undefined && v !== '');
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
         errors.push(`分支节点 "${this.node.name}" 的输出边值必须唯一 (Decision node branch values must be unique)`);
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`分支节点应该有一个名称 (Decision node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 子流程节点管理器
 * Subprocess node manager - 需求 1.8: 子流程节点允许嵌套指定页生成的路径
 */
export class SubprocessNodeManager extends BaseNodeManager<SubprocessNode> {
   constructor(params: CreateNodeParams & { referencePath?: string }) {
      const node: SubprocessNode = {
         id: params.id,
         type: NodeType.SUBPROCESS,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         referencePath: params.referencePath || ''
      };
      super(node);
   }

   /**
    * 设置引用路径
    * Set reference path
    */
   setReferencePath(path: string): void {
      this.node.referencePath = path;
   }

   /**
    * 获取引用路径
    * Get reference path
    */
   getReferencePath(): string {
      return this.node.referencePath;
   }

   /**
    * 验证子流程节点
    * Validate subprocess node
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`子流程节点应该有一个名称 (Subprocess node should have a name)`);
      }

      // 引用路径可以为空，但如果设置了应该是有效的路径格式
      if (this.node.referencePath && this.node.referencePath.trim() === '') {
         warnings.push(`子流程节点 "${this.node.name}" 的引用路径为空 (Subprocess node reference path is empty)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 并发节点管理器
 * Concurrent node manager - 需求 1.9: 并发节点支持并行处理的流程节点
 */
export class ConcurrentNodeManager extends BaseNodeManager<ConcurrentNode> {
   constructor(params: CreateNodeParams & { parallelBranches?: string[] }) {
      const node: ConcurrentNode = {
         id: params.id,
         type: NodeType.CONCURRENT,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         parallelBranches: params.parallelBranches || []
      };
      super(node);
   }

   /**
    * 获取并行分支
    * Get parallel branches
    */
   getParallelBranches(): string[] {
      return this.node.parallelBranches;
   }

   /**
    * 添加并行分支节点
    * Add parallel branch node
    */
   addParallelBranch(nodeId: string): void {
      if (!this.node.parallelBranches.includes(nodeId)) {
         this.node.parallelBranches.push(nodeId);
      }
   }

   /**
    * 移除并行分支节点
    * Remove parallel branch node
    */
   removeParallelBranch(nodeId: string): boolean {
      const index = this.node.parallelBranches.indexOf(nodeId);
      if (index > -1) {
         this.node.parallelBranches.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 验证并发节点
    * Validate concurrent node
    * 需求 6.1-6.4: 并发流程的结构约束
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`并发节点应该有一个名称 (Concurrent node should have a name)`);
      }

      // 并发节点应该有并行分支
      if (this.node.parallelBranches.length === 0) {
         warnings.push(`并发节点 "${this.node.name}" 没有并行分支 (Concurrent node has no parallel branches)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }

   /**
    * 验证并发流程中是否包含非法节点类型
    * Validate that concurrent process does not contain illegal node types
    * @param nodeTypes 并行分支中节点的类型映射
    */
   validateNoIllegalNodes(nodeTypes: Map<string, NodeType>): NodeValidationResult {
      const errors: string[] = [];

      for (const nodeId of this.node.parallelBranches) {
         const nodeType = nodeTypes.get(nodeId);
         if (nodeType === NodeType.BEGIN) {
            errors.push(`并发流程 "${this.node.name}" 不能包含开始节点 (Concurrent process cannot contain begin node)`);
         }
         if (nodeType === NodeType.END) {
            errors.push(`并发流程 "${this.node.name}" 不能包含结束节点 (Concurrent process cannot contain end node)`);
         }
      }

      return {
         isValid: errors.length === 0,
         errors
      };
   }
}

/**
 * Auto节点管理器
 * Auto node manager - 需求 1.10: Auto节点用于自动化对接
 */
export class AutoNodeManager extends BaseNodeManager<AutoNode> {
   constructor(params: CreateNodeParams & { automationConfig?: Record<string, unknown> }) {
      const node: AutoNode = {
         id: params.id,
         type: NodeType.AUTO,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         automationConfig: params.automationConfig
      };
      super(node);
   }

   /**
    * 设置自动化配置
    * Set automation configuration
    */
   setAutomationConfig(config: Record<string, unknown>): void {
      this.node.automationConfig = config;
   }

   /**
    * 获取自动化配置
    * Get automation configuration
    */
   getAutomationConfig(): Record<string, unknown> | undefined {
      return this.node.automationConfig;
   }

   /**
    * 验证Auto节点
    * Validate auto node
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`Auto节点应该有一个名称 (Auto node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * API节点管理器
 * API node manager - 需求 1.11: API节点用于绑定统一自动化平台单接口实例
 */
export class ApiNodeManager extends BaseNodeManager<ApiNode> {
   constructor(params: CreateNodeParams & { apiEndpoint?: string; apiConfig?: Record<string, unknown> }) {
      const node: ApiNode = {
         id: params.id,
         type: NodeType.API,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         apiEndpoint: params.apiEndpoint,
         apiConfig: params.apiConfig
      };
      super(node);
   }

   /**
    * 设置API端点
    * Set API endpoint
    */
   setApiEndpoint(endpoint: string): void {
      this.node.apiEndpoint = endpoint;
   }

   /**
    * 获取API端点
    * Get API endpoint
    */
   getApiEndpoint(): string | undefined {
      return this.node.apiEndpoint;
   }

   /**
    * 设置API配置
    * Set API configuration
    */
   setApiConfig(config: Record<string, unknown>): void {
      this.node.apiConfig = config;
   }

   /**
    * 获取API配置
    * Get API configuration
    */
   getApiConfig(): Record<string, unknown> | undefined {
      return this.node.apiConfig;
   }

   /**
    * 验证API节点
    * Validate API node
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`API节点应该有一个名称 (API node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 引用节点管理器
 * Reference node manager - 需求 4.2-4.5: 引用节点只允许编辑节点名称和步骤显示按钮
 */
export class ReferenceNodeManager extends BaseNodeManager<ReferenceNode> {
   constructor(sourceNode: AnyWorkflowNode, newId: string) {
      const node: ReferenceNode = {
         ...sourceNode,
         id: newId,
         name: `${sourceNode.name} (Reference)`,
         sourceNodeId: sourceNode.id,
         isReference: true,
         editableProperties: ['name', 'stepDisplay'] as const
      };
      super(node);
   }

   /**
    * 获取源节点ID
    * Get source node ID
    */
   getSourceNodeId(): string {
      return this.node.sourceNodeId;
   }

   /**
    * 检查属性是否可编辑
    * Check if property is editable
    */
   isPropertyEditable(propertyName: string): boolean {
      return this.node.editableProperties.includes(propertyName as 'name' | 'stepDisplay');
   }

   /**
    * 更新引用节点属性（只允许编辑name和stepDisplay）
    * Update reference node properties (only name and stepDisplay allowed)
    */
   updateEditableProperty(propertyName: 'name' | 'stepDisplay', value: unknown): NodeValidationResult {
      if (!this.isPropertyEditable(propertyName)) {
         return {
            isValid: false,
            errors: [`属性 "${propertyName}" 不允许在引用节点上编辑 (Property "${propertyName}" is not editable on reference node)`]
         };
      }

      if (propertyName === 'name') {
         this.node.name = value as string;
      } else if (propertyName === 'stepDisplay') {
         this.node.properties.stepDisplay = value as boolean;
      }

      return { isValid: true, errors: [] };
   }

   /**
    * 验证引用节点
    * Validate reference node
    * 属性 12: 引用节点克隆属性
    * 属性 13: 引用节点编辑限制
    */
   validate(): NodeValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证引用节点必须有源节点ID
      if (!this.node.sourceNodeId) {
         errors.push(`引用节点 "${this.node.name}" 必须有源节点ID (Reference node must have source node ID)`);
      }

      // 验证isReference标志
      if (!this.node.isReference) {
         errors.push(`引用节点 "${this.node.name}" 必须设置isReference为true (Reference node must have isReference set to true)`);
      }

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push(`引用节点应该有一个名称 (Reference node should have a name)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }
}

/**
 * 节点工厂类 - 用于创建各种类型的节点管理器
 * Node factory class - for creating various types of node managers
 */
export class NodeFactory {
   private static nodeIdCounter = 0;

   /**
    * 生成唯一的节点ID
    * Generate unique node ID
    */
   static generateNodeId(prefix: string = 'node'): string {
      return `${prefix}_${++this.nodeIdCounter}`;
   }

   /**
    * 重置节点ID计数器
    * Reset node ID counter
    */
   static resetIdCounter(): void {
      this.nodeIdCounter = 0;
   }

   /**
    * 设置节点ID计数器
    * Set node ID counter
    */
   static setIdCounter(value: number): void {
      this.nodeIdCounter = value;
   }

   /**
    * 创建开始节点管理器
    * Create begin node manager
    */
   static createBeginNode(name: string, position: Position, properties?: NodeProperties): BeginNodeManager {
      return new BeginNodeManager({
         id: this.generateNodeId('begin'),
         name,
         position,
         properties
      });
   }

   /**
    * 创建结束节点管理器
    * Create end node manager
    */
   static createEndNode(name: string, position: Position, expectedValue?: unknown, properties?: NodeProperties): EndNodeManager {
      return new EndNodeManager({
         id: this.generateNodeId('end'),
         name,
         position,
         properties,
         expectedValue
      });
   }

   /**
    * 创建异常节点管理器
    * Create exception node manager
    */
   static createExceptionNode(
      name: string,
      position: Position,
      expectedValue?: unknown,
      properties?: NodeProperties
   ): ExceptionNodeManager {
      return new ExceptionNodeManager({
         id: this.generateNodeId('exception'),
         name,
         position,
         properties,
         expectedValue
      });
   }

   /**
    * 创建过程节点管理器
    * Create process node manager
    */
   static createProcessNode(name: string, position: Position, properties?: NodeProperties): ProcessNodeManager {
      return new ProcessNodeManager({
         id: this.generateNodeId('process'),
         name,
         position,
         properties
      });
   }

   /**
    * 创建分支节点管理器
    * Create decision node manager
    */
   static createDecisionNode(
      name: string,
      position: Position,
      branches?: BranchCondition[],
      properties?: NodeProperties
   ): DecisionNodeManager {
      return new DecisionNodeManager({
         id: this.generateNodeId('decision'),
         name,
         position,
         properties,
         branches
      });
   }

   /**
    * 创建子流程节点管理器
    * Create subprocess node manager
    */
   static createSubprocessNode(
      name: string,
      position: Position,
      referencePath?: string,
      properties?: NodeProperties
   ): SubprocessNodeManager {
      return new SubprocessNodeManager({
         id: this.generateNodeId('subprocess'),
         name,
         position,
         properties,
         referencePath
      });
   }

   /**
    * 创建并发节点管理器
    * Create concurrent node manager
    */
   static createConcurrentNode(
      name: string,
      position: Position,
      parallelBranches?: string[],
      properties?: NodeProperties
   ): ConcurrentNodeManager {
      return new ConcurrentNodeManager({
         id: this.generateNodeId('concurrent'),
         name,
         position,
         properties,
         parallelBranches
      });
   }

   /**
    * 创建Auto节点管理器
    * Create auto node manager
    */
   static createAutoNode(
      name: string,
      position: Position,
      automationConfig?: Record<string, unknown>,
      properties?: NodeProperties
   ): AutoNodeManager {
      return new AutoNodeManager({
         id: this.generateNodeId('auto'),
         name,
         position,
         properties,
         automationConfig
      });
   }

   /**
    * 创建API节点管理器
    * Create API node manager
    */
   static createApiNode(
      name: string,
      position: Position,
      apiEndpoint?: string,
      apiConfig?: Record<string, unknown>,
      properties?: NodeProperties
   ): ApiNodeManager {
      return new ApiNodeManager({
         id: this.generateNodeId('api'),
         name,
         position,
         properties,
         apiEndpoint,
         apiConfig
      });
   }

   /**
    * 创建引用节点管理器
    * Create reference node manager
    */
   static createReferenceNode(sourceNode: AnyWorkflowNode): ReferenceNodeManager {
      return new ReferenceNodeManager(sourceNode, this.generateNodeId('ref'));
   }

   /**
    * 根据类型创建节点管理器
    * Create node manager by type
    */
   static createNodeByType(
      type: NodeType,
      name: string,
      position: Position,
      properties?: NodeProperties
   ): BaseNodeManager<AnyWorkflowNode> {
      switch (type) {
         case NodeType.BEGIN:
            return this.createBeginNode(name, position, properties);
         case NodeType.END:
            return this.createEndNode(name, position, undefined, properties);
         case NodeType.EXCEPTION:
            return this.createExceptionNode(name, position, undefined, properties);
         case NodeType.PROCESS:
            return this.createProcessNode(name, position, properties);
         case NodeType.DECISION:
            return this.createDecisionNode(name, position, undefined, properties);
         case NodeType.SUBPROCESS:
            return this.createSubprocessNode(name, position, undefined, properties);
         case NodeType.CONCURRENT:
            return this.createConcurrentNode(name, position, undefined, properties);
         case NodeType.AUTO:
            return this.createAutoNode(name, position, undefined, properties);
         case NodeType.API:
            return this.createApiNode(name, position, undefined, undefined, properties);
         default:
            throw new Error(`Unsupported node type: ${type}`);
      }
   }
}
