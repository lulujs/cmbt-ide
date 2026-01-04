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

      // 从标签ID中提取元素ID（格式: elementId_label）
      const elementId = labelId.replace(/_label$/, '');

      let currentText = this.modelState.semanticText();
      let hasChanges = false;

      // 尝试更新节点名称
      const node = this.modelState.index.findWorkflowNode(elementId);
      if (node) {
         currentText = this.updateNodeName(currentText, node.id!, newText);
         hasChanges = true;
      }

      // 尝试更新泳道名称
      const swimlane = this.modelState.index.findSwimlane(elementId);
      if (swimlane) {
         currentText = this.updateSwimlaneName(currentText, swimlane.id!, newText);
         hasChanges = true;
      }

      if (hasChanges) {
         this.modelState.updateSourceModel({ text: currentText });
      }
   }

   /**
    * 更新节点名称
    * Update node name
    */
   private updateNodeName(text: string, nodeId: string, newName: string): string {
      // 查找节点的name属性并更新
      const namePattern = new RegExp(`(${this.escapeRegExp(nodeId)}\\s*\\{[\\s\\S]*?name\\s*:\\s*)"[^"]*"`, 'g');
      return text.replace(namePattern, `$1"${this.escapeQuotes(newName)}"`);
   }

   /**
    * 更新泳道名称
    * Update swimlane name
    */
   private updateSwimlaneName(text: string, swimlaneId: string, newName: string): string {
      // 查找泳道的name属性并更新
      const namePattern = new RegExp(`(${this.escapeRegExp(swimlaneId)}\\s*\\{[\\s\\S]*?name\\s*:\\s*)"[^"]*"`, 'g');
      return text.replace(namePattern, `$1"${this.escapeQuotes(newName)}"`);
   }

   /**
    * 转义正则表达式特殊字符
    * Escape regex special characters
    */
   private escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }

   /**
    * 转义引号
    * Escape quotes
    */
   private escapeQuotes(string: string): string {
      return string.replace(/"/g, '\\"');
   }
}
