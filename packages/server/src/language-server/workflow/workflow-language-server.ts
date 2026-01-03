/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
    AnyWorkflowNode,
    CreateEdgeParams,
    CreateSwimlaneParams,
    DecisionTableData,
    DecisionTableNode,
    NodeProperties,
    NodeType,
    Position,
    ReferenceNode,
    Swimlane,
    WorkflowEdge,
    WorkflowModel,
    createDecisionTableNode,
    createDefaultDecisionTableData,
    createEmptyWorkflowModel,
    createSwimlane,
    validateDecisionTableData
} from '@crossmodel/protocol';

/**
 * 验证结果接口
 * Validation result interface
 */
export interface ValidationResult {
   isValid: boolean;
   errors: string[];
   warnings?: string[];
}

/**
 * 工作流程语言服务器接口
 * Workflow language server interface
 */
export interface IWorkflowLanguageServer {
   // 节点管理
   createNode(type: NodeType, name: string, position: Position, properties?: NodeProperties): AnyWorkflowNode;
   updateNode(nodeId: string, properties: Partial<NodeProperties>): void;
   deleteNode(nodeId: string): void;
   getNode(nodeId: string): AnyWorkflowNode | DecisionTableNode | undefined;

   // 边管理
   createEdge(params: CreateEdgeParams): WorkflowEdge;
   updateEdge(edgeId: string, properties: Partial<CreateEdgeParams>): void;
   deleteEdge(edgeId: string): void;
   getEdge(edgeId: string): WorkflowEdge | undefined;

   // 决策表管理
   createDecisionTable(nodeId: string, data?: DecisionTableData): DecisionTableNode;
   updateDecisionTable(nodeId: string, data: DecisionTableData): void;
   validateDecisionTable(data: DecisionTableData): ValidationResult;

   // 泳道管理
   createSwimlane(params: CreateSwimlaneParams): Swimlane;
   addNodeToSwimlane(nodeId: string, swimlaneId: string): void;
   removeNodeFromSwimlane(nodeId: string): void;
   deleteSwimlane(swimlaneId: string): void;

   // 引用节点管理
   createReference(sourceNodeId: string): ReferenceNode;
   batchCreateReferences(nodeIds: string[]): ReferenceNode[];

   // 模型管理
   getModel(): WorkflowModel;
   loadModel(model: WorkflowModel): void;
   validateModel(): ValidationResult;
}

/**
 * 工作流程语言服务器实现
 * Workflow language server implementation
 */
export class WorkflowLanguageServer implements IWorkflowLanguageServer {
   private model: WorkflowModel;
   private nodeIdCounter = 0;
   private edgeIdCounter = 0;
   private swimlaneIdCounter = 0;

   constructor(modelId: string = 'workflow-1', modelName: string = 'New Workflow') {
      this.model = createEmptyWorkflowModel(modelId, modelName);
   }

   private generateNodeId(): string {
      return `node_${++this.nodeIdCounter}`;
   }

   private generateEdgeId(): string {
      return `edge_${++this.edgeIdCounter}`;
   }

   private generateSwimlaneId(): string {
      return `swimlane_${++this.swimlaneIdCounter}`;
   }

   // 节点管理实现
   createNode(type: NodeType, name: string, position: Position, properties: NodeProperties = {}): AnyWorkflowNode {
      const id = this.generateNodeId();
      let node: AnyWorkflowNode;

      switch (type) {
         case NodeType.BEGIN:
            node = { id, type: NodeType.BEGIN, name, position, properties };
            break;
         case NodeType.END:
            node = { id, type: NodeType.END, name, position, properties, expectedValue: null };
            break;
         case NodeType.EXCEPTION:
            node = { id, type: NodeType.EXCEPTION, name, position, properties, expectedValue: null };
            break;
         case NodeType.PROCESS:
            node = { id, type: NodeType.PROCESS, name, position, properties };
            break;
         case NodeType.DECISION:
            node = {
               id,
               type: NodeType.DECISION,
               name,
               position,
               properties,
               branches: [
                  { id: 'branch_1', value: 'true', isDefault: false },
                  { id: 'branch_2', value: 'false', isDefault: true }
               ]
            };
            break;
         case NodeType.SUBPROCESS:
            node = { id, type: NodeType.SUBPROCESS, name, position, properties, referencePath: '' };
            break;
         case NodeType.CONCURRENT:
            node = { id, type: NodeType.CONCURRENT, name, position, properties, parallelBranches: [] };
            break;
         case NodeType.AUTO:
            node = { id, type: NodeType.AUTO, name, position, properties };
            break;
         case NodeType.API:
            node = { id, type: NodeType.API, name, position, properties };
            break;
         default:
            throw new Error(`Unsupported node type: ${type}`);
      }

      this.model.nodes.set(id, node);
      this.updateModelTimestamp();
      return node;
   }

   updateNode(nodeId: string, properties: Partial<NodeProperties>): void {
      const node = this.model.nodes.get(nodeId);
      if (node) {
         node.properties = { ...node.properties, ...properties };
         this.updateModelTimestamp();
      }
   }

   deleteNode(nodeId: string): void {
      this.model.nodes.delete(nodeId);

      // 删除相关的边
      for (const [edgeId, edge] of this.model.edges) {
         if (edge.source === nodeId || edge.target === nodeId) {
            this.model.edges.delete(edgeId);
         }
      }

      // 从泳道中移除
      for (const swimlane of this.model.swimlanes.values()) {
         const index = swimlane.containedNodes.indexOf(nodeId);
         if (index > -1) {
            swimlane.containedNodes.splice(index, 1);
         }
      }

      this.updateModelTimestamp();
   }

   getNode(nodeId: string): AnyWorkflowNode | DecisionTableNode | undefined {
      return this.model.nodes.get(nodeId);
   }

   // 边管理实现
   createEdge(params: CreateEdgeParams): WorkflowEdge {
      const id = this.generateEdgeId();
      const edge: WorkflowEdge = {
         id,
         source: params.source,
         target: params.target,
         condition: params.properties?.condition,
         value: params.properties?.value,
         dataType: params.properties?.dataType
      };

      this.model.edges.set(id, edge);
      this.updateModelTimestamp();
      return edge;
   }

   updateEdge(edgeId: string, properties: Partial<CreateEdgeParams>): void {
      const edge = this.model.edges.get(edgeId);
      if (edge) {
         if (properties.source) edge.source = properties.source;
         if (properties.target) edge.target = properties.target;
         if (properties.properties) {
            edge.condition = properties.properties.condition ?? edge.condition;
            edge.value = properties.properties.value ?? edge.value;
            edge.dataType = properties.properties.dataType ?? edge.dataType;
         }
         this.updateModelTimestamp();
      }
   }

   deleteEdge(edgeId: string): void {
      this.model.edges.delete(edgeId);
      this.updateModelTimestamp();
   }

   getEdge(edgeId: string): WorkflowEdge | undefined {
      return this.model.edges.get(edgeId);
   }

   // 决策表管理实现
   createDecisionTable(nodeId: string, data?: DecisionTableData): DecisionTableNode {
      const id = nodeId || this.generateNodeId();
      const tableData = data ?? createDefaultDecisionTableData();
      const node = createDecisionTableNode(id, 'Decision Table', { x: 0, y: 0 }, {}, tableData);

      this.model.nodes.set(id, node);
      this.updateModelTimestamp();
      return node;
   }

   updateDecisionTable(nodeId: string, data: DecisionTableData): void {
      const node = this.model.nodes.get(nodeId);
      if (node && node.type === NodeType.DECISION_TABLE) {
         (node as DecisionTableNode).tableData = data;
         this.updateModelTimestamp();
      }
   }

   validateDecisionTable(data: DecisionTableData): ValidationResult {
      const result = validateDecisionTableData(data);
      return {
         isValid: result.isValid,
         errors: result.errors
      };
   }

   // 泳道管理实现
   createSwimlane(params: CreateSwimlaneParams): Swimlane {
      const id = this.generateSwimlaneId();
      const swimlane = createSwimlane(id, params);

      this.model.swimlanes.set(id, swimlane);
      this.updateModelTimestamp();
      return swimlane;
   }

   addNodeToSwimlane(nodeId: string, swimlaneId: string): void {
      // 先从其他泳道移除
      this.removeNodeFromSwimlane(nodeId);

      const swimlane = this.model.swimlanes.get(swimlaneId);
      if (swimlane && !swimlane.containedNodes.includes(nodeId)) {
         swimlane.containedNodes.push(nodeId);
         this.updateModelTimestamp();
      }
   }

   removeNodeFromSwimlane(nodeId: string): void {
      for (const swimlane of this.model.swimlanes.values()) {
         const index = swimlane.containedNodes.indexOf(nodeId);
         if (index > -1) {
            swimlane.containedNodes.splice(index, 1);
            this.updateModelTimestamp();
            break;
         }
      }
   }

   deleteSwimlane(swimlaneId: string): void {
      this.model.swimlanes.delete(swimlaneId);
      this.updateModelTimestamp();
   }

   // 引用节点管理实现
   createReference(sourceNodeId: string): ReferenceNode {
      const sourceNode = this.model.nodes.get(sourceNodeId);
      if (!sourceNode) {
         throw new Error(`Source node not found: ${sourceNodeId}`);
      }

      const id = this.generateNodeId();
      const referenceNode: ReferenceNode = {
         ...sourceNode,
         id,
         name: `${sourceNode.name} (Reference)`,
         sourceNodeId,
         isReference: true,
         editableProperties: ['name', 'stepDisplay'] as const
      };

      this.model.nodes.set(id, referenceNode as unknown as AnyWorkflowNode);
      this.updateModelTimestamp();
      return referenceNode;
   }

   batchCreateReferences(nodeIds: string[]): ReferenceNode[] {
      return nodeIds.map(nodeId => this.createReference(nodeId));
   }

   // 模型管理实现
   getModel(): WorkflowModel {
      return this.model;
   }

   loadModel(model: WorkflowModel): void {
      this.model = model;
   }

   validateModel(): ValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证过程节点的出边数量
      for (const node of this.model.nodes.values()) {
         if (node.type === NodeType.PROCESS) {
            const outgoingEdges = Array.from(this.model.edges.values()).filter(e => e.source === node.id);
            if (outgoingEdges.length > 1) {
               errors.push(`过程节点 "${node.name}" 只允许一条出边，当前有 ${outgoingEdges.length} 条`);
            }
         }

         // 验证分支节点的输出边值唯一性
         if (node.type === NodeType.DECISION) {
            const outgoingEdges = Array.from(this.model.edges.values()).filter(e => e.source === node.id);
            const values = outgoingEdges.map(e => e.value).filter((v): v is string => v !== undefined);
            const uniqueValues = new Set(values);
            if (values.length !== uniqueValues.size) {
               errors.push(`分支节点 "${node.name}" 的输出边值必须唯一`);
            }
         }

         // 验证决策表
         if (node.type === NodeType.DECISION_TABLE) {
            const tableNode = node as DecisionTableNode;
            const tableValidation = this.validateDecisionTable(tableNode.tableData);
            if (!tableValidation.isValid) {
               errors.push(...tableValidation.errors.map(e => `决策表节点 "${node.name}": ${e}`));
            }
         }
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }

   private updateModelTimestamp(): void {
      this.model.metadata.updatedAt = new Date().toISOString();
   }
}
