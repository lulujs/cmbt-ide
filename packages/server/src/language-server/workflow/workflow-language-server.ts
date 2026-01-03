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
   getAllNodes(): (AnyWorkflowNode | DecisionTableNode)[];

   // 边管理
   createEdge(params: CreateEdgeParams): WorkflowEdge;
   updateEdge(edgeId: string, properties: Partial<CreateEdgeParams>): void;
   deleteEdge(edgeId: string): void;
   getEdge(edgeId: string): WorkflowEdge | undefined;
   getAllEdges(): WorkflowEdge[];

   // 决策表管理
   createDecisionTable(nodeId: string, data?: DecisionTableData): DecisionTableNode;
   updateDecisionTable(nodeId: string, data: DecisionTableData): void;
   validateDecisionTable(data: DecisionTableData): ValidationResult;

   // 泳道管理
   createSwimlane(params: CreateSwimlaneParams): Swimlane;
   addNodeToSwimlane(nodeId: string, swimlaneId: string): void;
   removeNodeFromSwimlane(nodeId: string): void;
   deleteSwimlane(swimlaneId: string): void;
   getAllSwimlanes(): Swimlane[];

   // 引用节点管理
   createReference(sourceNodeId: string): ReferenceNode;
   batchCreateReferences(nodeIds: string[]): ReferenceNode[];

   // 模型管理
   getModel(): WorkflowModel;
   loadModel(model: WorkflowModel): void;
   validateModel(): ValidationResult;

   // DSL 序列化/反序列化
   serialize(): string;
   deserialize(dslContent: string): WorkflowModel;
}

/**
 * 工作流程语言服务器实现
 * Workflow language server implementation
 *
 * This class provides the core functionality for managing workflow models,
 * including node and edge management, decision tables, swimlanes, and
 * integration with the Langium-generated parser.
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

   // ============================================================================
   // 节点管理实现 - Node Management Implementation
   // ============================================================================

   createNode(type: NodeType, name: string, position: Position, properties: NodeProperties = {}): AnyWorkflowNode {
      const id = this.generateNodeId();
      let node: AnyWorkflowNode;

      switch (type) {
         case NodeType.BEGIN:
            // 开始节点没有预期值 (Begin node has no expected value)
            node = { id, type: NodeType.BEGIN, name, position, properties };
            break;
         case NodeType.END:
            // 结束节点带有预期值 (End node has expected value)
            node = { id, type: NodeType.END, name, position, properties, expectedValue: null };
            break;
         case NodeType.EXCEPTION:
            // 异常节点是特殊的结束节点，带有预期值 (Exception node is special end node with expected value)
            node = { id, type: NodeType.EXCEPTION, name, position, properties, expectedValue: null };
            break;
         case NodeType.PROCESS:
            // 过程节点只允许一条出边 (Process node allows only one outgoing edge)
            node = { id, type: NodeType.PROCESS, name, position, properties };
            break;
         case NodeType.DECISION:
            // 分支节点默认两条输出边 (Decision node defaults to two output edges)
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
            // 子流程节点允许嵌套指定页生成的路径 (Subprocess node allows nested path)
            node = { id, type: NodeType.SUBPROCESS, name, position, properties, referencePath: '' };
            break;
         case NodeType.CONCURRENT:
            // 并发节点支持并行处理 (Concurrent node supports parallel processing)
            node = { id, type: NodeType.CONCURRENT, name, position, properties, parallelBranches: [] };
            break;
         case NodeType.AUTO:
            // Auto节点用于自动化对接 (Auto node for automation integration)
            node = { id, type: NodeType.AUTO, name, position, properties };
            break;
         case NodeType.API:
            // API节点用于绑定统一自动化平台单接口实例 (API node for binding automation platform interface)
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

      // 删除相关的边 (Delete related edges)
      for (const [edgeId, edge] of this.model.edges) {
         if (edge.source === nodeId || edge.target === nodeId) {
            this.model.edges.delete(edgeId);
         }
      }

      // 从泳道中移除 (Remove from swimlanes)
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

   getAllNodes(): (AnyWorkflowNode | DecisionTableNode)[] {
      return Array.from(this.model.nodes.values());
   }

   // ============================================================================
   // 边管理实现 - Edge Management Implementation
   // ============================================================================

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

   getAllEdges(): WorkflowEdge[] {
      return Array.from(this.model.edges.values());
   }

   // ============================================================================
   // 决策表管理实现 - Decision Table Management Implementation
   // ============================================================================

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

   // ============================================================================
   // 泳道管理实现 - Swimlane Management Implementation
   // ============================================================================

   createSwimlane(params: CreateSwimlaneParams): Swimlane {
      const id = this.generateSwimlaneId();
      const swimlane = createSwimlane(id, params);

      this.model.swimlanes.set(id, swimlane);
      this.updateModelTimestamp();
      return swimlane;
   }

   addNodeToSwimlane(nodeId: string, swimlaneId: string): void {
      // 先从其他泳道移除 (First remove from other swimlanes)
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

   getAllSwimlanes(): Swimlane[] {
      return Array.from(this.model.swimlanes.values());
   }

   // ============================================================================
   // 引用节点管理实现 - Reference Node Management Implementation
   // ============================================================================

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

   // ============================================================================
   // 模型管理实现 - Model Management Implementation
   // ============================================================================

   getModel(): WorkflowModel {
      return this.model;
   }

   loadModel(model: WorkflowModel): void {
      this.model = model;
      // 更新计数器以避免ID冲突 (Update counters to avoid ID conflicts)
      this.updateCountersFromModel();
   }

   private updateCountersFromModel(): void {
      let maxNodeId = 0;
      let maxEdgeId = 0;
      let maxSwimlaneId = 0;

      for (const nodeId of this.model.nodes.keys()) {
         const match = nodeId.match(/node_(\d+)/);
         if (match) {
            maxNodeId = Math.max(maxNodeId, parseInt(match[1], 10));
         }
      }

      for (const edgeId of this.model.edges.keys()) {
         const match = edgeId.match(/edge_(\d+)/);
         if (match) {
            maxEdgeId = Math.max(maxEdgeId, parseInt(match[1], 10));
         }
      }

      for (const swimlaneId of this.model.swimlanes.keys()) {
         const match = swimlaneId.match(/swimlane_(\d+)/);
         if (match) {
            maxSwimlaneId = Math.max(maxSwimlaneId, parseInt(match[1], 10));
         }
      }

      this.nodeIdCounter = maxNodeId;
      this.edgeIdCounter = maxEdgeId;
      this.swimlaneIdCounter = maxSwimlaneId;
   }

   validateModel(): ValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证过程节点的出边数量 (Validate process node outgoing edge count)
      for (const node of this.model.nodes.values()) {
         if (node.type === NodeType.PROCESS) {
            const outgoingEdges = Array.from(this.model.edges.values()).filter(e => e.source === node.id);
            if (outgoingEdges.length > 1) {
               errors.push(`过程节点 "${node.name}" 只允许一条出边，当前有 ${outgoingEdges.length} 条`);
            }
         }

         // 验证分支节点的输出边值唯一性 (Validate decision node output edge value uniqueness)
         if (node.type === NodeType.DECISION) {
            const outgoingEdges = Array.from(this.model.edges.values()).filter(e => e.source === node.id);
            const values = outgoingEdges.map(e => e.value).filter((v): v is string => v !== undefined);
            const uniqueValues = new Set(values);
            if (values.length !== uniqueValues.size) {
               errors.push(`分支节点 "${node.name}" 的输出边值必须唯一`);
            }
         }

         // 验证决策表 (Validate decision table)
         if (node.type === NodeType.DECISION_TABLE) {
            const tableNode = node as DecisionTableNode;
            const tableValidation = this.validateDecisionTable(tableNode.tableData);
            if (!tableValidation.isValid) {
               errors.push(...tableValidation.errors.map(e => `决策表节点 "${node.name}": ${e}`));
            }
         }
      }

      // 验证并发流程 (Validate concurrent processes)
      this.validateConcurrentProcesses(errors);

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }

   /**
    * 验证并发流程 - 检测环路和非法节点
    * Validate concurrent processes - detect cycles and illegal nodes
    */
   private validateConcurrentProcesses(errors: string[]): void {
      for (const node of this.model.nodes.values()) {
         if (node.type === NodeType.CONCURRENT) {
            // 检查并发流程内是否包含开始或结束节点
            // Check if concurrent process contains begin or end nodes
            const concurrentNode = node as { parallelBranches: string[] };
            for (const branchNodeId of concurrentNode.parallelBranches) {
               const branchNode = this.model.nodes.get(branchNodeId);
               if (branchNode && (branchNode.type === NodeType.BEGIN || branchNode.type === NodeType.END)) {
                  errors.push(`并发流程 "${node.name}" 不能包含开始或结束节点`);
               }
            }

            // 检测环路 (Detect cycles)
            if (this.hasCycleInConcurrentProcess(node.id)) {
               errors.push(`并发流程 "${node.name}" 包含环路`);
            }
         }
      }
   }

   /**
    * 检测并发流程中的环路
    * Detect cycles in concurrent process using DFS
    */
   private hasCycleInConcurrentProcess(concurrentNodeId: string): boolean {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const concurrentNode = this.model.nodes.get(concurrentNodeId);
      if (!concurrentNode || concurrentNode.type !== NodeType.CONCURRENT) {
         return false;
      }

      const parallelBranches = (concurrentNode as { parallelBranches: string[] }).parallelBranches;

      const dfs = (nodeId: string): boolean => {
         visited.add(nodeId);
         recursionStack.add(nodeId);

         const outgoingEdges = Array.from(this.model.edges.values()).filter(e => e.source === nodeId);
         for (const edge of outgoingEdges) {
            const targetId = edge.target;
            // 只检查并发流程内的节点 (Only check nodes within concurrent process)
            if (parallelBranches.includes(targetId)) {
               if (!visited.has(targetId)) {
                  if (dfs(targetId)) {
                     return true;
                  }
               } else if (recursionStack.has(targetId)) {
                  return true;
               }
            }
         }

         recursionStack.delete(nodeId);
         return false;
      };

      for (const branchNodeId of parallelBranches) {
         if (!visited.has(branchNodeId)) {
            if (dfs(branchNodeId)) {
               return true;
            }
         }
      }

      return false;
   }

   // ============================================================================
   // DSL 序列化/反序列化实现 - DSL Serialization/Deserialization Implementation
   // ============================================================================

   /**
    * 将工作流程模型序列化为 DSL 文本
    * Serialize workflow model to DSL text
    */
   serialize(): string {
      const lines: string[] = [];
      const indent = (level: number) => '    '.repeat(level);

      lines.push('workflow:');
      lines.push(`${indent(1)}id: ${this.model.id}`);
      lines.push(`${indent(1)}name: "${this.model.name}"`);

      // 序列化元数据 (Serialize metadata)
      if (this.model.metadata) {
         lines.push(`${indent(1)}metadata:`);
         lines.push(`${indent(2)}version: "${this.model.metadata.version}"`);
         if (this.model.metadata.author) {
            lines.push(`${indent(2)}author: "${this.model.metadata.author}"`);
         }
      }

      // 序列化节点 (Serialize nodes)
      if (this.model.nodes.size > 0) {
         lines.push(`${indent(1)}nodes:`);
         for (const node of this.model.nodes.values()) {
            lines.push(...this.serializeNode(node, 2));
         }
      }

      // 序列化边 (Serialize edges)
      if (this.model.edges.size > 0) {
         lines.push(`${indent(1)}edges:`);
         for (const edge of this.model.edges.values()) {
            lines.push(...this.serializeEdge(edge, 2));
         }
      }

      // 序列化泳道 (Serialize swimlanes)
      if (this.model.swimlanes.size > 0) {
         lines.push(`${indent(1)}swimlanes:`);
         for (const swimlane of this.model.swimlanes.values()) {
            lines.push(...this.serializeSwimlane(swimlane, 2));
         }
      }

      return lines.join('\n');
   }

   private serializeNode(node: AnyWorkflowNode | DecisionTableNode, level: number): string[] {
      const lines: string[] = [];
      const indent = (l: number) => '    '.repeat(l);

      lines.push(`${indent(level - 1)}- ${node.type}:`);
      lines.push(`${indent(level)}id: ${node.id}`);
      lines.push(`${indent(level)}name: "${node.name}"`);

      if (node.properties.description) {
         lines.push(`${indent(level)}description: "${node.properties.description}"`);
      }

      // 序列化位置 (Serialize position)
      if (node.position) {
         lines.push(`${indent(level)}position:`);
         lines.push(`${indent(level + 1)}x: ${node.position.x}`);
         lines.push(`${indent(level + 1)}y: ${node.position.y}`);
      }

      // 序列化特定节点类型的属性 (Serialize type-specific properties)
      if (node.type === NodeType.END || node.type === NodeType.EXCEPTION) {
         const endNode = node as { expectedValue: unknown };
         if (endNode.expectedValue !== null && endNode.expectedValue !== undefined) {
            lines.push(`${indent(level)}expectedValue: "${endNode.expectedValue}"`);
         }
      }

      if (node.type === NodeType.DECISION) {
         const decisionNode = node as { branches: Array<{ id: string; value: string; isDefault?: boolean }> };
         if (decisionNode.branches && decisionNode.branches.length > 0) {
            lines.push(`${indent(level)}branches:`);
            for (const branch of decisionNode.branches) {
               lines.push(`${indent(level + 1)}- id: ${branch.id}`);
               lines.push(`${indent(level + 2)}value: "${branch.value}"`);
               if (branch.isDefault) {
                  lines.push(`${indent(level + 2)}isDefault: true`);
               }
            }
         }
      }

      if (node.type === NodeType.DECISION_TABLE) {
         const tableNode = node as DecisionTableNode;
         lines.push(...this.serializeDecisionTable(tableNode.tableData, level));
      }

      if (node.type === NodeType.SUBPROCESS) {
         const subprocessNode = node as { referencePath: string };
         if (subprocessNode.referencePath) {
            lines.push(`${indent(level)}referencePath: "${subprocessNode.referencePath}"`);
         }
      }

      return lines;
   }

   private serializeDecisionTable(data: DecisionTableData, level: number): string[] {
      const lines: string[] = [];
      const indent = (l: number) => '    '.repeat(l);

      lines.push(`${indent(level)}tableData:`);

      // 输入列 (Input columns)
      if (data.inputColumns.length > 0) {
         lines.push(`${indent(level + 1)}inputColumns:`);
         for (const col of data.inputColumns) {
            lines.push(`${indent(level + 2)}- id: ${col.id}`);
            lines.push(`${indent(level + 3)}name: "${col.name}"`);
            lines.push(`${indent(level + 3)}dataType: "${col.dataType}"`);
         }
      }

      // 输出列 (Output columns)
      if (data.outputColumns.length > 0) {
         lines.push(`${indent(level + 1)}outputColumns:`);
         for (const col of data.outputColumns) {
            lines.push(`${indent(level + 2)}- id: ${col.id}`);
            lines.push(`${indent(level + 3)}name: "${col.name}"`);
            lines.push(`${indent(level + 3)}dataType: "${col.dataType}"`);
         }
      }

      // 决策列 (Decision columns)
      if (data.decisionColumns.length > 0) {
         lines.push(`${indent(level + 1)}decisionColumns:`);
         for (const col of data.decisionColumns) {
            lines.push(`${indent(level + 2)}- id: ${col.id}`);
            lines.push(`${indent(level + 3)}name: "${col.name}"`);
            lines.push(`${indent(level + 3)}dataType: "${col.dataType}"`);
         }
      }

      // 行数据 (Row data)
      if (data.rows.length > 0) {
         lines.push(`${indent(level + 1)}rows:`);
         for (const row of data.rows) {
            lines.push(`${indent(level + 2)}- id: ${row.id}`);
            lines.push(`${indent(level + 3)}values:`);
            for (const [key, value] of Object.entries(row.values)) {
               lines.push(`${indent(level + 4)}- column: ${key}`);
               lines.push(`${indent(level + 5)}value: "${value}"`);
            }
         }
      }

      return lines;
   }

   private serializeEdge(edge: WorkflowEdge, level: number): string[] {
      const lines: string[] = [];
      const indent = (l: number) => '    '.repeat(l);

      lines.push(`${indent(level - 1)}- edge:`);
      lines.push(`${indent(level)}id: ${edge.id}`);
      lines.push(`${indent(level)}source: ${edge.source}`);
      lines.push(`${indent(level)}target: ${edge.target}`);

      if (edge.condition) {
         lines.push(`${indent(level)}condition: "${edge.condition}"`);
      }
      if (edge.value) {
         lines.push(`${indent(level)}value: "${edge.value}"`);
      }
      if (edge.dataType) {
         lines.push(`${indent(level)}dataType: "${edge.dataType}"`);
      }

      return lines;
   }

   private serializeSwimlane(swimlane: Swimlane, level: number): string[] {
      const lines: string[] = [];
      const indent = (l: number) => '    '.repeat(l);

      lines.push(`${indent(level - 1)}- swimlane:`);
      lines.push(`${indent(level)}id: ${swimlane.id}`);
      lines.push(`${indent(level)}name: "${swimlane.name}"`);

      if (swimlane.position) {
         lines.push(`${indent(level)}position:`);
         lines.push(`${indent(level + 1)}x: ${swimlane.position.x}`);
         lines.push(`${indent(level + 1)}y: ${swimlane.position.y}`);
      }

      if (swimlane.size) {
         lines.push(`${indent(level)}width: ${swimlane.size.width}`);
         lines.push(`${indent(level)}height: ${swimlane.size.height}`);
      }

      if (swimlane.properties.color) {
         lines.push(`${indent(level)}color: "${swimlane.properties.color}"`);
      }

      if (swimlane.containedNodes.length > 0) {
         lines.push(`${indent(level)}containedNodes:`);
         for (const nodeId of swimlane.containedNodes) {
            lines.push(`${indent(level + 1)}- ref: ${nodeId}`);
         }
      }

      return lines;
   }

   /**
    * 从 DSL 文本反序列化为工作流程模型
    * Deserialize DSL text to workflow model
    *
    * Note: This is a simplified parser for basic DSL content.
    * For full parsing, use the Langium-generated parser.
    */
   deserialize(dslContent: string): WorkflowModel {
      // 创建新的空模型 (Create new empty model)
      const model = createEmptyWorkflowModel('workflow-parsed', 'Parsed Workflow');

      // 简单的行解析 (Simple line parsing)
      const lines = dslContent.split('\n');
      let currentSection: 'none' | 'metadata' | 'nodes' | 'edges' | 'swimlanes' = 'none';
      let currentNode: Record<string, unknown> | null = null;
      let currentEdge: Partial<WorkflowEdge> | null = null;

      for (const line of lines) {
         const trimmed = line.trim();

         // 跳过空行和注释 (Skip empty lines and comments)
         if (!trimmed || trimmed.startsWith('#')) {
            continue;
         }

         // 检测主要部分 (Detect main sections)
         if (trimmed === 'nodes:') {
            currentSection = 'nodes';
            continue;
         }
         if (trimmed === 'edges:') {
            currentSection = 'edges';
            continue;
         }
         if (trimmed === 'swimlanes:') {
            currentSection = 'swimlanes';
            continue;
         }
         if (trimmed === 'metadata:') {
            currentSection = 'metadata';
            continue;
         }

         // 解析模型级别属性 (Parse model-level properties)
         if (currentSection === 'none') {
            const idMatch = trimmed.match(/^id:\s*(.+)$/);
            if (idMatch) {
               model.id = idMatch[1].replace(/["']/g, '');
            }
            const nameMatch = trimmed.match(/^name:\s*["'](.+)["']$/);
            if (nameMatch) {
               model.name = nameMatch[1];
            }
         }

         // 解析元数据 (Parse metadata)
         if (currentSection === 'metadata') {
            const versionMatch = trimmed.match(/^version:\s*["'](.+)["']$/);
            if (versionMatch) {
               model.metadata.version = versionMatch[1];
            }
            const authorMatch = trimmed.match(/^author:\s*["'](.+)["']$/);
            if (authorMatch) {
               model.metadata.author = authorMatch[1];
            }
         }

         // 解析节点 (Parse nodes)
         if (currentSection === 'nodes') {
            // 检测新节点开始 (Detect new node start)
            const nodeTypeMatch = trimmed.match(
               /^-\s*(begin|end|exception|process|decision|decision_table|subprocess|concurrent|auto|api):$/
            );
            if (nodeTypeMatch) {
               // 保存之前的节点 (Save previous node)
               if (currentNode && currentNode.id) {
                  model.nodes.set(currentNode.id as string, currentNode as unknown as AnyWorkflowNode);
               }
               const nodeTypeStr = nodeTypeMatch[1];
               const nodeType = this.parseNodeType(nodeTypeStr);
               currentNode = {
                  type: nodeType as string,
                  properties: {},
                  position: { x: 0, y: 0 }
               };
               continue;
            }

            if (currentNode) {
               const idMatch = trimmed.match(/^id:\s*(.+)$/);
               if (idMatch) {
                  currentNode.id = idMatch[1];
               }
               const nameMatch = trimmed.match(/^name:\s*["'](.+)["']$/);
               if (nameMatch) {
                  currentNode.name = nameMatch[1];
               }
            }
         }

         // 解析边 (Parse edges)
         if (currentSection === 'edges') {
            const edgeMatch = trimmed.match(/^-\s*edge:$/);
            if (edgeMatch) {
               if (currentEdge && currentEdge.id) {
                  model.edges.set(currentEdge.id, currentEdge as WorkflowEdge);
               }
               currentEdge = {};
               continue;
            }

            if (currentEdge) {
               const idMatch = trimmed.match(/^id:\s*(.+)$/);
               if (idMatch) {
                  currentEdge.id = idMatch[1];
               }
               const sourceMatch = trimmed.match(/^source:\s*(.+)$/);
               if (sourceMatch) {
                  currentEdge.source = sourceMatch[1];
               }
               const targetMatch = trimmed.match(/^target:\s*(.+)$/);
               if (targetMatch) {
                  currentEdge.target = targetMatch[1];
               }
            }
         }
      }

      // 保存最后的元素 (Save last elements)
      if (currentNode && currentNode.id) {
         model.nodes.set(currentNode.id as string, currentNode as unknown as AnyWorkflowNode);
      }
      if (currentEdge && currentEdge.id) {
         model.edges.set(currentEdge.id, currentEdge as WorkflowEdge);
      }

      return model;
   }

   /**
    * 解析节点类型字符串为 NodeType 枚举
    * Parse node type string to NodeType enum
    */
   private parseNodeType(typeStr: string): NodeType {
      switch (typeStr) {
         case 'begin':
            return NodeType.BEGIN;
         case 'end':
            return NodeType.END;
         case 'exception':
            return NodeType.EXCEPTION;
         case 'process':
            return NodeType.PROCESS;
         case 'decision':
            return NodeType.DECISION;
         case 'decision_table':
            return NodeType.DECISION_TABLE;
         case 'subprocess':
            return NodeType.SUBPROCESS;
         case 'concurrent':
            return NodeType.CONCURRENT;
         case 'auto':
            return NodeType.AUTO;
         case 'api':
            return NodeType.API;
         default:
            return NodeType.PROCESS;
      }
   }

   private updateModelTimestamp(): void {
      this.model.metadata.updatedAt = new Date().toISOString();
   }
}
