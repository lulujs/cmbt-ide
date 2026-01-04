/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { EdgeCreationChecker, GModelElement, GNode, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { isProcessNode } from '../../../language-server/generated/ast.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

// Define local constants until protocol is rebuilt
const WORKFLOW_BEGIN_NODE = 'node:workflow-begin';
const WORKFLOW_END_NODE = 'node:workflow-end';
const WORKFLOW_EXCEPTION_NODE = 'node:workflow-exception';
const WORKFLOW_PROCESS_NODE = 'node:workflow-process';

/**
 * 工作流程边创建检查器 - 验证边的创建是否合法
 * Workflow edge creation checker - validates if edge creation is legal
 * 需求 1.4: 过程节点只允许一条出边
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowEdgeCreationChecker implements EdgeCreationChecker {
   @inject(ModelState) protected modelState!: WorkflowModelState;

   /**
    * 检查是否可以从源元素创建边
    * Check if edge can be created from source element
    */
   isValidSource(edgeType: string, source: GModelElement): boolean {
      if (!(source instanceof GNode)) {
         return false;
      }

      const nodeType = source.type;

      // 结束节点和异常节点不能作为源
      if (nodeType === WORKFLOW_END_NODE || nodeType === WORKFLOW_EXCEPTION_NODE) {
         return false;
      }

      // 检查过程节点的出边限制
      if (nodeType === WORKFLOW_PROCESS_NODE) {
         return this.checkProcessNodeOutgoingEdges(source.id);
      }

      return true;
   }

   /**
    * 检查是否可以创建从源到目标的边
    * Check if edge can be created from source to target
    */
   isValidTarget(edgeType: string, source: GModelElement, target: GModelElement): boolean {
      if (!(source instanceof GNode) || !(target instanceof GNode)) {
         return false;
      }

      // 不能连接到自己
      if (source.id === target.id) {
         return false;
      }

      const targetType = target.type;

      // 开始节点不能作为目标
      if (targetType === WORKFLOW_BEGIN_NODE) {
         return false;
      }

      return true;
   }

   /**
    * 检查过程节点的出边数量
    * Check process node outgoing edge count
    * 需求 1.4: 过程节点只允许一条出边
    */
   private checkProcessNodeOutgoingEdges(nodeId: string): boolean {
      const workflowModel = (this.modelState as WorkflowModelState).workflowModel;
      if (!workflowModel) {
         return true;
      }

      const node = (this.modelState as WorkflowModelState).index.findWorkflowNode(nodeId);
      if (!node || !isProcessNode(node)) {
         return true;
      }

      // 计算当前出边数量
      const outgoingEdgeCount = workflowModel.edges.filter(edge => edge.source?.ref?.id === nodeId).length;

      // 过程节点只允许一条出边
      return outgoingEdgeCount < 1;
   }
}
