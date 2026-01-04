/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { DecisionTableData, validateDecisionTableData } from './decision-table';
import { WorkflowNode } from './node';
import { NodeType } from './types';
import {
   addValidationError,
   createEmptyValidationResult,
   WorkflowValidationError,
   WorkflowValidationErrors,
   WorkflowValidationResult,
   WorkflowValidationSeverity
} from './validation-errors';

/**
 * 工作流程边接口（简化版）
 * Workflow edge interface (simplified)
 */
export interface WorkflowEdgeSimple {
   id: string;
   sourceId: string;
   targetId: string;
   condition?: string;
}

/**
 * 工作流程模型接口（简化版）
 * Workflow model interface (simplified)
 */
export interface WorkflowModelSimple {
   name?: string;
   nodes: WorkflowNode[];
   edges: WorkflowEdgeSimple[];
}

/**
 * 创建验证错误的辅助函数
 * Helper function to create validation error
 */
function createValidationError(
   code: string,
   message: string,
   messageZh: string,
   severity: WorkflowValidationSeverity,
   options?: Partial<WorkflowValidationError>
): WorkflowValidationError {
   return {
      code,
      message,
      messageZh,
      severity,
      ...options
   };
}

/**
 * 工作流程验证服务类
 * Workflow validation service class
 * 提供全面的错误处理和用户友好的错误信息
 */
export class WorkflowValidationService {
   /**
    * 验证完整的工作流程模型
    * Validate complete workflow model
    */
   static validateWorkflowModel(model: WorkflowModelSimple): WorkflowValidationResult {
      const result = createEmptyValidationResult();

      // 验证工作流程名称
      this.validateWorkflowName(model, result);

      // 验证节点
      this.validateNodes(model, result);

      // 验证边
      this.validateEdges(model, result);

      // 验证工作流程结构
      this.validateWorkflowStructure(model, result);

      return result;
   }

   /**
    * 验证工作流程名称
    * Validate workflow name
    */
   private static validateWorkflowName(model: WorkflowModelSimple, result: WorkflowValidationResult): void {
      if (!model.name || model.name.trim() === '') {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.WorkflowMissingName,
               'Workflow should have a name',
               '工作流程应该有一个名称',
               'warning',
               {
                  suggestion: 'Add a descriptive name to identify this workflow',
                  suggestionZh: '添加一个描述性名称来标识此工作流程'
               }
            )
         );
      }
   }

   /**
    * 验证所有节点
    * Validate all nodes
    */
   private static validateNodes(model: WorkflowModelSimple, result: WorkflowValidationResult): void {
      if (!model.nodes || model.nodes.length === 0) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.WorkflowEmptyNodes,
               'Workflow should contain at least one node',
               '工作流程应该包含至少一个节点',
               'warning',
               {
                  suggestion: 'Add nodes to define the workflow process',
                  suggestionZh: '添加节点来定义工作流程'
               }
            )
         );
         return;
      }

      // 计算每个节点的出边数量
      const outgoingEdgeCounts = new Map<string, number>();
      for (const edge of model.edges) {
         const count = outgoingEdgeCounts.get(edge.sourceId) || 0;
         outgoingEdgeCounts.set(edge.sourceId, count + 1);
      }

      // 验证每个节点
      for (const node of model.nodes) {
         const outgoingEdgeCount = outgoingEdgeCounts.get(node.id) || 0;
         this.validateNode(node, outgoingEdgeCount, result);
      }
   }

   /**
    * 验证单个节点
    * Validate single node
    */
   static validateNode(node: WorkflowNode, outgoingEdgeCount: number, result: WorkflowValidationResult): void {
      switch (node.type) {
         case NodeType.BEGIN:
            this.validateBeginNode(node, result);
            break;
         case NodeType.END:
            this.validateEndNode(node, result);
            break;
         case NodeType.EXCEPTION:
            this.validateExceptionNode(node, result);
            break;
         case NodeType.PROCESS:
            this.validateProcessNode(node, outgoingEdgeCount, result);
            break;
         case NodeType.DECISION:
            this.validateDecisionNode(node, result);
            break;
         case NodeType.DECISION_TABLE:
            this.validateDecisionTableNode(node, result);
            break;
         case NodeType.SUBPROCESS:
            this.validateSubprocessNode(node, result);
            break;
         case NodeType.CONCURRENT:
            this.validateConcurrentNode(node, result);
            break;
         case NodeType.AUTO:
            this.validateAutoNode(node, result);
            break;
         case NodeType.API:
            this.validateApiNode(node, result);
            break;
      }
   }

   /**
    * 验证开始节点 - 需求 1.1
    * Validate begin node
    */
   private static validateBeginNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      // 开始节点不应该有预期值
      if ('expectedValue' in node && node.expectedValue !== undefined) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.BeginNodeHasExpectedValue,
               `Begin node "${node.name}" should not have an expected value`,
               `开始节点 "${node.name}" 不应该有预期值`,
               'error',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.BEGIN,
                  property: 'expectedValue',
                  suggestion: 'Remove the expected value from the begin node',
                  suggestionZh: '从开始节点移除预期值'
               }
            )
         );
      }

      // 验证名称
      this.validateNodeName(node, WorkflowValidationErrors.BeginNodeMissingName, result);
   }

   /**
    * 验证结束节点 - 需求 1.2
    * Validate end node
    */
   private static validateEndNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      // 结束节点必须有预期值属性
      if (!('expectedValue' in node)) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.EndNodeMissingExpectedValue,
               `End node "${node.name}" must have an expected value property`,
               `结束节点 "${node.name}" 必须有预期值属性`,
               'error',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.END,
                  property: 'expectedValue',
                  suggestion: 'Add an expected value to define the successful outcome',
                  suggestionZh: '添加预期值来定义成功的结果'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.EndNodeMissingName, result);
   }

   /**
    * 验证异常节点 - 需求 1.3
    * Validate exception node
    */
   private static validateExceptionNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      // 异常节点必须有预期值属性
      if (!('expectedValue' in node)) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.ExceptionNodeMissingExpectedValue,
               `Exception node "${node.name}" must have an expected value property`,
               `异常节点 "${node.name}" 必须有预期值属性`,
               'error',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.EXCEPTION,
                  property: 'expectedValue',
                  suggestion: 'Add an expected value to define the exception outcome',
                  suggestionZh: '添加预期值来定义异常结果'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.ExceptionNodeMissingName, result);
   }

   /**
    * 验证过程节点 - 需求 1.4
    * Validate process node
    */
   private static validateProcessNode(node: WorkflowNode, outgoingEdgeCount: number, result: WorkflowValidationResult): void {
      // 过程节点只允许一条出边
      if (outgoingEdgeCount > 1) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.ProcessNodeMultipleOutgoingEdges,
               `Process node "${node.name}" allows only one outgoing edge, currently has ${outgoingEdgeCount}`,
               `过程节点 "${node.name}" 只允许一条出边，当前有 ${outgoingEdgeCount} 条`,
               'error',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.PROCESS,
                  suggestion: `Remove ${outgoingEdgeCount - 1} outgoing edge(s) or convert to a decision node`,
                  suggestionZh: `移除 ${outgoingEdgeCount - 1} 条出边，或将节点转换为分支节点`
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.ProcessNodeMissingName, result);
   }

   /**
    * 验证分支节点 - 需求 1.5, 1.6
    * Validate decision node
    */
   private static validateDecisionNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const decisionNode = node as WorkflowNode & { branches?: Array<{ id: string; value?: string }> };

      if (decisionNode.branches) {
         // 验证分支数量
         if (decisionNode.branches.length < 2) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.DecisionNodeInsufficientBranches,
                  `Decision node "${node.name}" should have at least two branches`,
                  `分支节点 "${node.name}" 应该至少有两条分支`,
                  'warning',
                  {
                     nodeId: node.id,
                     nodeName: node.name,
                     nodeType: NodeType.DECISION,
                     property: 'branches',
                     suggestion: 'Add more branches to handle different conditions',
                     suggestionZh: '添加更多分支来处理不同的条件'
                  }
               )
            );
         }

         // 验证分支值唯一性
         const values = decisionNode.branches.map(b => b.value).filter((v): v is string => v !== undefined && v !== '');
         const uniqueValues = new Set(values);
         if (values.length !== uniqueValues.size) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.DecisionNodeDuplicateBranchValues,
                  `Decision node "${node.name}" has duplicate branch values`,
                  `分支节点 "${node.name}" 的输出边值必须唯一`,
                  'error',
                  {
                     nodeId: node.id,
                     nodeName: node.name,
                     nodeType: NodeType.DECISION,
                     property: 'branches',
                     suggestion: 'Ensure all branch values are unique',
                     suggestionZh: '确保所有分支值都是唯一的'
                  }
               )
            );
         }

         // 检查空分支值
         const emptyValues = decisionNode.branches.filter(b => !b.value || b.value.trim() === '');
         if (emptyValues.length > 0) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.DecisionNodeEmptyBranchValue,
                  `Decision node "${node.name}" has ${emptyValues.length} branch(es) with empty values`,
                  `分支节点 "${node.name}" 有 ${emptyValues.length} 个分支值为空`,
                  'warning',
                  {
                     nodeId: node.id,
                     nodeName: node.name,
                     nodeType: NodeType.DECISION,
                     property: 'branches',
                     suggestion: 'Provide meaningful values for all branches',
                     suggestionZh: '为所有分支提供有意义的值'
                  }
               )
            );
         }
      }

      this.validateNodeName(node, WorkflowValidationErrors.DecisionNodeMissingName, result);
   }

   /**
    * 验证决策表节点 - 需求 2.1-2.5
    * Validate decision table node
    */
   private static validateDecisionTableNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const dtNode = node as WorkflowNode & { tableData?: DecisionTableData };

      if (dtNode.tableData) {
         const tableValidation = validateDecisionTableData(dtNode.tableData);

         // 转换决策表验证错误
         for (const error of tableValidation.errors) {
            let code = WorkflowValidationErrors.DecisionTableMissingDecisionColumns;
            if (error.includes('输出列') || error.includes('output column')) {
               code = WorkflowValidationErrors.DecisionTableMissingOutputColumns;
            } else if (error.includes('完全相同') || error.includes('identical')) {
               code = WorkflowValidationErrors.DecisionTableDuplicateDecisionRows;
            } else if (error.includes('列ID') || error.includes('Column ID')) {
               code = WorkflowValidationErrors.DecisionTableDuplicateColumnIds;
            } else if (error.includes('行ID') || error.includes('Row ID')) {
               code = WorkflowValidationErrors.DecisionTableDuplicateRowIds;
            }

            addValidationError(
               result,
               createValidationError(code, error.split('(')[0].trim(), error.split('(')[0].trim(), 'error', {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.DECISION_TABLE,
                  property: 'tableData',
                  suggestion: this.getDecisionTableSuggestion(code),
                  suggestionZh: this.getDecisionTableSuggestionZh(code)
               })
            );
         }

         // 转换警告
         if (tableValidation.warnings) {
            for (const warning of tableValidation.warnings) {
               addValidationError(
                  result,
                  createValidationError(
                     WorkflowValidationErrors.DecisionTableEmptyRows,
                     warning.split('(')[0].trim(),
                     warning.split('(')[0].trim(),
                     'warning',
                     {
                        nodeId: node.id,
                        nodeName: node.name,
                        nodeType: NodeType.DECISION_TABLE,
                        property: 'tableData'
                     }
                  )
               );
            }
         }
      }

      this.validateNodeName(node, WorkflowValidationErrors.DecisionTableMissingName, result);
   }

   /**
    * 获取决策表错误的修复建议
    * Get fix suggestion for decision table error
    */
   private static getDecisionTableSuggestion(code: string): string {
      switch (code) {
         case WorkflowValidationErrors.DecisionTableMissingDecisionColumns:
            return 'Add at least one decision column to define the conditions';
         case WorkflowValidationErrors.DecisionTableMissingOutputColumns:
            return 'Add at least one output column to define the results';
         case WorkflowValidationErrors.DecisionTableDuplicateDecisionRows:
            return 'Modify the decision values to make each row unique';
         case WorkflowValidationErrors.DecisionTableDuplicateColumnIds:
            return 'Ensure all column IDs are unique';
         case WorkflowValidationErrors.DecisionTableDuplicateRowIds:
            return 'Ensure all row IDs are unique';
         default:
            return 'Review and fix the decision table configuration';
      }
   }

   /**
    * 获取决策表错误的中文修复建议
    * Get Chinese fix suggestion for decision table error
    */
   private static getDecisionTableSuggestionZh(code: string): string {
      switch (code) {
         case WorkflowValidationErrors.DecisionTableMissingDecisionColumns:
            return '添加至少一个决策列来定义条件';
         case WorkflowValidationErrors.DecisionTableMissingOutputColumns:
            return '添加至少一个输出列来定义结果';
         case WorkflowValidationErrors.DecisionTableDuplicateDecisionRows:
            return '修改决策值使每行唯一';
         case WorkflowValidationErrors.DecisionTableDuplicateColumnIds:
            return '确保所有列ID都是唯一的';
         case WorkflowValidationErrors.DecisionTableDuplicateRowIds:
            return '确保所有行ID都是唯一的';
         default:
            return '检查并修复决策表配置';
      }
   }

   /**
    * 验证子流程节点 - 需求 1.8
    * Validate subprocess node
    */
   private static validateSubprocessNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const subprocessNode = node as WorkflowNode & { referencePath?: string };

      if (!subprocessNode.referencePath || subprocessNode.referencePath.trim() === '') {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.SubprocessNodeMissingReferencePath,
               `Subprocess node "${node.name}" has no reference path`,
               `子流程节点 "${node.name}" 没有引用路径`,
               'warning',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.SUBPROCESS,
                  property: 'referencePath',
                  suggestion: 'Specify the path to the referenced workflow',
                  suggestionZh: '指定引用的工作流程路径'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.SubprocessNodeMissingName, result);
   }

   /**
    * 验证并发节点 - 需求 6.1-6.4
    * Validate concurrent node
    */
   private static validateConcurrentNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const concurrentNode = node as WorkflowNode & { parallelBranches?: string[] };

      if (!concurrentNode.parallelBranches || concurrentNode.parallelBranches.length === 0) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.ConcurrentNodeEmptyBranches,
               `Concurrent node "${node.name}" has no parallel branches`,
               `并发节点 "${node.name}" 没有并行分支`,
               'warning',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.CONCURRENT,
                  property: 'parallelBranches',
                  suggestion: 'Add nodes to the parallel branches',
                  suggestionZh: '向并行分支添加节点'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.ConcurrentNodeMissingName, result);
   }

   /**
    * 验证Auto节点 - 需求 1.10
    * Validate auto node
    */
   private static validateAutoNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const autoNode = node as WorkflowNode & { automationConfig?: Record<string, unknown> };

      if (!autoNode.automationConfig || Object.keys(autoNode.automationConfig).length === 0) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.AutoNodeMissingConfig,
               `Auto node "${node.name}" has no automation configuration`,
               `Auto节点 "${node.name}" 没有自动化配置`,
               'warning',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.AUTO,
                  property: 'automationConfig',
                  suggestion: 'Configure the automation settings for this node',
                  suggestionZh: '为此节点配置自动化设置'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.AutoNodeMissingName, result);
   }

   /**
    * 验证API节点 - 需求 1.11
    * Validate API node
    */
   private static validateApiNode(node: WorkflowNode, result: WorkflowValidationResult): void {
      const apiNode = node as WorkflowNode & { apiEndpoint?: string };

      if (!apiNode.apiEndpoint || apiNode.apiEndpoint.trim() === '') {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.ApiNodeMissingEndpoint,
               `API node "${node.name}" has no endpoint configured`,
               `API节点 "${node.name}" 没有配置端点`,
               'warning',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.API,
                  property: 'apiEndpoint',
                  suggestion: 'Specify the API endpoint URL',
                  suggestionZh: '指定API端点URL'
               }
            )
         );
      } else if (apiNode.apiEndpoint && !this.isValidUrl(apiNode.apiEndpoint)) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.ApiNodeInvalidEndpoint,
               `API node "${node.name}" has an invalid endpoint URL`,
               `API节点 "${node.name}" 的端点URL无效`,
               'error',
               {
                  nodeId: node.id,
                  nodeName: node.name,
                  nodeType: NodeType.API,
                  property: 'apiEndpoint',
                  suggestion: 'Provide a valid URL (e.g., https://api.example.com/endpoint)',
                  suggestionZh: '提供有效的URL（例如：https://api.example.com/endpoint）'
               }
            )
         );
      }

      this.validateNodeName(node, WorkflowValidationErrors.ApiNodeMissingName, result);
   }

   /**
    * 验证节点名称
    * Validate node name
    */
   private static validateNodeName(node: WorkflowNode, errorCode: string, result: WorkflowValidationResult): void {
      if (!node.name || node.name.trim() === '') {
         const nodeTypeLabel = this.getNodeTypeLabel(node.type);
         addValidationError(
            result,
            createValidationError(
               errorCode,
               `${nodeTypeLabel} should have a name`,
               `${this.getNodeTypeLabelZh(node.type)}应该有一个名称`,
               'warning',
               {
                  nodeId: node.id,
                  nodeType: node.type,
                  property: 'name',
                  suggestion: `Provide a descriptive name for this ${nodeTypeLabel.toLowerCase()}`,
                  suggestionZh: `为此${this.getNodeTypeLabelZh(node.type)}提供一个描述性名称`
               }
            )
         );
      }
   }

   /**
    * 验证边
    * Validate edges
    */
   private static validateEdges(model: WorkflowModelSimple, result: WorkflowValidationResult): void {
      const nodeIds = new Set(model.nodes.map(n => n.id));
      const edgeSet = new Set<string>();

      for (const edge of model.edges) {
         // 检查源节点
         if (!edge.sourceId) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeMissingSource,
                  `Edge "${edge.id}" is missing a source node`,
                  `边 "${edge.id}" 缺少源节点`,
                  'error',
                  {
                     suggestion: 'Connect the edge to a source node',
                     suggestionZh: '将边连接到源节点'
                  }
               )
            );
         } else if (!nodeIds.has(edge.sourceId)) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeSourceNotFound,
                  `Edge "${edge.id}" references non-existent source node "${edge.sourceId}"`,
                  `边 "${edge.id}" 引用了不存在的源节点 "${edge.sourceId}"`,
                  'error',
                  {
                     suggestion: 'Select a valid source node or remove the edge',
                     suggestionZh: '选择有效的源节点或删除此边'
                  }
               )
            );
         }

         // 检查目标节点
         if (!edge.targetId) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeMissingTarget,
                  `Edge "${edge.id}" is missing a target node`,
                  `边 "${edge.id}" 缺少目标节点`,
                  'error',
                  {
                     suggestion: 'Connect the edge to a target node',
                     suggestionZh: '将边连接到目标节点'
                  }
               )
            );
         } else if (!nodeIds.has(edge.targetId)) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeTargetNotFound,
                  `Edge "${edge.id}" references non-existent target node "${edge.targetId}"`,
                  `边 "${edge.id}" 引用了不存在的目标节点 "${edge.targetId}"`,
                  'error',
                  {
                     suggestion: 'Select a valid target node or remove the edge',
                     suggestionZh: '选择有效的目标节点或删除此边'
                  }
               )
            );
         }

         // 检查自环
         if (edge.sourceId && edge.targetId && edge.sourceId === edge.targetId) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeSelfLoop,
                  `Edge "${edge.id}" creates a self-loop on node "${edge.sourceId}"`,
                  `边 "${edge.id}" 在节点 "${edge.sourceId}" 上创建了自环`,
                  'warning',
                  {
                     suggestion: 'Self-loops are usually not recommended in workflows',
                     suggestionZh: '工作流程中通常不建议使用自环'
                  }
               )
            );
         }

         // 检查重复边
         const edgeKey = `${edge.sourceId}->${edge.targetId}`;
         if (edgeSet.has(edgeKey)) {
            addValidationError(
               result,
               createValidationError(
                  WorkflowValidationErrors.EdgeDuplicate,
                  `Duplicate edge from "${edge.sourceId}" to "${edge.targetId}"`,
                  `从 "${edge.sourceId}" 到 "${edge.targetId}" 存在重复的边`,
                  'warning',
                  {
                     suggestion: 'Remove the duplicate edge',
                     suggestionZh: '删除重复的边'
                  }
               )
            );
         } else {
            edgeSet.add(edgeKey);
         }
      }
   }

   /**
    * 验证工作流程结构
    * Validate workflow structure
    */
   private static validateWorkflowStructure(model: WorkflowModelSimple, result: WorkflowValidationResult): void {
      if (!model.nodes || model.nodes.length === 0) {
         return;
      }

      // 检查开始节点
      const beginNodes = model.nodes.filter(n => n.type === NodeType.BEGIN);
      if (beginNodes.length === 0) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.WorkflowMissingBeginNode,
               'Workflow should have at least one begin node',
               '工作流程应该有至少一个开始节点',
               'warning',
               {
                  suggestion: 'Add a begin node to define the workflow entry point',
                  suggestionZh: '添加开始节点来定义工作流程的入口点'
               }
            )
         );
      } else if (beginNodes.length > 1) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.WorkflowMultipleBeginNodes,
               `Workflow has ${beginNodes.length} begin nodes, typically only one is needed`,
               `工作流程有 ${beginNodes.length} 个开始节点，通常只需要一个`,
               'warning',
               {
                  suggestion: 'Consider using only one begin node for clarity',
                  suggestionZh: '考虑只使用一个开始节点以保持清晰'
               }
            )
         );
      }

      // 检查结束节点
      const endNodes = model.nodes.filter(n => n.type === NodeType.END || n.type === NodeType.EXCEPTION);
      if (endNodes.length === 0) {
         addValidationError(
            result,
            createValidationError(
               WorkflowValidationErrors.WorkflowMissingEndNode,
               'Workflow should have at least one end or exception node',
               '工作流程应该有至少一个结束节点或异常节点',
               'warning',
               {
                  suggestion: 'Add an end node to define the workflow exit point',
                  suggestionZh: '添加结束节点来定义工作流程的出口点'
               }
            )
         );
      }

      // 检查孤立节点
      this.checkDisconnectedNodes(model, result);
   }

   /**
    * 检查孤立节点
    * Check for disconnected nodes
    */
   private static checkDisconnectedNodes(model: WorkflowModelSimple, result: WorkflowValidationResult): void {
      const connectedNodes = new Set<string>();

      // 收集所有连接的节点
      for (const edge of model.edges) {
         if (edge.sourceId) {
            connectedNodes.add(edge.sourceId);
         }
         if (edge.targetId) {
            connectedNodes.add(edge.targetId);
         }
      }

      // 检查孤立节点（排除只有一个节点的情况）
      if (model.nodes.length > 1) {
         for (const node of model.nodes) {
            if (!connectedNodes.has(node.id)) {
               addValidationError(
                  result,
                  createValidationError(
                     WorkflowValidationErrors.WorkflowDisconnectedNodes,
                     `Node "${node.name || node.id}" is not connected to any other node`,
                     `节点 "${node.name || node.id}" 没有连接到任何其他节点`,
                     'warning',
                     {
                        nodeId: node.id,
                        nodeName: node.name,
                        nodeType: node.type,
                        suggestion: 'Connect this node to the workflow or remove it',
                        suggestionZh: '将此节点连接到工作流程或删除它'
                     }
                  )
               );
            }
         }
      }
   }

   /**
    * 验证URL格式
    * Validate URL format
    */
   private static isValidUrl(url: string): boolean {
      try {
         new URL(url);
         return true;
      } catch {
         // 也接受相对路径格式
         return url.startsWith('/') || url.startsWith('./');
      }
   }

   /**
    * 获取节点类型标签
    * Get node type label
    */
   private static getNodeTypeLabel(type: NodeType): string {
      const labels: Record<NodeType, string> = {
         [NodeType.BEGIN]: 'Begin node',
         [NodeType.END]: 'End node',
         [NodeType.EXCEPTION]: 'Exception node',
         [NodeType.PROCESS]: 'Process node',
         [NodeType.DECISION]: 'Decision node',
         [NodeType.DECISION_TABLE]: 'Decision table node',
         [NodeType.SUBPROCESS]: 'Subprocess node',
         [NodeType.CONCURRENT]: 'Concurrent node',
         [NodeType.AUTO]: 'Auto node',
         [NodeType.API]: 'API node'
      };
      return labels[type] || 'Node';
   }

   /**
    * 获取节点类型中文标签
    * Get node type Chinese label
    */
   private static getNodeTypeLabelZh(type: NodeType): string {
      const labels: Record<NodeType, string> = {
         [NodeType.BEGIN]: '开始节点',
         [NodeType.END]: '结束节点',
         [NodeType.EXCEPTION]: '异常节点',
         [NodeType.PROCESS]: '过程节点',
         [NodeType.DECISION]: '分支节点',
         [NodeType.DECISION_TABLE]: '决策表节点',
         [NodeType.SUBPROCESS]: '子流程节点',
         [NodeType.CONCURRENT]: '并发节点',
         [NodeType.AUTO]: 'Auto节点',
         [NodeType.API]: 'API节点'
      };
      return labels[type] || '节点';
   }
}
