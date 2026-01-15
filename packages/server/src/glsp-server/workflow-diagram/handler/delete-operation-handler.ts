/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, MaybePromise, remove } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Swimlane, WorkflowEdge, WorkflowNode } from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程图删除操作处理器
 * Workflow diagram delete operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramDeleteOperationHandler extends JsonOperationHandler {
   override operationType = DeleteElementOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: DeleteElementOperation): MaybePromise<Command | undefined> {
      const deleteInfo = this.findElementsToDelete(operation);

      if (deleteInfo.nodes.length === 0 && deleteInfo.edges.length === 0 && deleteInfo.swimlanes.length === 0) {
         return undefined;
      }
      return new CrossModelCommand(this.modelState, () => this.deleteElements(deleteInfo));
   }

   protected deleteElements(deleteInfo: DeleteInfo): void {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return;
      }

      // 删除节点
      if (deleteInfo.nodes.length > 0) {
         remove(workflowModel.nodes, ...deleteInfo.nodes);
      }

      // 删除边
      if (deleteInfo.edges.length > 0) {
         remove(workflowModel.edges, ...deleteInfo.edges);
      }

      // 删除泳道
      if (deleteInfo.swimlanes.length > 0) {
         remove(workflowModel.swimlanes, ...deleteInfo.swimlanes);
      }
   }

   protected findElementsToDelete(operation: DeleteElementOperation): DeleteInfo {
      const deleteInfo: DeleteInfo = { edges: [], nodes: [], swimlanes: [] };
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return deleteInfo;
      }

      for (const elementId of operation.elementIds) {
         // 尝试删除节点
         const node = this.modelState.index.findWorkflowNode(elementId);
         if (node) {
            deleteInfo.nodes.push(node);
            // 同时删除相关的边
            deleteInfo.edges.push(...workflowModel.edges.filter(edge => this.isRelatedEdge(edge, node)));
            continue;
         }

         // 尝试删除边
         const edge = this.modelState.index.findWorkflowEdge(elementId);
         if (edge) {
            deleteInfo.edges.push(edge);
            continue;
         }

         // 尝试删除泳道
         const swimlane = this.modelState.index.findSwimlane(elementId);
         if (swimlane) {
            deleteInfo.swimlanes.push(swimlane);
         }
      }

      return deleteInfo;
   }

   /**
    * 检查边是否与节点相关
    * Check if edge is related to node
    */
   private isRelatedEdge(edge: WorkflowEdge, node: WorkflowNode): boolean {
      return edge.source?.ref === node || edge.target?.ref === node;
   }
}

interface DeleteInfo {
   nodes: WorkflowNode[];
   edges: WorkflowEdge[];
   swimlanes: Swimlane[];
}
