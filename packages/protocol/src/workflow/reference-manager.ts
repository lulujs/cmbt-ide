/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowModel, addNodeToModel } from './model';
import { AnyWorkflowNode, ReferenceNode, WorkflowNode, isReferenceNode, supportsReference } from './node';
import { NodeFactory, NodeValidationResult, ReferenceNodeManager } from './node-manager';
import { NodeType } from './types';

/**
 * 引用创建结果接口
 * Reference creation result interface
 */
export interface ReferenceCreationResult {
   success: boolean;
   referenceNode?: ReferenceNode;
   error?: string;
}

/**
 * 批量引用创建结果接口
 * Batch reference creation result interface
 */
export interface BatchReferenceCreationResult {
   success: boolean;
   referenceNodes: ReferenceNode[];
   errors: Array<{ nodeId: string; error: string }>;
   totalRequested: number;
   totalCreated: number;
}

/**
 * 引用节点编辑结果接口
 * Reference node edit result interface
 */
export interface ReferenceEditResult {
   success: boolean;
   error?: string;
}

/**
 * 可编辑属性类型
 * Editable property type for reference nodes
 */
export type ReferenceEditableProperty = 'name' | 'stepDisplay';

/**
 * 引用管理器类
 * Reference manager class - 需求 4.1-4.5
 *
 * Manages reference nodes in a workflow model, including:
 * - Creating single references
 * - Creating batch references
 * - Enforcing edit restrictions on reference nodes
 * - Tracking reference relationships
 */
export class ReferenceManager {
   private model: WorkflowModel;
   private referenceMap: Map<string, string[]>; // sourceNodeId -> referenceNodeIds[]

   constructor(model: WorkflowModel) {
      this.model = model;
      this.referenceMap = new Map();
      this.buildReferenceMap();
   }

   /**
    * 构建引用映射
    * Build reference map from existing model
    */
   private buildReferenceMap(): void {
      this.referenceMap.clear();
      for (const [nodeId, node] of this.model.nodes) {
         if (isReferenceNode(node)) {
            const sourceId = node.sourceNodeId;
            const refs = this.referenceMap.get(sourceId) || [];
            refs.push(nodeId);
            this.referenceMap.set(sourceId, refs);
         }
      }
   }

   /**
    * 更新模型
    * Update the model reference
    */
   updateModel(model: WorkflowModel): void {
      this.model = model;
      this.buildReferenceMap();
   }

   /**
    * 获取当前模型
    * Get current model
    */
   getModel(): WorkflowModel {
      return this.model;
   }

   /**
    * 检查节点是否支持引用
    * Check if a node supports reference creation
    * 需求 4.1: 支持引用的节点类型（开始、结束、流程、分支、决策表、自动化、异常）
    */
   canCreateReference(nodeId: string): boolean {
      const node = this.model.nodes.get(nodeId);
      if (!node) {
         return false;
      }

      // Reference nodes cannot be referenced again
      if (isReferenceNode(node)) {
         return false;
      }

      return supportsReference(node);
   }

   /**
    * 获取支持引用的节点类型列表
    * Get list of node types that support references
    */
   static getReferenceableNodeTypes(): NodeType[] {
      return [
         NodeType.BEGIN,
         NodeType.END,
         NodeType.PROCESS,
         NodeType.DECISION,
         NodeType.DECISION_TABLE,
         NodeType.AUTO,
         NodeType.EXCEPTION
      ];
   }

   /**
    * 创建单个引用节点
    * Create a single reference node
    * 需求 4.2: 选择单个节点创建引用时，创建一个克隆节点
    * 属性 12: 引用节点克隆属性
    */
   createReference(sourceNodeId: string): ReferenceCreationResult {
      // Check if source node exists
      const sourceNode = this.model.nodes.get(sourceNodeId);
      if (!sourceNode) {
         return {
            success: false,
            error: `源节点 "${sourceNodeId}" 不存在 (Source node "${sourceNodeId}" does not exist)`
         };
      }

      // Check if source node supports reference
      if (!this.canCreateReference(sourceNodeId)) {
         return {
            success: false,
            error: `节点类型 "${sourceNode.type}" 不支持创建引用 (Node type "${sourceNode.type}" does not support reference creation)`
         };
      }

      // Create reference node using factory
      const referenceManager = NodeFactory.createReferenceNode(sourceNode as AnyWorkflowNode);
      const referenceNode = referenceManager.getNode();

      // Validate the reference node
      const validation = referenceManager.validate();
      if (!validation.isValid) {
         return {
            success: false,
            error: validation.errors.join('; ')
         };
      }

      // Add to model
      this.model = addNodeToModel(this.model, referenceNode as unknown as AnyWorkflowNode);

      // Update reference map
      const refs = this.referenceMap.get(sourceNodeId) || [];
      refs.push(referenceNode.id);
      this.referenceMap.set(sourceNodeId, refs);

      return {
         success: true,
         referenceNode
      };
   }

   /**
    * 批量创建引用节点
    * Create multiple reference nodes at once
    * 需求 4.3: 选择多个节点批量创建引用时，为每个节点创建对应的克隆节点
    */
   createBatchReferences(sourceNodeIds: string[]): BatchReferenceCreationResult {
      const referenceNodes: ReferenceNode[] = [];
      const errors: Array<{ nodeId: string; error: string }> = [];

      for (const nodeId of sourceNodeIds) {
         const result = this.createReference(nodeId);
         if (result.success && result.referenceNode) {
            referenceNodes.push(result.referenceNode);
         } else {
            errors.push({
               nodeId,
               error: result.error || '未知错误 (Unknown error)'
            });
         }
      }

      return {
         success: errors.length === 0,
         referenceNodes,
         errors,
         totalRequested: sourceNodeIds.length,
         totalCreated: referenceNodes.length
      };
   }

   /**
    * 检查属性是否可在引用节点上编辑
    * Check if a property can be edited on a reference node
    * 需求 4.4: 引用节点只允许修改节点名称和步骤显示按钮
    * 属性 13: 引用节点编辑限制
    */
   isPropertyEditable(propertyName: string): boolean {
      const editableProperties: ReferenceEditableProperty[] = ['name', 'stepDisplay'];
      return editableProperties.includes(propertyName as ReferenceEditableProperty);
   }

   /**
    * 编辑引用节点属性
    * Edit a reference node property
    * 需求 4.4-4.5: 只允许修改节点名称和步骤显示按钮，其他数据保持与源节点一致
    */
   editReferenceNode(referenceNodeId: string, propertyName: string, value: unknown): ReferenceEditResult {
      const node = this.model.nodes.get(referenceNodeId);

      if (!node) {
         return {
            success: false,
            error: `引用节点 "${referenceNodeId}" 不存在 (Reference node "${referenceNodeId}" does not exist)`
         };
      }

      if (!isReferenceNode(node)) {
         return {
            success: false,
            error: `节点 "${referenceNodeId}" 不是引用节点 (Node "${referenceNodeId}" is not a reference node)`
         };
      }

      // Check if property is editable
      if (!this.isPropertyEditable(propertyName)) {
         return {
            success: false,
            error: `属性 "${propertyName}" 不允许在引用节点上编辑 (Property "${propertyName}" is not editable on reference node)`
         };
      }

      // Apply the edit
      if (propertyName === 'name') {
         (node as ReferenceNode).name = value as string;
      } else if (propertyName === 'stepDisplay') {
         (node as ReferenceNode).properties.stepDisplay = value as boolean;
      }

      // Update the model
      const newNodes = new Map(this.model.nodes);
      newNodes.set(referenceNodeId, node);
      this.model = {
         ...this.model,
         nodes: newNodes,
         metadata: {
            ...this.model.metadata,
            updatedAt: new Date().toISOString()
         }
      };

      return { success: true };
   }

   /**
    * 获取节点的所有引用
    * Get all references for a source node
    */
   getReferencesForNode(sourceNodeId: string): ReferenceNode[] {
      const refIds = this.referenceMap.get(sourceNodeId) || [];
      const references: ReferenceNode[] = [];

      for (const refId of refIds) {
         const node = this.model.nodes.get(refId);
         if (node && isReferenceNode(node)) {
            references.push(node);
         }
      }

      return references;
   }

   /**
    * 获取引用节点的源节点
    * Get the source node for a reference node
    */
   getSourceNode(referenceNodeId: string): WorkflowNode | undefined {
      const refNode = this.model.nodes.get(referenceNodeId);
      if (!refNode || !isReferenceNode(refNode)) {
         return undefined;
      }

      return this.model.nodes.get(refNode.sourceNodeId);
   }

   /**
    * 检查节点是否是引用节点
    * Check if a node is a reference node
    */
   isReference(nodeId: string): boolean {
      const node = this.model.nodes.get(nodeId);
      return node ? isReferenceNode(node) : false;
   }

   /**
    * 获取所有引用节点
    * Get all reference nodes in the model
    */
   getAllReferenceNodes(): ReferenceNode[] {
      const references: ReferenceNode[] = [];
      for (const node of this.model.nodes.values()) {
         if (isReferenceNode(node)) {
            references.push(node);
         }
      }
      return references;
   }

   /**
    * 删除引用节点
    * Delete a reference node
    */
   deleteReference(referenceNodeId: string): boolean {
      const node = this.model.nodes.get(referenceNodeId);
      if (!node || !isReferenceNode(node)) {
         return false;
      }

      // Remove from reference map
      const sourceId = node.sourceNodeId;
      const refs = this.referenceMap.get(sourceId);
      if (refs) {
         const index = refs.indexOf(referenceNodeId);
         if (index > -1) {
            refs.splice(index, 1);
            if (refs.length === 0) {
               this.referenceMap.delete(sourceId);
            }
         }
      }

      // Remove from model
      const newNodes = new Map(this.model.nodes);
      newNodes.delete(referenceNodeId);
      this.model = {
         ...this.model,
         nodes: newNodes,
         metadata: {
            ...this.model.metadata,
            updatedAt: new Date().toISOString()
         }
      };

      return true;
   }

   /**
    * 验证引用节点
    * Validate a reference node
    */
   validateReferenceNode(referenceNodeId: string): NodeValidationResult {
      const node = this.model.nodes.get(referenceNodeId);

      if (!node) {
         return {
            isValid: false,
            errors: [`引用节点 "${referenceNodeId}" 不存在 (Reference node "${referenceNodeId}" does not exist)`]
         };
      }

      if (!isReferenceNode(node)) {
         return {
            isValid: false,
            errors: [`节点 "${referenceNodeId}" 不是引用节点 (Node "${referenceNodeId}" is not a reference node)`]
         };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check source node exists
      const sourceNode = this.model.nodes.get(node.sourceNodeId);
      if (!sourceNode) {
         errors.push(
            `引用节点 "${node.name}" 的源节点 "${node.sourceNodeId}" 不存在 (Source node "${node.sourceNodeId}" for reference "${node.name}" does not exist)`
         );
      }

      // Check isReference flag
      if (!node.isReference) {
         errors.push(`引用节点 "${node.name}" 必须设置 isReference 为 true (Reference node must have isReference set to true)`);
      }

      // Check editableProperties
      if (!node.editableProperties || !node.editableProperties.includes('name') || !node.editableProperties.includes('stepDisplay')) {
         warnings.push(`引用节点 "${node.name}" 的可编辑属性配置不正确 (Reference node editable properties are not correctly configured)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }

   /**
    * 同步引用节点与源节点
    * Sync reference node with source node (except editable properties)
    * 需求 4.5: 引用节点的其他数据保持与源节点一致
    */
   syncReferenceWithSource(referenceNodeId: string): ReferenceEditResult {
      const refNode = this.model.nodes.get(referenceNodeId);

      if (!refNode || !isReferenceNode(refNode)) {
         return {
            success: false,
            error: `节点 "${referenceNodeId}" 不是引用节点 (Node "${referenceNodeId}" is not a reference node)`
         };
      }

      const sourceNode = this.model.nodes.get(refNode.sourceNodeId);
      if (!sourceNode) {
         return {
            success: false,
            error: `源节点 "${refNode.sourceNodeId}" 不存在 (Source node "${refNode.sourceNodeId}" does not exist)`
         };
      }

      // Preserve editable properties
      const preservedName = refNode.name;
      const preservedStepDisplay = refNode.properties.stepDisplay;

      // Create updated reference node with source properties
      const updatedRefNode: ReferenceNode = {
         ...sourceNode,
         id: refNode.id,
         name: preservedName,
         sourceNodeId: refNode.sourceNodeId,
         isReference: true,
         editableProperties: ['name', 'stepDisplay'] as const,
         properties: {
            ...sourceNode.properties,
            stepDisplay: preservedStepDisplay
         }
      };

      // Update the model
      const newNodes = new Map(this.model.nodes);
      newNodes.set(referenceNodeId, updatedRefNode as unknown as AnyWorkflowNode);
      this.model = {
         ...this.model,
         nodes: newNodes,
         metadata: {
            ...this.model.metadata,
            updatedAt: new Date().toISOString()
         }
      };

      return { success: true };
   }

   /**
    * 获取引用统计信息
    * Get reference statistics
    */
   getReferenceStatistics(): {
      totalReferences: number;
      referencedNodes: number;
      referencesByType: Map<NodeType, number>;
   } {
      const referencesByType = new Map<NodeType, number>();
      let totalReferences = 0;

      for (const node of this.model.nodes.values()) {
         if (isReferenceNode(node)) {
            totalReferences++;
            const count = referencesByType.get(node.type) || 0;
            referencesByType.set(node.type, count + 1);
         }
      }

      return {
         totalReferences,
         referencedNodes: this.referenceMap.size,
         referencesByType
      };
   }
}

/**
 * 创建引用节点的辅助函数
 * Helper function to create a reference node
 */
export function createReferenceNode(sourceNode: AnyWorkflowNode, newId?: string): ReferenceNode {
   const id = newId || NodeFactory.generateNodeId('ref');
   const manager = new ReferenceNodeManager(sourceNode, id);
   return manager.getNode();
}

/**
 * 验证引用节点克隆属性
 * Validate that reference node has cloned properties from source
 * 属性 12: 引用节点克隆属性
 */
export function validateReferenceClone(sourceNode: AnyWorkflowNode, referenceNode: ReferenceNode): NodeValidationResult {
   const errors: string[] = [];

   // Check that core properties are cloned
   if (referenceNode.type !== sourceNode.type) {
      errors.push(
         `引用节点类型 "${referenceNode.type}" 与源节点类型 "${sourceNode.type}" 不匹配 (Reference node type does not match source node type)`
      );
   }

   if (referenceNode.sourceNodeId !== sourceNode.id) {
      errors.push(
         `引用节点的 sourceNodeId "${referenceNode.sourceNodeId}" 与源节点 ID "${sourceNode.id}" 不匹配 (Reference node sourceNodeId does not match source node ID)`
      );
   }

   // Check that isReference is set
   if (!referenceNode.isReference) {
      errors.push('引用节点必须设置 isReference 为 true (Reference node must have isReference set to true)');
   }

   // Check that editableProperties is correctly set
   if (
      !referenceNode.editableProperties ||
      referenceNode.editableProperties.length !== 2 ||
      !referenceNode.editableProperties.includes('name') ||
      !referenceNode.editableProperties.includes('stepDisplay')
   ) {
      errors.push(
         '引用节点的 editableProperties 必须为 ["name", "stepDisplay"] (Reference node editableProperties must be ["name", "stepDisplay"])'
      );
   }

   return {
      isValid: errors.length === 0,
      errors
   };
}

/**
 * 验证引用节点编辑限制
 * Validate reference node edit restrictions
 * 属性 13: 引用节点编辑限制
 */
export function validateReferenceEditRestriction(propertyName: string, expectedAllowed: boolean): NodeValidationResult {
   const editableProperties: ReferenceEditableProperty[] = ['name', 'stepDisplay'];
   const isAllowed = editableProperties.includes(propertyName as ReferenceEditableProperty);

   if (isAllowed !== expectedAllowed) {
      return {
         isValid: false,
         errors: [
            expectedAllowed
               ? `属性 "${propertyName}" 应该允许编辑但被拒绝 (Property "${propertyName}" should be editable but was rejected)`
               : `属性 "${propertyName}" 不应该允许编辑但被允许 (Property "${propertyName}" should not be editable but was allowed)`
         ]
      };
   }

   return { isValid: true, errors: [] };
}
