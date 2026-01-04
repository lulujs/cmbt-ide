/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Concurrent Process Management
 * 并发流程管理
 *
 * This module provides data structures and algorithms for managing concurrent
 * (parallel) processes in workflow models. It includes:
 * - Cycle detection with path tracking
 * - Topological sorting for execution order
 * - Structure validation for concurrent processes
 * - Concurrent process manager class
 *
 * Requirements: 6.1-6.4
 ********************************************************************************/

import { WorkflowEdge } from './edge';
import { WorkflowNode, isBeginNode, isEndNode, isExceptionNode } from './node';
import { NodeType, Position } from './types';

/**
 * 并发流程验证结果接口
 * Concurrent process validation result interface
 */
export interface ConcurrentValidationResult {
   isValid: boolean;
   errors: string[];
   warnings?: string[];
   hasCycle?: boolean;
   cyclePath?: string[];
   invalidNodes?: string[];
   unreachableNodes?: string[];
   disconnectedNodes?: string[];
}

/**
 * 并发分支接口
 * Concurrent branch interface
 */
export interface ConcurrentBranch {
   id: string;
   name: string;
   nodeIds: string[];
   startNodeId?: string;
   endNodeId?: string;
}

/**
 * 并发流程数据接口
 * Concurrent process data interface
 */
export interface ConcurrentProcessData {
   id: string;
   name: string;
   concurrentStartNodeId: string;
   concurrentEndNodeId: string;
   branches: ConcurrentBranch[];
   containedNodeIds: string[];
}

/**
 * 并发流程结构分析结果
 * Concurrent process structure analysis result
 */
export interface ConcurrentStructureAnalysis {
   isValid: boolean;
   startNodes: string[];
   endNodes: string[];
   internalNodes: string[];
   orphanedNodes: string[];
   multiplePathNodes: string[];
}

/**
 * 并发开始节点子类型
 * Concurrent start node subtype
 */
export const CONCURRENT_START = 'concurrent_start';

/**
 * 并发结束节点子类型
 * Concurrent end node subtype
 */
export const CONCURRENT_END = 'concurrent_end';

/**
 * 检查节点是否为并发开始节点
 * Check if node is concurrent start node
 */
export function isConcurrentStartNode(node: WorkflowNode): boolean {
   return node.type === NodeType.CONCURRENT && node.properties.subType === CONCURRENT_START;
}

/**
 * 检查节点是否为并发结束节点
 * Check if node is concurrent end node
 */
export function isConcurrentEndNode(node: WorkflowNode): boolean {
   return node.type === NodeType.CONCURRENT && node.properties.subType === CONCURRENT_END;
}

/**
 * 构建邻接表
 * Build adjacency list from edges
 */
function buildAdjacencyList(edges: WorkflowEdge[], nodeIds: string[]): Map<string, string[]> {
   const nodeSet = new Set(nodeIds);
   const adjacencyList = new Map<string, string[]>();

   // 初始化所有节点
   for (const nodeId of nodeIds) {
      adjacencyList.set(nodeId, []);
   }

   // 添加边
   for (const edge of edges) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
         const neighbors = adjacencyList.get(edge.source);
         if (neighbors) {
            neighbors.push(edge.target);
         }
      }
   }

   return adjacencyList;
}

/**
 * 构建反向邻接表
 * Build reverse adjacency list from edges
 */
function buildReverseAdjacencyList(edges: WorkflowEdge[], nodeIds: string[]): Map<string, string[]> {
   const nodeSet = new Set(nodeIds);
   const reverseAdjacencyList = new Map<string, string[]>();

   // 初始化所有节点
   for (const nodeId of nodeIds) {
      reverseAdjacencyList.set(nodeId, []);
   }

   // 添加反向边
   for (const edge of edges) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
         const predecessors = reverseAdjacencyList.get(edge.target);
         if (predecessors) {
            predecessors.push(edge.source);
         }
      }
   }

   return reverseAdjacencyList;
}

/**
 * 检测并发流程中的环路
 * Detect cycles in concurrent process using DFS
 *
 * @param nodes All workflow nodes
 * @param edges All workflow edges
 * @param concurrentNodeIds IDs of nodes within the concurrent process
 * @returns true if a cycle is detected
 */
export function detectCycleInConcurrentProcess(nodes: WorkflowNode[], edges: WorkflowEdge[], concurrentNodeIds: string[]): boolean {
   const result = detectCycleWithPath(nodes, edges, concurrentNodeIds);
   return result.hasCycle;
}

/**
 * 检测并发流程中的环路并返回环路路径
 * Detect cycles in concurrent process and return the cycle path
 *
 * @param nodes All workflow nodes
 * @param edges All workflow edges
 * @param concurrentNodeIds IDs of nodes within the concurrent process
 * @returns Object containing hasCycle flag and the cycle path if found
 */
export function detectCycleWithPath(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): { hasCycle: boolean; cyclePath: string[] } {
   const adjacencyList = buildAdjacencyList(edges, concurrentNodeIds);

   // DFS检测环路
   const visited = new Set<string>();
   const recursionStack = new Set<string>();
   const path: string[] = [];
   let cyclePath: string[] = [];

   function dfs(nodeId: string): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) ?? [];
      for (const neighbor of neighbors) {
         if (!visited.has(neighbor)) {
            if (dfs(neighbor)) {
               return true;
            }
         } else if (recursionStack.has(neighbor)) {
            // 发现环路，记录环路路径
            const cycleStartIndex = path.indexOf(neighbor);
            cyclePath = [...path.slice(cycleStartIndex), neighbor];
            return true;
         }
      }

      path.pop();
      recursionStack.delete(nodeId);
      return false;
   }

   for (const nodeId of concurrentNodeIds) {
      if (!visited.has(nodeId)) {
         if (dfs(nodeId)) {
            return { hasCycle: true, cyclePath };
         }
      }
   }

   return { hasCycle: false, cyclePath: [] };
}

/**
 * 验证并发流程结构
 * Validate concurrent process structure
 *
 * Requirements:
 * - 6.1: Internal nodes must flow from concurrent start to concurrent end
 * - 6.2: No cycles allowed
 * - 6.3: No begin or end nodes allowed
 * - 6.4: Validate node connection legality
 *
 * @param nodes All workflow nodes
 * @param edges All workflow edges
 * @param concurrentNodeIds IDs of nodes within the concurrent process
 * @returns Validation result with errors and warnings
 */
export function validateConcurrentProcess(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): ConcurrentValidationResult {
   const errors: string[] = [];
   const warnings: string[] = [];
   const invalidNodes: string[] = [];
   const unreachableNodes: string[] = [];
   const disconnectedNodes: string[] = [];

   // 获取并发流程内的节点
   const concurrentNodes = nodes.filter(n => concurrentNodeIds.includes(n.id));
   const nodeMap = new Map(concurrentNodes.map(n => [n.id, n]));

   // 需求 6.3: 检查是否包含开始、结束或异常节点
   for (const node of concurrentNodes) {
      if (isBeginNode(node)) {
         errors.push(`并发流程不能包含开始节点: ${node.name} (Concurrent process cannot contain begin node: ${node.name})`);
         invalidNodes.push(node.id);
      }
      if (isEndNode(node)) {
         errors.push(`并发流程不能包含结束节点: ${node.name} (Concurrent process cannot contain end node: ${node.name})`);
         invalidNodes.push(node.id);
      }
      if (isExceptionNode(node)) {
         errors.push(`并发流程不能包含异常节点: ${node.name} (Concurrent process cannot contain exception node: ${node.name})`);
         invalidNodes.push(node.id);
      }
   }

   // 需求 6.2: 检测环路
   const cycleResult = detectCycleWithPath(nodes, edges, concurrentNodeIds);
   if (cycleResult.hasCycle) {
      const cyclePathNames = cycleResult.cyclePath.map(id => nodeMap.get(id)?.name ?? id).join(' -> ');
      errors.push(`并发流程包含环路: ${cyclePathNames} (Concurrent process contains cycle: ${cyclePathNames})`);
   }

   // 需求 6.1 & 6.4: 验证连接合法性
   const adjacencyList = buildAdjacencyList(edges, concurrentNodeIds);
   const reverseAdjacencyList = buildReverseAdjacencyList(edges, concurrentNodeIds);

   // 查找没有入边的节点（应该是并发开始节点或从外部进入的节点）
   const noIncomingEdgeNodes: string[] = [];
   // 查找没有出边的节点（应该是并发结束节点或流向外部的节点）
   const noOutgoingEdgeNodes: string[] = [];

   for (const nodeId of concurrentNodeIds) {
      const incomingCount = reverseAdjacencyList.get(nodeId)?.length ?? 0;
      const outgoingCount = adjacencyList.get(nodeId)?.length ?? 0;

      if (incomingCount === 0) {
         noIncomingEdgeNodes.push(nodeId);
      }
      if (outgoingCount === 0) {
         noOutgoingEdgeNodes.push(nodeId);
      }

      // 检查完全孤立的节点
      if (incomingCount === 0 && outgoingCount === 0 && concurrentNodeIds.length > 1) {
         const nodeName = nodeMap.get(nodeId)?.name ?? nodeId;
         disconnectedNodes.push(nodeId);
         warnings.push(`节点 "${nodeName}" 在并发流程中没有任何连接 (Node "${nodeName}" has no connections in concurrent process)`);
      }
   }

   // 检查可达性 - 从所有入口节点开始，检查是否所有节点都可达
   if (noIncomingEdgeNodes.length > 0 && concurrentNodeIds.length > 1) {
      const reachable = new Set<string>();
      const queue = [...noIncomingEdgeNodes];

      while (queue.length > 0) {
         const current = queue.shift()!;
         if (reachable.has(current)) continue;
         reachable.add(current);

         const neighbors = adjacencyList.get(current) ?? [];
         for (const neighbor of neighbors) {
            if (!reachable.has(neighbor)) {
               queue.push(neighbor);
            }
         }
      }

      // 找出不可达的节点
      for (const nodeId of concurrentNodeIds) {
         if (!reachable.has(nodeId) && !disconnectedNodes.includes(nodeId)) {
            const nodeName = nodeMap.get(nodeId)?.name ?? nodeId;
            unreachableNodes.push(nodeId);
            warnings.push(`节点 "${nodeName}" 从并发流程入口不可达 (Node "${nodeName}" is unreachable from concurrent process entry)`);
         }
      }
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      hasCycle: cycleResult.hasCycle,
      cyclePath: cycleResult.cyclePath.length > 0 ? cycleResult.cyclePath : undefined,
      invalidNodes: invalidNodes.length > 0 ? invalidNodes : undefined,
      unreachableNodes: unreachableNodes.length > 0 ? unreachableNodes : undefined,
      disconnectedNodes: disconnectedNodes.length > 0 ? disconnectedNodes : undefined
   };
}

/**
 * 拓扑排序并发流程节点
 * Topological sort of concurrent process nodes using Kahn's algorithm
 *
 * @param nodes All workflow nodes
 * @param edges All workflow edges
 * @param concurrentNodeIds IDs of nodes within the concurrent process
 * @returns Sorted node IDs or null if cycle exists
 */
export function topologicalSortConcurrentNodes(nodes: WorkflowNode[], edges: WorkflowEdge[], concurrentNodeIds: string[]): string[] | null {
   const nodeSet = new Set(concurrentNodeIds);
   const inDegree = new Map<string, number>();
   const adjacencyList = new Map<string, string[]>();

   // 初始化
   for (const nodeId of concurrentNodeIds) {
      inDegree.set(nodeId, 0);
      adjacencyList.set(nodeId, []);
   }

   // 构建图
   for (const edge of edges) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
         adjacencyList.get(edge.source)?.push(edge.target);
         inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      }
   }

   // Kahn's algorithm
   const queue: string[] = [];
   const result: string[] = [];

   for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
         queue.push(nodeId);
      }
   }

   while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of adjacencyList.get(current) ?? []) {
         const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
         inDegree.set(neighbor, newDegree);
         if (newDegree === 0) {
            queue.push(neighbor);
         }
      }
   }

   // 如果结果长度不等于节点数，说明存在环路
   if (result.length !== concurrentNodeIds.length) {
      return null;
   }

   return result;
}

/**
 * 分析并发流程结构
 * Analyze concurrent process structure
 *
 * @param nodes All workflow nodes
 * @param edges All workflow edges
 * @param concurrentNodeIds IDs of nodes within the concurrent process
 * @returns Structure analysis result
 */
export function analyzeConcurrentStructure(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): ConcurrentStructureAnalysis {
   const adjacencyList = buildAdjacencyList(edges, concurrentNodeIds);
   const reverseAdjacencyList = buildReverseAdjacencyList(edges, concurrentNodeIds);

   const startNodes: string[] = [];
   const endNodes: string[] = [];
   const internalNodes: string[] = [];
   const orphanedNodes: string[] = [];
   const multiplePathNodes: string[] = [];

   for (const nodeId of concurrentNodeIds) {
      const incomingCount = reverseAdjacencyList.get(nodeId)?.length ?? 0;
      const outgoingCount = adjacencyList.get(nodeId)?.length ?? 0;

      if (incomingCount === 0 && outgoingCount === 0) {
         orphanedNodes.push(nodeId);
      } else if (incomingCount === 0) {
         startNodes.push(nodeId);
      } else if (outgoingCount === 0) {
         endNodes.push(nodeId);
      } else {
         internalNodes.push(nodeId);
      }

      // 检查是否有多条入边（汇聚点）
      if (incomingCount > 1) {
         multiplePathNodes.push(nodeId);
      }
   }

   return {
      isValid: orphanedNodes.length === 0 && startNodes.length > 0 && endNodes.length > 0,
      startNodes,
      endNodes,
      internalNodes,
      orphanedNodes,
      multiplePathNodes
   };
}

/**
 * 并发流程管理器类
 * Concurrent process manager class
 *
 * Provides comprehensive management of concurrent processes including:
 * - Creation and configuration of concurrent start/end nodes
 * - Branch management
 * - Validation and structure analysis
 * - Topological sorting for execution order
 *
 * Requirements: 6.1-6.4
 */
export class ConcurrentProcessManager {
   private processData: ConcurrentProcessData;
   private nodes: Map<string, WorkflowNode> = new Map();
   private edges: WorkflowEdge[] = [];

   private static processIdCounter = 0;
   private static branchIdCounter = 0;

   /**
    * 生成唯一的流程ID
    * Generate unique process ID
    */
   static generateProcessId(prefix: string = 'concurrent_process'): string {
      return `${prefix}_${++this.processIdCounter}`;
   }

   /**
    * 生成唯一的分支ID
    * Generate unique branch ID
    */
   static generateBranchId(prefix: string = 'branch'): string {
      return `${prefix}_${++this.branchIdCounter}`;
   }

   /**
    * 重置ID计数器
    * Reset ID counters
    */
   static resetIdCounters(): void {
      this.processIdCounter = 0;
      this.branchIdCounter = 0;
   }

   constructor(id: string, name: string, concurrentStartNodeId: string, concurrentEndNodeId: string) {
      this.processData = {
         id,
         name,
         concurrentStartNodeId,
         concurrentEndNodeId,
         branches: [],
         containedNodeIds: []
      };
   }

   /**
    * 获取流程数据
    * Get process data
    */
   getProcessData(): ConcurrentProcessData {
      return { ...this.processData };
   }

   /**
    * 获取流程ID
    * Get process ID
    */
   getId(): string {
      return this.processData.id;
   }

   /**
    * 获取流程名称
    * Get process name
    */
   getName(): string {
      return this.processData.name;
   }

   /**
    * 更新流程名称
    * Update process name
    */
   updateName(name: string): void {
      this.processData.name = name;
   }

   /**
    * 获取并发开始节点ID
    * Get concurrent start node ID
    */
   getConcurrentStartNodeId(): string {
      return this.processData.concurrentStartNodeId;
   }

   /**
    * 获取并发结束节点ID
    * Get concurrent end node ID
    */
   getConcurrentEndNodeId(): string {
      return this.processData.concurrentEndNodeId;
   }

   /**
    * 获取所有包含的节点ID
    * Get all contained node IDs
    */
   getContainedNodeIds(): string[] {
      return [...this.processData.containedNodeIds];
   }

   /**
    * 获取所有分支
    * Get all branches
    */
   getBranches(): ConcurrentBranch[] {
      return this.processData.branches.map(b => ({ ...b, nodeIds: [...b.nodeIds] }));
   }

   /**
    * 添加节点到并发流程
    * Add node to concurrent process
    *
    * @param nodeId Node ID to add
    * @param node Optional node object for validation
    * @returns Validation result
    */
   addNode(nodeId: string, node?: WorkflowNode): ConcurrentValidationResult {
      const errors: string[] = [];

      // 验证节点类型
      if (node) {
         if (isBeginNode(node)) {
            errors.push(`不能将开始节点添加到并发流程 (Cannot add begin node to concurrent process)`);
         }
         if (isEndNode(node)) {
            errors.push(`不能将结束节点添加到并发流程 (Cannot add end node to concurrent process)`);
         }
         if (isExceptionNode(node)) {
            errors.push(`不能将异常节点添加到并发流程 (Cannot add exception node to concurrent process)`);
         }

         if (errors.length > 0) {
            return { isValid: false, errors };
         }

         this.nodes.set(nodeId, node);
      }

      if (!this.processData.containedNodeIds.includes(nodeId)) {
         this.processData.containedNodeIds.push(nodeId);
      }

      return { isValid: true, errors: [] };
   }

   /**
    * 从并发流程移除节点
    * Remove node from concurrent process
    *
    * @param nodeId Node ID to remove
    * @returns true if node was removed
    */
   removeNode(nodeId: string): boolean {
      const index = this.processData.containedNodeIds.indexOf(nodeId);
      if (index > -1) {
         this.processData.containedNodeIds.splice(index, 1);
         this.nodes.delete(nodeId);

         // 从所有分支中移除
         for (const branch of this.processData.branches) {
            const branchIndex = branch.nodeIds.indexOf(nodeId);
            if (branchIndex > -1) {
               branch.nodeIds.splice(branchIndex, 1);
            }
         }

         return true;
      }
      return false;
   }

   /**
    * 添加边
    * Add edge
    *
    * @param edge Edge to add
    */
   addEdge(edge: WorkflowEdge): void {
      this.edges.push(edge);
   }

   /**
    * 移除边
    * Remove edge
    *
    * @param edgeId Edge ID to remove
    * @returns true if edge was removed
    */
   removeEdge(edgeId: string): boolean {
      const index = this.edges.findIndex(e => e.id === edgeId);
      if (index > -1) {
         this.edges.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 设置边列表
    * Set edges list
    *
    * @param edges Edges to set
    */
   setEdges(edges: WorkflowEdge[]): void {
      this.edges = [...edges];
   }

   /**
    * 创建新分支
    * Create new branch
    *
    * @param name Branch name
    * @param nodeIds Optional initial node IDs
    * @returns Created branch
    */
   createBranch(name: string, nodeIds: string[] = []): ConcurrentBranch {
      const branch: ConcurrentBranch = {
         id: ConcurrentProcessManager.generateBranchId(),
         name,
         nodeIds: [...nodeIds]
      };

      this.processData.branches.push(branch);
      return { ...branch };
   }

   /**
    * 获取分支
    * Get branch by ID
    *
    * @param branchId Branch ID
    * @returns Branch or undefined
    */
   getBranch(branchId: string): ConcurrentBranch | undefined {
      const branch = this.processData.branches.find(b => b.id === branchId);
      return branch ? { ...branch, nodeIds: [...branch.nodeIds] } : undefined;
   }

   /**
    * 更新分支
    * Update branch
    *
    * @param branchId Branch ID
    * @param updates Partial branch updates
    * @returns true if branch was updated
    */
   updateBranch(branchId: string, updates: Partial<Omit<ConcurrentBranch, 'id'>>): boolean {
      const branch = this.processData.branches.find(b => b.id === branchId);
      if (branch) {
         if (updates.name !== undefined) branch.name = updates.name;
         if (updates.nodeIds !== undefined) branch.nodeIds = [...updates.nodeIds];
         if (updates.startNodeId !== undefined) branch.startNodeId = updates.startNodeId;
         if (updates.endNodeId !== undefined) branch.endNodeId = updates.endNodeId;
         return true;
      }
      return false;
   }

   /**
    * 删除分支
    * Delete branch
    *
    * @param branchId Branch ID
    * @returns true if branch was deleted
    */
   deleteBranch(branchId: string): boolean {
      const index = this.processData.branches.findIndex(b => b.id === branchId);
      if (index > -1) {
         this.processData.branches.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 将节点添加到分支
    * Add node to branch
    *
    * @param branchId Branch ID
    * @param nodeId Node ID
    * @returns true if node was added
    */
   addNodeToBranch(branchId: string, nodeId: string): boolean {
      const branch = this.processData.branches.find(b => b.id === branchId);
      if (branch && !branch.nodeIds.includes(nodeId)) {
         branch.nodeIds.push(nodeId);

         // 确保节点也在containedNodeIds中
         if (!this.processData.containedNodeIds.includes(nodeId)) {
            this.processData.containedNodeIds.push(nodeId);
         }

         return true;
      }
      return false;
   }

   /**
    * 从分支移除节点
    * Remove node from branch
    *
    * @param branchId Branch ID
    * @param nodeId Node ID
    * @returns true if node was removed
    */
   removeNodeFromBranch(branchId: string, nodeId: string): boolean {
      const branch = this.processData.branches.find(b => b.id === branchId);
      if (branch) {
         const index = branch.nodeIds.indexOf(nodeId);
         if (index > -1) {
            branch.nodeIds.splice(index, 1);
            return true;
         }
      }
      return false;
   }

   /**
    * 验证并发流程
    * Validate concurrent process
    *
    * @returns Validation result
    */
   validate(): ConcurrentValidationResult {
      const allNodes = Array.from(this.nodes.values());
      return validateConcurrentProcess(allNodes, this.edges, this.processData.containedNodeIds);
   }

   /**
    * 分析并发流程结构
    * Analyze concurrent process structure
    *
    * @returns Structure analysis result
    */
   analyzeStructure(): ConcurrentStructureAnalysis {
      const allNodes = Array.from(this.nodes.values());
      return analyzeConcurrentStructure(allNodes, this.edges, this.processData.containedNodeIds);
   }

   /**
    * 获取拓扑排序后的节点顺序
    * Get topologically sorted node order
    *
    * @returns Sorted node IDs or null if cycle exists
    */
   getTopologicalOrder(): string[] | null {
      const allNodes = Array.from(this.nodes.values());
      return topologicalSortConcurrentNodes(allNodes, this.edges, this.processData.containedNodeIds);
   }

   /**
    * 检测环路
    * Detect cycle
    *
    * @returns true if cycle exists
    */
   hasCycle(): boolean {
      const allNodes = Array.from(this.nodes.values());
      return detectCycleInConcurrentProcess(allNodes, this.edges, this.processData.containedNodeIds);
   }

   /**
    * 获取环路路径
    * Get cycle path
    *
    * @returns Cycle path or empty array if no cycle
    */
   getCyclePath(): string[] {
      const allNodes = Array.from(this.nodes.values());
      const result = detectCycleWithPath(allNodes, this.edges, this.processData.containedNodeIds);
      return result.cyclePath;
   }

   /**
    * 检查节点是否在并发流程中
    * Check if node is in concurrent process
    *
    * @param nodeId Node ID
    * @returns true if node is in process
    */
   containsNode(nodeId: string): boolean {
      return this.processData.containedNodeIds.includes(nodeId);
   }

   /**
    * 获取节点数量
    * Get node count
    *
    * @returns Number of nodes in process
    */
   getNodeCount(): number {
      return this.processData.containedNodeIds.length;
   }

   /**
    * 获取分支数量
    * Get branch count
    *
    * @returns Number of branches
    */
   getBranchCount(): number {
      return this.processData.branches.length;
   }

   /**
    * 清空并发流程
    * Clear concurrent process
    */
   clear(): void {
      this.processData.containedNodeIds = [];
      this.processData.branches = [];
      this.nodes.clear();
      this.edges = [];
   }

   /**
    * 从数据导入
    * Import from data
    *
    * @param data Process data to import
    * @param nodes Node map
    * @param edges Edge list
    */
   importFromData(data: ConcurrentProcessData, nodes: Map<string, WorkflowNode>, edges: WorkflowEdge[]): void {
      this.processData = {
         ...data,
         branches: data.branches.map(b => ({ ...b, nodeIds: [...b.nodeIds] })),
         containedNodeIds: [...data.containedNodeIds]
      };

      this.nodes = new Map();
      for (const nodeId of data.containedNodeIds) {
         const node = nodes.get(nodeId);
         if (node) {
            this.nodes.set(nodeId, node);
         }
      }

      this.edges = edges.filter(e => data.containedNodeIds.includes(e.source) || data.containedNodeIds.includes(e.target));
   }

   /**
    * 导出为数据
    * Export to data
    *
    * @returns Process data
    */
   exportToData(): ConcurrentProcessData {
      return {
         ...this.processData,
         branches: this.processData.branches.map(b => ({ ...b, nodeIds: [...b.nodeIds] })),
         containedNodeIds: [...this.processData.containedNodeIds]
      };
   }
}

/**
 * 创建并发开始节点
 * Create concurrent start node
 *
 * @param id Node ID
 * @param name Node name
 * @param position Node position
 * @returns Concurrent start node
 */
export function createConcurrentStartNode(id: string, name: string, position: Position): WorkflowNode {
   return {
      id,
      type: NodeType.CONCURRENT,
      name,
      position,
      properties: {
         subType: CONCURRENT_START,
         description: 'Concurrent process start'
      }
   };
}

/**
 * 创建并发结束节点
 * Create concurrent end node
 *
 * @param id Node ID
 * @param name Node name
 * @param position Node position
 * @returns Concurrent end node
 */
export function createConcurrentEndNode(id: string, name: string, position: Position): WorkflowNode {
   return {
      id,
      type: NodeType.CONCURRENT,
      name,
      position,
      properties: {
         subType: CONCURRENT_END,
         description: 'Concurrent process end'
      }
   };
}

/**
 * 创建并发流程管理器
 * Create concurrent process manager
 *
 * @param name Process name
 * @param startPosition Position for start node
 * @param endPosition Position for end node
 * @returns Object containing manager and created nodes
 */
export function createConcurrentProcess(
   name: string,
   startPosition: Position = { x: 0, y: 0 },
   endPosition: Position = { x: 400, y: 0 }
): {
   manager: ConcurrentProcessManager;
   startNode: WorkflowNode;
   endNode: WorkflowNode;
} {
   const processId = ConcurrentProcessManager.generateProcessId();
   const startNodeId = `${processId}_start`;
   const endNodeId = `${processId}_end`;

   const startNode = createConcurrentStartNode(startNodeId, `${name} Start`, startPosition);
   const endNode = createConcurrentEndNode(endNodeId, `${name} End`, endPosition);

   const manager = new ConcurrentProcessManager(processId, name, startNodeId, endNodeId);

   return { manager, startNode, endNode };
}

/**
 * 验证节点是否可以添加到并发流程
 * Validate if node can be added to concurrent process
 *
 * @param node Node to validate
 * @returns Validation result
 */
export function canAddNodeToConcurrentProcess(node: WorkflowNode): ConcurrentValidationResult {
   const errors: string[] = [];

   if (isBeginNode(node)) {
      errors.push(`开始节点不能添加到并发流程 (Begin node cannot be added to concurrent process)`);
   }
   if (isEndNode(node)) {
      errors.push(`结束节点不能添加到并发流程 (End node cannot be added to concurrent process)`);
   }
   if (isExceptionNode(node)) {
      errors.push(`异常节点不能添加到并发流程 (Exception node cannot be added to concurrent process)`);
   }

   return {
      isValid: errors.length === 0,
      errors
   };
}

/**
 * 获取并发流程中的所有路径
 * Get all paths in concurrent process from start to end
 *
 * @param edges All edges
 * @param startNodeId Start node ID
 * @param endNodeId End node ID
 * @param containedNodeIds All contained node IDs
 * @returns Array of paths (each path is an array of node IDs)
 */
export function getAllPathsInConcurrentProcess(
   edges: WorkflowEdge[],
   startNodeId: string,
   endNodeId: string,
   containedNodeIds: string[]
): string[][] {
   const adjacencyList = buildAdjacencyList(edges, containedNodeIds);
   const paths: string[][] = [];
   const currentPath: string[] = [];
   const visited = new Set<string>();

   function dfs(nodeId: string): void {
      currentPath.push(nodeId);
      visited.add(nodeId);

      if (nodeId === endNodeId) {
         paths.push([...currentPath]);
      } else {
         const neighbors = adjacencyList.get(nodeId) ?? [];
         for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
               dfs(neighbor);
            }
         }
      }

      currentPath.pop();
      visited.delete(nodeId);
   }

   dfs(startNodeId);
   return paths;
}

/**
 * 计算并发流程的并行度
 * Calculate parallelism degree of concurrent process
 *
 * @param edges All edges
 * @param containedNodeIds All contained node IDs
 * @returns Maximum number of parallel branches
 */
export function calculateParallelismDegree(edges: WorkflowEdge[], containedNodeIds: string[]): number {
   const adjacencyList = buildAdjacencyList(edges, containedNodeIds);
   let maxParallelism = 1;

   for (const nodeId of containedNodeIds) {
      const outgoingCount = adjacencyList.get(nodeId)?.length ?? 0;
      if (outgoingCount > maxParallelism) {
         maxParallelism = outgoingCount;
      }
   }

   return maxParallelism;
}
