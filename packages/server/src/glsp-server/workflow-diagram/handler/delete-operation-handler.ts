/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
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
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.deleteElements(operation));
   }

   protected deleteElements(operation: DeleteElementOperation): void {
      let currentText = this.modelState.semanticText();
      let hasChanges = false;

      for (const elementId of operation.elementIds) {
         // 尝试删除节点
         const node = this.modelState.index.findWorkflowNode(elementId);
         if (node) {
            currentText = this.deleteNode(currentText, node.id!);
            // 同时删除相关的边
            currentText = this.deleteRelatedEdges(currentText, node.id!);
            hasChanges = true;
            continue;
         }

         // 尝试删除边
         const edge = this.modelState.index.findWorkflowEdge(elementId);
         if (edge) {
            currentText = this.deleteEdge(currentText, edge.id!);
            hasChanges = true;
            continue;
         }

         // 尝试删除泳道
         const swimlane = this.modelState.index.findSwimlane(elementId);
         if (swimlane) {
            currentText = this.deleteSwimlane(currentText, swimlane.id!);
            hasChanges = true;
         }
      }

      if (hasChanges) {
         this.modelState.updateSourceModel({ text: currentText });
      }
   }

   /**
    * 删除节点
    * Delete node
    */
   private deleteNode(text: string, nodeId: string): string {
      // 匹配节点定义块
      const nodePattern = new RegExp(`\\s*\\w+\\s+${this.escapeRegExp(nodeId)}\\s*\\{[\\s\\S]*?\\}\\s*`, 'g');
      return text.replace(nodePattern, '\n');
   }

   /**
    * 删除边
    * Delete edge
    */
   private deleteEdge(text: string, edgeId: string): string {
      // 匹配边定义块
      const edgePattern = new RegExp(`\\s*edge\\s+${this.escapeRegExp(edgeId)}\\s*\\{[\\s\\S]*?\\}\\s*`, 'g');
      return text.replace(edgePattern, '\n');
   }

   /**
    * 删除泳道
    * Delete swimlane
    */
   private deleteSwimlane(text: string, swimlaneId: string): string {
      // 匹配泳道定义块
      const swimlanePattern = new RegExp(`\\s*swimlane\\s+${this.escapeRegExp(swimlaneId)}\\s*\\{[\\s\\S]*?\\}\\s*`, 'g');
      return text.replace(swimlanePattern, '\n');
   }

   /**
    * 删除与节点相关的边
    * Delete edges related to node
    */
   private deleteRelatedEdges(text: string, nodeId: string): string {
      // 匹配包含该节点作为source或target的边
      const edgePattern = new RegExp(
         `\\s*edge\\s+\\w+\\s*\\{[\\s\\S]*?(?:source|target)\\s*:\\s*${this.escapeRegExp(nodeId)}[\\s\\S]*?\\}\\s*`,
         'g'
      );
      return text.replace(edgePattern, '\n');
   }

   /**
    * 转义正则表达式特殊字符
    * Escape regex special characters
    */
   private escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }
}
