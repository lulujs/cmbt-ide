/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
   ConcurrentNode,
   CrossModelAstType,
   DecisionNode,
   DecisionTableNode,
   isBeginNode,
   isEndNode,
   ProcessNode,
   WorkflowModel
} from '../generated/ast.js';

/**
 * 工作流程验证器
 * Workflow validator for semantic validation
 */
export class WorkflowValidator {
   /**
    * 注册验证检查
    * Register validation checks
    */
   registerChecks(checks: ValidationChecks<CrossModelAstType>): void {
      checks.WorkflowModel = [this.checkWorkflowHasName, this.checkWorkflowHasNodes];
      checks.ProcessNode = [this.checkProcessNodeSingleOutgoingEdge];
      checks.DecisionNode = [this.checkDecisionNodeBranchValues];
      checks.DecisionTableNode = [this.checkDecisionTableHasColumns, this.checkDecisionTableUniqueDecisionRows];
      checks.ConcurrentNode = [this.checkConcurrentNodeNoBeginEnd];
   }

   /**
    * 检查工作流程是否有名称
    * Check if workflow has a name
    */
   checkWorkflowHasName(model: WorkflowModel, accept: ValidationAcceptor): void {
      if (!model.name || model.name.trim() === '') {
         accept('warning', '工作流程应该有一个名称 (Workflow should have a name)', {
            node: model,
            property: 'name'
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
            property: 'nodes'
         });
      }
   }

   /**
    * 检查过程节点只有一条出边
    * Check that process node has only one outgoing edge
    * 需求 1.4: 过程节点只允许一条出边
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
                  property: 'name'
               }
            );
         }
      }
   }

   /**
    * 检查分支节点的输出边值唯一性
    * Check that decision node branch values are unique
    * 需求 1.6: 分支节点的所有输出边的值不相同
    */
   checkDecisionNodeBranchValues(node: DecisionNode, accept: ValidationAcceptor): void {
      if (node.branches && node.branches.length > 0) {
         const values = node.branches.map(b => b.value).filter((v): v is string => v !== undefined && v !== '');

         const uniqueValues = new Set(values);
         if (values.length !== uniqueValues.size) {
            accept('error', `分支节点 "${node.name}" 的输出边值必须唯一 (Decision node branch values must be unique)`, {
               node: node,
               property: 'branches'
            });
         }
      }
   }

   /**
    * 检查决策表是否有必需的列
    * Check that decision table has required columns
    * 需求 2.4: 决策表缺少决策内容列时阻止保存
    */
   checkDecisionTableHasColumns(node: DecisionTableNode, accept: ValidationAcceptor): void {
      if (node.tableData) {
         if (!node.tableData.decisionColumns || node.tableData.decisionColumns.length === 0) {
            accept('error', `决策表节点 "${node.name}" 必须包含至少一个决策列 (Decision table must have at least one decision column)`, {
               node: node,
               property: 'tableData'
            });
         }

         if (!node.tableData.outputColumns || node.tableData.outputColumns.length === 0) {
            accept('error', `决策表节点 "${node.name}" 必须包含至少一个输出列 (Decision table must have at least one output column)`, {
               node: node,
               property: 'tableData'
            });
         }
      }
   }

   /**
    * 检查决策表的决策列内容不能完全相同
    * Check that decision table rows have unique decision values
    * 需求 2.5: 决策表的决策列内容完全相同时阻止保存
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
                     property: 'tableData'
                  }
               );
            }
         }
      }
   }

   /**
    * 检查并发节点不包含开始或结束节点
    * Check that concurrent node does not contain begin or end nodes
    * 需求 6.3: 并发流程包含开始或结束节点时阻止保存
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
                           property: 'parallelBranches'
                        });
                     }
                     if (isEndNode(referencedNode)) {
                        accept('error', `并发流程 "${node.name}" 不能包含结束节点 (Concurrent process cannot contain end node)`, {
                           node: node,
                           property: 'parallelBranches'
                        });
                     }
                  }
               }
            }
         }
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
