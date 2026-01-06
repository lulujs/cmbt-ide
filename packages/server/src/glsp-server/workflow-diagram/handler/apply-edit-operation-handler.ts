/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ApplyLabelEditOperation, Command, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程图标签编辑操作处理器
 * Workflow diagram label edit operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramApplyLabelEditOperationHandler extends JsonOperationHandler {
   override operationType = ApplyLabelEditOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.applyLabelEdit(operation));
   }

   protected applyLabelEdit(operation: ApplyLabelEditOperation): void {
      const labelId = operation.labelId;
      const newText = operation.text;

      console.log(`[DEBUG] Applying label edit: labelId=${labelId}, newText=${newText}`);

      // 从标签ID中提取元素ID（格式: elementId_label）
      const elementId = labelId.replace(/_label$/, '');
      console.log(`[DEBUG] Extracted elementId: ${elementId}`);

      let hasChanges = false;

      // 尝试更新节点名称 - 直接修改AST节点
      const node = this.modelState.index.findWorkflowNode(elementId);
      if (node) {
         console.log(`[DEBUG] Found node: ${node.id}, current name: ${node.name}`);
         if (node.name !== newText) {
            // 直接修改AST节点的名称属性
            (node as any).name = newText;
            hasChanges = true;
            console.log(`[DEBUG] Node name updated in AST: ${node.name}`);
         }
      } else {
         console.log(`[DEBUG] Node not found for elementId: ${elementId}`);
      }

      // 尝试更新泳道名称 - 直接修改AST节点
      const swimlane = this.modelState.index.findSwimlane(elementId);
      if (swimlane) {
         console.log(`[DEBUG] Found swimlane: ${swimlane.id}, current name: ${swimlane.name}`);
         if (swimlane.name !== newText) {
            // 直接修改AST节点的名称属性
            (swimlane as any).name = newText;
            hasChanges = true;
            console.log(`[DEBUG] Swimlane name updated in AST: ${swimlane.name}`);
         }
      }

      if (hasChanges) {
         console.log(`[DEBUG] Updating source model with modified AST`);
         // 使用修改后的AST重新序列化
         const updatedText = this.modelState.semanticText();
         console.log(`[DEBUG] Updated text preview:`, updatedText.substring(0, 200) + '...');
         this.modelState.updateSourceModel({ text: updatedText });
         console.log(`[DEBUG] Source model updated`);
      } else {
         console.log(`[DEBUG] No changes made - source model not updated`);
      }
   }

}