/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowModel, getAllEdges, getAllNodes, getAllSwimlanes } from './model';
import { WorkflowComplexity, WorkflowIssue, WorkflowProjectAnalysis, WorkflowProjectStatistics, WorkflowSuggestion } from './project-types';
import { NodeType } from './types';

/**
 * 计算工作流程项目统计信息
 * Calculate workflow project statistics
 */
export function calculateWorkflowStatistics(model: WorkflowModel): WorkflowProjectStatistics {
   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);
   const swimlanes = getAllSwimlanes(model);

   // Calculate node type distribution
   const nodeTypeDistribution: Record<string, number> = {};
   for (const node of nodes) {
      const type = node.type;
      nodeTypeDistribution[type] = (nodeTypeDistribution[type] || 0) + 1;
   }

   return {
      totalWorkflows: 1, // Single model
      totalNodes: nodes.length,
      totalEdges: edges.length,
      totalSwimlanes: swimlanes.length,
      nodeTypeDistribution,
      lastUpdated: model.metadata.updatedAt,
      version: model.metadata.version
   };
}

/**
 * 分析工作流程项目
 * Analyze workflow project
 */
export function analyzeWorkflowProject(model: WorkflowModel): WorkflowProjectAnalysis {
   const issues: WorkflowIssue[] = [];
   const suggestions: WorkflowSuggestion[] = [];

   // Validate workflow structure
   validateWorkflowStructure(model, issues);

   // Check for optimization opportunities
   checkOptimizationOpportunities(model, suggestions);

   // Calculate complexity metrics
   const complexity = calculateComplexity(model);

   // Calculate health score
   const healthScore = calculateHealthScore(issues, complexity);

   return {
      healthScore,
      issues,
      suggestions,
      complexity
   };
}

/**
 * 验证工作流程结构
 * Validate workflow structure
 */
function validateWorkflowStructure(model: WorkflowModel, issues: WorkflowIssue[]): void {
   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);

   // Check for start node
   const startNodes = nodes.filter(n => n.type === NodeType.BEGIN);
   if (startNodes.length === 0) {
      issues.push({
         severity: 'error',
         message: '工作流程缺少开始节点',
         code: 'MISSING_START_NODE'
      });
   } else if (startNodes.length > 1) {
      issues.push({
         severity: 'warning',
         message: `工作流程包含多个开始节点 (${startNodes.length})`,
         code: 'MULTIPLE_START_NODES'
      });
   }

   // Check for end node
   const endNodes = nodes.filter(n => n.type === NodeType.END || n.type === NodeType.EXCEPTION);
   if (endNodes.length === 0) {
      issues.push({
         severity: 'error',
         message: '工作流程缺少结束节点',
         code: 'MISSING_END_NODE'
      });
   }

   // Check for orphan nodes (nodes without any connections)
   for (const node of nodes) {
      const hasIncoming = edges.some(e => e.target === node.id);
      const hasOutgoing = edges.some(e => e.source === node.id);

      if (node.type !== NodeType.BEGIN && !hasIncoming) {
         issues.push({
            severity: 'warning',
            message: `节点 "${node.name}" 没有入边`,
            location: node.id,
            code: 'NO_INCOMING_EDGE'
         });
      }

      if (node.type !== NodeType.END && node.type !== NodeType.EXCEPTION && !hasOutgoing) {
         issues.push({
            severity: 'warning',
            message: `节点 "${node.name}" 没有出边`,
            location: node.id,
            code: 'NO_OUTGOING_EDGE'
         });
      }
   }

   // Check process nodes for multiple outgoing edges
   for (const node of nodes) {
      if (node.type === NodeType.PROCESS) {
         const outgoingEdges = edges.filter(e => e.source === node.id);
         if (outgoingEdges.length > 1) {
            issues.push({
               severity: 'error',
               message: `过程节点 "${node.name}" 有多条出边 (${outgoingEdges.length})，只允许一条`,
               location: node.id,
               code: 'PROCESS_MULTIPLE_OUTGOING'
            });
         }
      }
   }

   // Check decision nodes for unique edge values
   for (const node of nodes) {
      if (node.type === NodeType.DECISION) {
         const outgoingEdges = edges.filter(e => e.source === node.id);
         const values = outgoingEdges.map(e => e.value).filter((v): v is string => v !== undefined);
         const uniqueValues = new Set(values);
         if (values.length !== uniqueValues.size) {
            issues.push({
               severity: 'error',
               message: `分支节点 "${node.name}" 的输出边值不唯一`,
               location: node.id,
               code: 'DECISION_DUPLICATE_VALUES'
            });
         }
      }
   }
}

/**
 * 检查优化机会
 * Check optimization opportunities
 */
function checkOptimizationOpportunities(model: WorkflowModel, suggestions: WorkflowSuggestion[]): void {
   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);

   // Check for long sequential chains
   let maxChainLength = 0;
   for (const node of nodes) {
      if (node.type === NodeType.BEGIN) {
         const chainLength = calculateChainLength(node.id, edges, new Set());
         maxChainLength = Math.max(maxChainLength, chainLength);
      }
   }

   if (maxChainLength > 10) {
      suggestions.push({
         type: 'readability',
         message: `工作流程包含较长的顺序链 (${maxChainLength} 个节点)，考虑使用子流程进行分组`,
         priority: 'medium'
      });
   }

   // Check for too many decision nodes
   const decisionNodes = nodes.filter(n => n.type === NodeType.DECISION);
   if (decisionNodes.length > 5) {
      suggestions.push({
         type: 'maintainability',
         message: `工作流程包含较多分支节点 (${decisionNodes.length})，考虑使用决策表简化逻辑`,
         priority: 'medium'
      });
   }

   // Check for unused swimlanes
   const swimlanes = getAllSwimlanes(model);
   for (const swimlane of swimlanes) {
      if (swimlane.containedNodes.length === 0) {
         suggestions.push({
            type: 'maintainability',
            message: `泳道 "${swimlane.name}" 为空，考虑删除或添加节点`,
            priority: 'low'
         });
      }
   }

   // Check for nodes without descriptions
   const nodesWithoutDescription = nodes.filter(n => !n.properties.description);
   if (nodesWithoutDescription.length > nodes.length * 0.5) {
      suggestions.push({
         type: 'readability',
         message: '超过一半的节点没有描述，建议添加描述以提高可读性',
         priority: 'low'
      });
   }
}

/**
 * 计算链长度
 * Calculate chain length
 */
function calculateChainLength(nodeId: string, edges: { source: string; target: string }[], visited: Set<string>): number {
   if (visited.has(nodeId)) {
      return 0;
   }
   visited.add(nodeId);

   const outgoingEdges = edges.filter(e => e.source === nodeId);
   if (outgoingEdges.length === 0) {
      return 1;
   }

   let maxLength = 0;
   for (const edge of outgoingEdges) {
      const length = calculateChainLength(edge.target, edges, visited);
      maxLength = Math.max(maxLength, length);
   }

   return 1 + maxLength;
}

/**
 * 计算复杂度指标
 * Calculate complexity metrics
 */
function calculateComplexity(model: WorkflowModel): WorkflowComplexity {
   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);

   // Cyclomatic complexity: E - N + 2P (where P is number of connected components, usually 1)
   const cyclomaticComplexity = edges.length - nodes.length + 2;

   // Calculate nesting depth (simplified: max depth of decision branches)
   const nestingDepth = calculateNestingDepth(model);

   // Branching factor: average number of outgoing edges per node
   const totalOutgoing = edges.length;
   const branchingFactor = nodes.length > 0 ? totalOutgoing / nodes.length : 0;

   // Path count (simplified estimation based on decision nodes)
   const decisionNodes = nodes.filter(n => n.type === NodeType.DECISION);
   const pathCount = Math.pow(2, decisionNodes.length);

   return {
      cyclomaticComplexity: Math.max(1, cyclomaticComplexity),
      nestingDepth,
      branchingFactor: Math.round(branchingFactor * 100) / 100,
      pathCount
   };
}

/**
 * 计算嵌套深度
 * Calculate nesting depth
 */
function calculateNestingDepth(model: WorkflowModel): number {
   const nodes = getAllNodes(model);
   const edges = getAllEdges(model);

   let maxDepth = 0;
   const startNodes = nodes.filter(n => n.type === NodeType.BEGIN);

   for (const startNode of startNodes) {
      const depth = calculateDepthFromNode(startNode.id, edges, new Set(), 0);
      maxDepth = Math.max(maxDepth, depth);
   }

   return maxDepth;
}

/**
 * 从节点计算深度
 * Calculate depth from node
 */
function calculateDepthFromNode(
   nodeId: string,
   edges: { source: string; target: string }[],
   visited: Set<string>,
   currentDepth: number
): number {
   if (visited.has(nodeId)) {
      return currentDepth;
   }
   visited.add(nodeId);

   const outgoingEdges = edges.filter(e => e.source === nodeId);
   if (outgoingEdges.length === 0) {
      return currentDepth;
   }

   let maxDepth = currentDepth;
   for (const edge of outgoingEdges) {
      const depth = calculateDepthFromNode(edge.target, edges, new Set(visited), currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
   }

   return maxDepth;
}

/**
 * 计算健康度评分
 * Calculate health score
 */
function calculateHealthScore(issues: WorkflowIssue[], complexity: WorkflowComplexity): number {
   let score = 100;

   // Deduct points for issues
   for (const issue of issues) {
      switch (issue.severity) {
         case 'error':
            score -= 20;
            break;
         case 'warning':
            score -= 10;
            break;
         case 'info':
            score -= 2;
            break;
      }
   }

   // Deduct points for high complexity
   if (complexity.cyclomaticComplexity > 10) {
      score -= 10;
   }
   if (complexity.nestingDepth > 5) {
      score -= 5;
   }
   if (complexity.pathCount > 32) {
      score -= 10;
   }

   return Math.max(0, Math.min(100, score));
}
