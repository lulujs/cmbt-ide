/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowValidationErrors } from '@crossmodel/protocol';
import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
   ApiNode,
   AutoNode,
   BeginNode,
   ConcurrentNode,
   CrossModelAstType,
   DecisionNode,
   DecisionTableNode,
   EndNode,
   ExceptionNode,
   isBeginNode,
   isEndNode,
   isExceptionNode,
   ProcessNode,
   SubprocessNode,
   WorkflowEdge,
   WorkflowModel,
   WorkflowNode
} from '../generated/ast.js';

/**
 * 工作流程验证器
 * Workflow validator for semantic validation
 * 提供全面的错误处理和用户友好的错误信息
 */
export class WorkflowValidator {
   /**
    * 注册验证检查
    * Register validation checks
    */
   registerChecks(checks: ValidationChecks<CrossModelAstType>): void {
      // 工作流程模型验证
      checks.WorkflowModel = [
         this.checkWorkflowHasName,
         this.checkWorkflowHasNodes,
         this.checkWorkflowHasBeginNode,
         this.checkWorkflowHasEndNode,
         this.checkWorkflowNoDisconnectedNodes
      ];

      // 节点验证
      checks.BeginNode = [this.checkBeginNodeNoExpectedValue];
      checks.EndNode = [this.checkEndNodeHasExpectedValue];
      checks.ExceptionNode = [this.checkExceptionNodeHasExpectedValue];
      checks.ProcessNode = [this.checkProcessNodeSingleOutgoingEdge];
      checks.DecisionNode = [this.checkDecisionNodeBranchValues, this.checkDecisionNodeMinBranches];
      checks.DecisionTableNode = [this.checkDecisionTableHasColumns, this.checkDecisionTableUniqueDecisionRows];
      checks.SubprocessNode = [this.checkSubprocessNodeReferencePath];
      checks.ConcurrentNode = [this.checkConcurrentNodeNoBeginEnd, this.checkConcurrentNodeHasBranches];
      checks.AutoNode = [this.checkAutoNodeConfig];
      checks.ApiNode = [this.checkApiNodeEndpoint];

      // 边验证
      checks.WorkflowEdge = [this.checkEdgeHasSourceAndTarget, this.checkEdgeNoSelfLoop];
   }

   // ============================================
   // 工作流程模型验证 (Workflow Model Validation)
   // ============================================

   /**
    * 检查工作流程是否有名称
    * Check if workflow has a name
    */
   checkWorkflowHasName(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (!model.name || model.name.trim() === '') {
         accept('warning', '工作流程应该有一个名称 (Workflow should have a name)', {
            node: model,
            property: 'name',
            data: { code: WorkflowValidationErrors.WorkflowMissingName }
         });
      }
   }

   /**
    * 检查工作流程是否有节点
    * Check if workflow has nodes
    */
   checkWorkflowHasNodes(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (!model.nodes || model.nodes.length === 0) {
         accept('warning', '工作流程应该包含至少一个节点 (Workflow should contain at least one node)', {
            node: model,
            property: 'nodes',
            data: { code: WorkflowValidationErrors.WorkflowEmptyNodes }
         });
      }
   }

   /**
    * 检查工作流程是否有开始节点
    * Check if workflow has a begin node
    */
   checkWorkflowHasBeginNode(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (model.nodes && model.nodes.length > 0) {
         const beginNodes = model.nodes.filter(n => isBeginNode(n));
         if (beginNodes.length === 0) {
            accept('warning', '工作流程应该有至少一个开始节点 (Workflow should have at least one begin node)', {
               node: model,
               property: 'nodes',
               data: { code: WorkflowValidationErrors.WorkflowMissingBeginNode }
            });
         } else if (beginNodes.length > 1) {
            accept(
               'warning',
               `工作流程有 ${beginNodes.length} 个开始节点，通常只需要一个 (Workflow has ${beginNodes.length} begin nodes)`,
               {
                  node: model,
                  property: 'nodes',
                  data: { code: WorkflowValidationErrors.WorkflowMultipleBeginNodes }
               }
            );
         }
      }
   }

   /**
    * 检查工作流程是否有结束节点
    * Check if workflow has an end node
    */
   checkWorkflowHasEndNode(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (model.nodes && model.nodes.length > 0) {
         const endNodes = model.nodes.filter(n => isEndNode(n) || isExceptionNode(n));
         if (endNodes.length === 0) {
            accept('warning', '工作流程应该有至少一个结束节点或异常节点 (Workflow should have at least one end or exception node)', {
               node: model,
               property: 'nodes',
               data: { code: WorkflowValidationErrors.WorkflowMissingEndNode }
            });
         }
      }
   }

   /**
    * 检查工作流程是否有孤立节点
    * Check if workflow has disconnected nodes
    */
   checkWorkflowNoDisconnectedNodes(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (model.nodes && model.nodes.length > 1 && model.edges) {
         const connectedNodes = new Set<string>();

         for (const edge of model.edges) {
            const sourceRef = edge.source;
            const targetRef = edge.target;

            if (sourceRef && '$refText' in sourceRef) {
               connectedNodes.add(sourceRef.$refText);
            }
            if (targetRef && '$refText' in targetRef) {
               connectedNodes.add(targetRef.$refText);
            }
         }

         for (const node of model.nodes) {
            if (node.id && !connectedNodes.has(node.id)) {
               accept(
                  'warning',
                  `节点 "${node.name || node.id}" 没有连接到任何其他节点 (Node "${node.name || node.id}" is not connected)`,
                  {
                     node: node,
                     property: 'name',
                     data: { code: WorkflowValidationErrors.WorkflowDisconnectedNodes }
                  }
               );
            }
         }
      }
   }

   // ============================================
   // 节点验证 (Node Validation)
   // ============================================

   /**
    * 检查开始节点不应该有预期值 - 需求 1.1
    * Check that begin node should not have expected value
    */
   checkBeginNodeNoExpectedValue(node: BeginNode, accept: ValidationAcceptor): void {
      // BeginNode 类型在 AST 中不应该有 expectedValue 属性
      // 这个检查主要是为了防止运行时数据错误
      if ('expectedValue' in node && (node as unknown as { expectedValue?: unknown }).expectedValue !== undefined) {
         accept('error', `开始节点 "${node.name}" 不应该有预期值 (Begin node should not have expected value)`, {
            node: node,
            property: 'name',
            data: { code: WorkflowValidationErrors.BeginNodeHasExpectedValue }
         });
      }

      this.checkNodeHasName(node, 'BeginNode', accept);
   }

   /**
    * 检查结束节点必须有预期值 - 需求 1.2
    * Check that end node must have expected value
    */
   checkEndNodeHasExpectedValue(node: EndNode, accept: ValidationAcceptor): void {
      // EndNode 类型应该有 expectedValue 属性
      if (node.expectedValue === undefined || node.expectedValue === null) {
         accept('warning', `结束节点 "${node.name}" 应该有预期值 (End node should have expected value)`, {
            node: node,
            property: 'expectedValue',
            data: { code: WorkflowValidationErrors.EndNodeMissingExpectedValue }
         });
      }

      this.checkNodeHasName(node, 'EndNode', accept);
   }

   /**
    * 检查异常节点必须有预期值 - 需求 1.3
    * Check that exception node must have expected value
    */
   checkExceptionNodeHasExpectedValue(node: ExceptionNode, accept: ValidationAcceptor): void {
      if (node.expectedValue === undefined || node.expectedValue === null) {
         accept('warning', `异常节点 "${node.name}" 应该有预期值 (Exception node should have expected value)`, {
            node: node,
            property: 'expectedValue',
            data: { code: WorkflowValidationErrors.ExceptionNodeMissingExpectedValue }
         });
      }

      this.checkNodeHasName(node, 'ExceptionNode', accept);
   }

   /**
    * 检查过程节点只有一条出边 - 需求 1.4
    * Check that process node has only one outgoing edge
    */
   checkProcessNodeSingleOutgoingEdge(node: ProcessNode, accept: ValidationAcceptor): void {
      const model = node.$container as WorkflowModel;
      if (model && model.edges) {
         const outgoingEdges = model.edges.filter(edge => {
            const sourceRef = edge.source;
            if (sourceRef && '$refText' in sourceRef) {
               return sourceRef.$refText === node.id;
            }
            return false;
         });

         if (outgoingEdges.length > 1) {
            accept(
               'error',
               `过程节点 "${node.name}" 只允许一条出边，当前有 ${outgoingEdges.length} 条 (Process node allows only one outgoing edge)`,
               {
                  node: node,
                  property: 'name',
                  data: { code: WorkflowValidationErrors.ProcessNodeMultipleOutgoingEdges }
               }
            );
         }
      }

      this.checkNodeHasName(node, 'ProcessNode', accept);
   }

   /**
    * 检查分支节点的输出边值唯一性 - 需求 1.6
    * Check that decision node branch values are unique
    */
   checkDecisionNodeBranchValues(node: DecisionNode, accept: ValidationAcceptor): void {
      if (node.branches && node.branches.length > 0) {
         const values = node.branches.map(b => b.value).filter((v): v is string => v !== undefined && v !== '');

         const uniqueValues = new Set(values);
         if (values.length !== uniqueValues.size) {
            accept('error', `分支节点 "${node.name}" 的输出边值必须唯一 (Decision node branch values must be unique)`, {
               node: node,
               property: 'branches',
               data: { code: WorkflowValidationErrors.DecisionNodeDuplicateBranchValues }
            });
         }

         // 检查空分支值
         const emptyBranches = node.branches.filter(b => !b.value || b.value.trim() === '');
         if (emptyBranches.length > 0) {
            accept('warning', `分支节点 "${node.name}" 有 ${emptyBranches.length} 个分支值为空 (Decision node has empty branch values)`, {
               node: node,
               property: 'branches',
               data: { code: WorkflowValidationErrors.DecisionNodeEmptyBranchValue }
            });
         }
      }

      this.checkNodeHasName(node, 'DecisionNode', accept);
   }

   /**
    * 检查分支节点至少有两条分支 - 需求 1.5
    * Check that decision node has at least two branches
    */
   checkDecisionNodeMinBranches(node: DecisionNode, accept: ValidationAcceptor): void {
      if (!node.branches || node.branches.length < 2) {
         accept('warning', `分支节点 "${node.name}" 应该至少有两条分支 (Decision node should have at least two branches)`, {
            node: node,
            property: 'branches',
            data: { code: WorkflowValidationErrors.DecisionNodeInsufficientBranches }
         });
      }
   }

   /**
    * 检查决策表是否有必需的列 - 需求 2.4
    * Check that decision table has required columns
    */
   checkDecisionTableHasColumns(node: DecisionTableNode, accept: ValidationAcceptor): void {
      if (node.tableData) {
         if (!node.tableData.decisionColumns || node.tableData.decisionColumns.length === 0) {
            accept('error', `决策表节点 "${node.name}" 必须包含至少一个决策列 (Decision table must have at least one decision column)`, {
               node: node,
               property: 'tableData',
               data: { code: WorkflowValidationErrors.DecisionTableMissingDecisionColumns }
            });
         }

         if (!node.tableData.outputColumns || node.tableData.outputColumns.length === 0) {
            accept('error', `决策表节点 "${node.name}" 必须包含至少一个输出列 (Decision table must have at least one output column)`, {
               node: node,
               property: 'tableData',
               data: { code: WorkflowValidationErrors.DecisionTableMissingOutputColumns }
            });
         }

         // 检查是否有数据行
         if (!node.tableData.rows || node.tableData.rows.length === 0) {
            accept('warning', `决策表节点 "${node.name}" 没有数据行 (Decision table has no data rows)`, {
               node: node,
               property: 'tableData',
               data: { code: WorkflowValidationErrors.DecisionTableEmptyRows }
            });
         }
      }

      this.checkNodeHasName(node, 'DecisionTableNode', accept);
   }

   /**
    * 检查决策表的决策列内容不能完全相同 - 需求 2.5
    * Check that decision table rows have unique decision values
    */
   checkDecisionTableUniqueDecisionRows(node: DecisionTableNode, accept: ValidationAcceptor): void {
      if (node.tableData && node.tableData.rows && node.tableData.rows.length > 1) {
         const decisionColumnIds = node.tableData.decisionColumns?.map(c => c.id) ?? [];

         if (decisionColumnIds.length > 0) {
            const decisionValues: string[] = [];

            for (const row of node.tableData.rows) {
               if (row.values) {
                  const rowDecisionValues = row.values
                     .filter(v => v.columnId && decisionColumnIds.includes(v.columnId))
                     .map(v => `${v.columnId}:${v.cellValue ?? ''}`)
                     .sort()
                     .join('|');
                  decisionValues.push(rowDecisionValues);
               }
            }

            const uniqueDecisionValues = new Set(decisionValues);
            if (decisionValues.length !== uniqueDecisionValues.size) {
               accept(
                  'error',
                  `决策表节点 "${node.name}" 的决策列内容不能完全相同 (Decision table rows must have unique decision values)`,
                  {
                     node: node,
                     property: 'tableData',
                     data: { code: WorkflowValidationErrors.DecisionTableDuplicateDecisionRows }
                  }
               );
            }
         }
      }
   }

   /**
    * 检查子流程节点的引用路径 - 需求 1.8
    * Check subprocess node reference path
    */
   checkSubprocessNodeReferencePath(node: SubprocessNode, accept: ValidationAcceptor): void {
      if (!node.referencePath || node.referencePath.trim() === '') {
         accept('warning', `子流程节点 "${node.name}" 没有引用路径 (Subprocess node has no reference path)`, {
            node: node,
            property: 'referencePath',
            data: { code: WorkflowValidationErrors.SubprocessNodeMissingReferencePath }
         });
      }

      this.checkNodeHasName(node, 'SubprocessNode', accept);
   }

   /**
    * 检查并发节点不包含开始或结束节点 - 需求 6.3
    * Check that concurrent node does not contain begin or end nodes
    */
   checkConcurrentNodeNoBeginEnd(node: ConcurrentNode, accept: ValidationAcceptor): void {
      if (node.parallelBranches) {
         for (const branch of node.parallelBranches) {
            if (branch.nodeRefs) {
               for (const nodeRef of branch.nodeRefs) {
                  const referencedNode = nodeRef.node?.ref;
                  if (referencedNode) {
                     if (isBeginNode(referencedNode)) {
                        accept('error', `并发流程 "${node.name}" 不能包含开始节点 (Concurrent process cannot contain begin node)`, {
                           node: node,
                           property: 'parallelBranches',
                           data: { code: WorkflowValidationErrors.ConcurrentNodeContainsBeginNode }
                        });
                     }
                     if (isEndNode(referencedNode)) {
                        accept('error', `并发流程 "${node.name}" 不能包含结束节点 (Concurrent process cannot contain end node)`, {
                           node: node,
                           property: 'parallelBranches',
                           data: { code: WorkflowValidationErrors.ConcurrentNodeContainsEndNode }
                        });
                     }
                     if (isExceptionNode(referencedNode)) {
                        accept('error', `并发流程 "${node.name}" 不能包含异常节点 (Concurrent process cannot contain exception node)`, {
                           node: node,
                           property: 'parallelBranches',
                           data: { code: WorkflowValidationErrors.ConcurrentNodeContainsExceptionNode }
                        });
                     }
                  }
               }
            }
         }
      }

      this.checkNodeHasName(node, 'ConcurrentNode', accept);
   }

   /**
    * 检查并发节点是否有并行分支 - 需求 6.1
    * Check that concurrent node has parallel branches
    */
   checkConcurrentNodeHasBranches(node: ConcurrentNode, accept: ValidationAcceptor): void {
      if (!node.parallelBranches || node.parallelBranches.length === 0) {
         accept('warning', `并发节点 "${node.name}" 没有并行分支 (Concurrent node has no parallel branches)`, {
            node: node,
            property: 'parallelBranches',
            data: { code: WorkflowValidationErrors.ConcurrentNodeEmptyBranches }
         });
      }
   }

   /**
    * 检查Auto节点配置 - 需求 1.10
    * Check auto node configuration
    */
   checkAutoNodeConfig(node: AutoNode, accept: ValidationAcceptor): void {
      if (!node.automationConfig || Object.keys(node.automationConfig).length === 0) {
         accept('warning', `Auto节点 "${node.name}" 没有自动化配置 (Auto node has no automation configuration)`, {
            node: node,
            property: 'automationConfig',
            data: { code: WorkflowValidationErrors.AutoNodeMissingConfig }
         });
      }

      this.checkNodeHasName(node, 'AutoNode', accept);
   }

   /**
    * 检查API节点端点 - 需求 1.11
    * Check API node endpoint
    */
   checkApiNodeEndpoint(node: ApiNode, accept: ValidationAcceptor): void {
      if (!node.apiEndpoint || node.apiEndpoint.trim() === '') {
         accept('warning', `API节点 "${node.name}" 没有配置端点 (API node has no endpoint configured)`, {
            node: node,
            property: 'apiEndpoint',
            data: { code: WorkflowValidationErrors.ApiNodeMissingEndpoint }
         });
      } else if (!this.isValidUrl(node.apiEndpoint)) {
         accept('error', `API节点 "${node.name}" 的端点URL无效 (API node has invalid endpoint URL)`, {
            node: node,
            property: 'apiEndpoint',
            data: { code: WorkflowValidationErrors.ApiNodeInvalidEndpoint }
         });
      }

      this.checkNodeHasName(node, 'ApiNode', accept);
   }

   // ============================================
   // 边验证 (Edge Validation)
   // ============================================

   /**
    * 检查边是否有源和目标节点
    * Check that edge has source and target nodes
    */
   checkEdgeHasSourceAndTarget(edge: WorkflowEdge, accept: ValidationAcceptor): void {
      if (!edge.source || !('$refText' in edge.source) || !edge.source.$refText) {
         accept('error', `边 "${edge.id}" 缺少源节点 (Edge is missing source node)`, {
            node: edge,
            property: 'source',
            data: { code: WorkflowValidationErrors.EdgeMissingSource }
         });
      }

      if (!edge.target || !('$refText' in edge.target) || !edge.target.$refText) {
         accept('error', `边 "${edge.id}" 缺少目标节点 (Edge is missing target node)`, {
            node: edge,
            property: 'target',
            data: { code: WorkflowValidationErrors.EdgeMissingTarget }
         });
      }
   }

   /**
    * 检查边是否形成自环
    * Check that edge does not form a self-loop
    */
   checkEdgeNoSelfLoop(edge: WorkflowEdge, accept: ValidationAcceptor): void {
      const sourceRef = edge.source;
      const targetRef = edge.target;

      if (sourceRef && targetRef && '$refText' in sourceRef && '$refText' in targetRef) {
         if (sourceRef.$refText === targetRef.$refText) {
            accept('warning', `边 "${edge.id}" 在节点上创建了自环 (Edge creates a self-loop)`, {
               node: edge,
               property: 'target',
               data: { code: WorkflowValidationErrors.EdgeSelfLoop }
            });
         }
      }
   }

   // ============================================
   // 辅助方法 (Helper Methods)
   // ============================================

   /**
    * 检查节点是否有名称
    * Check if node has a name
    */
   private checkNodeHasName(node: WorkflowNode, nodeType: string, accept: ValidationAcceptor): void {
      if (!node.name || node.name.trim() === '') {
         const nodeTypeLabels: Record<string, { en: string; zh: string }> = {
            BeginNode: { en: 'Begin node', zh: '开始节点' },
            EndNode: { en: 'End node', zh: '结束节点' },
            ExceptionNode: { en: 'Exception node', zh: '异常节点' },
            ProcessNode: { en: 'Process node', zh: '过程节点' },
            DecisionNode: { en: 'Decision node', zh: '分支节点' },
            DecisionTableNode: { en: 'Decision table node', zh: '决策表节点' },
            SubprocessNode: { en: 'Subprocess node', zh: '子流程节点' },
            ConcurrentNode: { en: 'Concurrent node', zh: '并发节点' },
            AutoNode: { en: 'Auto node', zh: 'Auto节点' },
            ApiNode: { en: 'API node', zh: 'API节点' }
         };

         const labels = nodeTypeLabels[nodeType] || { en: 'Node', zh: '节点' };
         accept('warning', `${labels.zh}应该有一个名称 (${labels.en} should have a name)`, {
            node: node,
            property: 'name',
            data: { code: `workflow.${nodeType.toLowerCase().replace('node', '-node')}.missing-name` }
         });
      }
   }

   /**
    * 验证URL格式
    * Validate URL format
    */
   private isValidUrl(url: string): boolean {
      try {
         new URL(url);
         return true;
      } catch {
         // 也接受相对路径格式
         return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
      }
   }
}

/**
 * 注册工作流程验证检查
 * Register workflow validation checks
 */
export function registerWorkflowValidationChecks(checks: ValidationChecks<CrossModelAstType>, validator: WorkflowValidator): void {
   validator.registerChecks(checks);
}
