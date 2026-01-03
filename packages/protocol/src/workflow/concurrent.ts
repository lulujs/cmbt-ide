/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowEdge } from './edge';
import { WorkflowNode, isBeginNode, isEndNode } from './node';
import { NodeType } from './types';

/**
 * 并发流程验证结果接口
 * Concurrent process validation result interface
 */
export interface ConcurrentValidationResult {
   isValid: boolean;
   errors: string[];
   hasCycle?: boolean;
   invalidNodes?: string[];
}

/**
 * 检测并发流程中的环路
 * Detect cycles in concurrent process using DFS
 */
export function detectCycleInConcurrentProcess(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): boolean {
   const nodeSet = new Set(concurrentNodeIds);
   const adjacencyList = new Map<string, string[]>();

   // 构建邻接表（只包含并发流程内的节点）
   for (const nodeId of concurrentNodeIds) {
      adjacencyList.set(nodeId, []);
   }

   for (const edge of edges) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
         const neighbors = adjacencyList.get(edge.source);
         if (neighbors) {
            neighbors.push(edge.target);
         }
      }
   }

   // DFS检测环路
   const visited = new Set<string>();
   const recursionStack = new Set<string>();

   function dfs(nodeId: string): boolean {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacencyList.get(nodeId) ?? [];
      for (const neighbor of neighbors) {
         if (!visited.has(neighbor)) {
            if (dfs(neighbor)) {
               return true;
            }
         } else if (recursionStack.has(neighbor)) {
            return true; // 发现环路
         }
      }

      recursionStack.delete(nodeId);
      return false;
   }

   for (const nodeId of concurrentNodeIds) {
      if (!visited.has(nodeId)) {
         if (dfs(nodeId)) {
            return true;
         }
      }
   }

   return false;
}

/**
 * 验证并发流程结构
 * Validate concurrent process structure
 */
export function validateConcurrentProcess(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): ConcurrentValidationResult {
   const errors: string[] = [];
   const invalidNodes: string[] = [];

   // 获取并发流程内的节点
   const concurrentNodes = nodes.filter(n => concurrentNodeIds.includes(n.id));

   // 检查是否包含开始或结束节点
   for (const node of concurrentNodes) {
      if (isBeginNode(node)) {
         errors.push(`并发流程不能包含开始节点: ${node.name}`);
         invalidNodes.push(node.id);
      }
      if (isEndNode(node)) {
         errors.push(`并发流程不能包含结束节点: ${node.name}`);
         invalidNodes.push(node.id);
      }
   }

   // 检测环路
   const hasCycle = detectCycleInConcurrentProcess(nodes, edges, concurrentNodeIds);
   if (hasCycle) {
      errors.push('并发流程不能包含环路');
   }

   return {
      isValid: errors.length === 0,
      errors,
      hasCycle,
      invalidNodes: invalidNodes.length > 0 ? invalidNodes : undefined
   };
}

/**
 * 拓扑排序并发流程节点
 * Topological sort of concurrent process nodes
 */
export function topologicalSortConcurrentNodes(
   nodes: WorkflowNode[],
   edges: WorkflowEdge[],
   concurrentNodeIds: string[]
): string[] | null {
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
 * 并发开始节点类型
 * Concurrent start node type
 */
export const CONCURRENT_START = 'concurrent_start';

/**
 * 并发结束节点类型
 * Concurrent end node type
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
