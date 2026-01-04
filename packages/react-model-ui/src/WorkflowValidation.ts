/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程验证工具
 * Workflow validation utilities
 * 需求 8.4: 添加表单验证和错误提示功能
 */

import {
   getAllEdges,
   getAllNodes,
   getOutgoingEdges,
   isConcurrentNode,
   isDecisionNode,
   isDecisionTableNode,
   isEndNode,
   isExceptionNode,
   isProcessNode,
   NodeType,
   validateDecisionTableData,
   WorkflowModel
} from '@crossmodel/protocol';
import { WorkflowValidationResult } from './WorkflowContext';

/**
 * 验证工作流程模型
 * Validate workflow model
 */
export function validateWorkflowModel(model: WorkflowModel): WorkflowValidationResult {
   const errors: string[] = [];
   const warnings: string[] = [];
   const nodeErrors = new Map<string, string[]>();
   const edgeErrors = new Map<string, string[]>();

   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);

   // Validate workflow name
   if (!model.name || model.name.trim() === '') {
      warnings.push('工作流程应该有一个名称 (Workflow should have a name)');
   }

   // Validate nodes
   for (const node of nodes) {
      const nodeErrorList: string[] = [];

      // Validate node name
      if (!node.name || node.name.trim() === '') {
         nodeErrorList.push('节点应该有一个名称 (Node should have a name)');
      }

      // Validate end/exception nodes have expected value
      if (isEndNode(node) || isExceptionNode(node)) {
         if (node.expectedValue === undefined || node.expectedValue === null) {
            nodeErrorList.push('结束/异常节点必须设置预期值 (End/Exception nodes must have expected value)');
         }
      }

      // Validate process node has at most one outgoing edge
      if (isProcessNode(node)) {
         const outgoingEdges = getOutgoingEdges(model, node.id);
         if (outgoingEdges.length > 1) {
            nodeErrorList.push('过程节点只允许一条出边 (Process nodes allow only one outgoing edge)');
         }
      }

      // Validate decision node has unique branch values
      if (isDecisionNode(node)) {
         const branchValues = node.branches.map(b => b.value);
         const uniqueValues = new Set(branchValues);
         if (uniqueValues.size !== branchValues.length) {
            nodeErrorList.push('分支节点的所有输出边值必须唯一 (Decision node branch values must be unique)');
         }
         if (node.branches.length < 2) {
            nodeErrorList.push('分支节点至少需要两条分支 (Decision nodes require at least 2 branches)');
         }
      }

      // Validate decision table node
      if (isDecisionTableNode(node)) {
         const tableValidation = validateDecisionTableData(node.tableData);
         if (!tableValidation.isValid) {
            nodeErrorList.push(...tableValidation.errors);
         }
         if (tableValidation.warnings) {
            warnings.push(...tableValidation.warnings.map(w => `${node.name}: ${w}`));
         }
      }

      // Validate concurrent node
      if (isConcurrentNode(node)) {
         // Check for loops in concurrent process
         const hasLoop = detectLoopInConcurrentProcess(model, node.id);
         if (hasLoop) {
            nodeErrorList.push('并发流程不能包含环路 (Concurrent process cannot contain loops)');
         }
      }

      if (nodeErrorList.length > 0) {
         nodeErrors.set(node.id, nodeErrorList);
      }
   }

   // Validate edges
   for (const edge of edges) {
      const edgeErrorList: string[] = [];

      // Validate source and target exist
      if (!model.nodes.has(edge.source)) {
         edgeErrorList.push(`源节点 ${edge.source} 不存在 (Source node does not exist)`);
      }
      if (!model.nodes.has(edge.target)) {
         edgeErrorList.push(`目标节点 ${edge.target} 不存在 (Target node does not exist)`);
      }

      if (edgeErrorList.length > 0) {
         edgeErrors.set(edge.id, edgeErrorList);
      }
   }

   // Check for orphan nodes (nodes with no connections)
   for (const node of nodes) {
      const outgoing = getOutgoingEdges(model, node.id);
      const incoming = edges.filter(e => e.target === node.id);

      // Begin nodes should have no incoming edges
      if (node.type === NodeType.BEGIN && incoming.length > 0) {
         const nodeErrorList = nodeErrors.get(node.id) || [];
         nodeErrorList.push('开始节点不应该有入边 (Begin nodes should not have incoming edges)');
         nodeErrors.set(node.id, nodeErrorList);
      }

      // End/Exception nodes should have no outgoing edges
      if ((node.type === NodeType.END || node.type === NodeType.EXCEPTION) && outgoing.length > 0) {
         const nodeErrorList = nodeErrors.get(node.id) || [];
         nodeErrorList.push('结束/异常节点不应该有出边 (End/Exception nodes should not have outgoing edges)');
         nodeErrors.set(node.id, nodeErrorList);
      }

      // Warn about orphan nodes (except begin/end)
      if (node.type !== NodeType.BEGIN && node.type !== NodeType.END && node.type !== NodeType.EXCEPTION) {
         if (outgoing.length === 0 && incoming.length === 0) {
            warnings.push(`节点 "${node.name}" 没有任何连接 (Node "${node.name}" has no connections)`);
         }
      }
   }

   // Collect all errors
   for (const errorList of nodeErrors.values()) {
      errors.push(...errorList);
   }
   for (const errorList of edgeErrors.values()) {
      errors.push(...errorList);
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings,
      nodeErrors,
      edgeErrors
   };
}

/**
 * 检测并发流程中的环路
 * Detect loop in concurrent process
 */
function detectLoopInConcurrentProcess(model: WorkflowModel, concurrentNodeId: string): boolean {
   const concurrentNode = model.nodes.get(concurrentNodeId);
   if (!concurrentNode || !isConcurrentNode(concurrentNode)) {
      return false;
   }

   const parallelBranches = concurrentNode.parallelBranches;
   if (parallelBranches.length === 0) {
      return false;
   }

   // Use DFS to detect cycles
   const visited = new Set<string>();
   const recursionStack = new Set<string>();

   function hasCycle(nodeId: string): boolean {
      if (recursionStack.has(nodeId)) {
         return true;
      }
      if (visited.has(nodeId)) {
         return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = getOutgoingEdges(model, nodeId);
      for (const edge of outgoingEdges) {
         // Only check within parallel branches
         if (parallelBranches.includes(edge.target) || edge.target === concurrentNodeId) {
            if (hasCycle(edge.target)) {
               return true;
            }
         }
      }

      recursionStack.delete(nodeId);
      return false;
   }

   // Check each parallel branch for cycles
   for (const branchId of parallelBranches) {
      visited.clear();
      recursionStack.clear();
      if (hasCycle(branchId)) {
         return true;
      }
   }

   return false;
}

/**
 * 验证节点
 * Validate single node
 */
export function validateNode(model: WorkflowModel, nodeId: string): string[] {
   const result = validateWorkflowModel(model);
   return result.nodeErrors.get(nodeId) || [];
}

/**
 * 验证边
 * Validate single edge
 */
export function validateEdge(model: WorkflowModel, edgeId: string): string[] {
   const result = validateWorkflowModel(model);
   return result.edgeErrors.get(edgeId) || [];
}

/**
 * 检查工作流程是否可以保存
 * Check if workflow can be saved
 */
export function canSaveWorkflow(model: WorkflowModel): { canSave: boolean; blockers: string[] } {
   const validation = validateWorkflowModel(model);

   // Filter for blocking errors (not warnings)
   const blockers = validation.errors.filter(error => {
      // These are blocking errors that prevent saving
      return (
         error.includes('决策列内容不能完全相同') ||
         error.includes('决策表必须包含') ||
         error.includes('并发流程不能包含环路') ||
         error.includes('源节点') ||
         error.includes('目标节点')
      );
   });

   return {
      canSave: blockers.length === 0,
      blockers
   };
}
