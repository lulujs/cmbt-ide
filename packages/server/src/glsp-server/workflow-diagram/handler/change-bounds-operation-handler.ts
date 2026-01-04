/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ChangeBoundsOperation, Command, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程图边界变更操作处理器
 * Workflow diagram change bounds operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramChangeBoundsOperationHandler extends JsonOperationHandler {
   override operationType = ChangeBoundsOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: ChangeBoundsOperation): MaybePromise<Command | undefined> {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.changeBounds(operation));
   }

   protected changeBounds(operation: ChangeBoundsOperation): void {
      let currentText = this.modelState.semanticText();
      let hasChanges = false;

      for (const elementAndBounds of operation.newBounds) {
         const elementId = elementAndBounds.elementId;
         const newPosition = elementAndBounds.newPosition;
         const newSize = elementAndBounds.newSize;

         // 查找节点或泳道
         const node = this.modelState.index.findWorkflowNode(elementId);
         const swimlane = this.modelState.index.findSwimlane(elementId);

         if (node && newPosition) {
            currentText = this.updateNodePosition(currentText, node.id!, newPosition.x, newPosition.y);
            hasChanges = true;
         } else if (swimlane && newPosition) {
            currentText = this.updateSwimlanePosition(
               currentText,
               swimlane.id!,
               newPosition.x,
               newPosition.y,
               newSize.width,
               newSize.height
            );
            hasChanges = true;
         }
      }

      if (hasChanges) {
         this.modelState.updateSourceModel({ text: currentText });
      }
   }

   /**
    * 更新节点位置
    * Update node position
    */
   private updateNodePosition(text: string, nodeId: string, x: number, y: number): string {
      // 查找节点的position属性并更新
      const positionPattern = new RegExp(
         `(${this.escapeRegExp(nodeId)}\\s*\\{[\\s\\S]*?position\\s*:\\s*\\{\\s*x\\s*:\\s*)\\d+(\\.\\d+)?(\\s*,\\s*y\\s*:\\s*)\\d+(\\.\\d+)?(\\s*\\})`,
         'g'
      );

      return text.replace(positionPattern, `$1${Math.round(x)}$3${Math.round(y)}$5`);
   }

   /**
    * 更新泳道位置和大小
    * Update swimlane position and size
    */
   private updateSwimlanePosition(text: string, swimlaneId: string, x: number, y: number, width: number, height: number): string {
      let result = text;

      // 更新位置
      const positionPattern = new RegExp(
         `(${this.escapeRegExp(swimlaneId)}\\s*\\{[\\s\\S]*?position\\s*:\\s*\\{\\s*x\\s*:\\s*)\\d+(\\.\\d+)?(\\s*,\\s*y\\s*:\\s*)\\d+(\\.\\d+)?(\\s*\\})`,
         'g'
      );
      result = result.replace(positionPattern, `$1${Math.round(x)}$3${Math.round(y)}$5`);

      // 更新宽度
      const widthPattern = new RegExp(`(${this.escapeRegExp(swimlaneId)}\\s*\\{[\\s\\S]*?width\\s*:\\s*)\\d+(\\.\\d+)?`, 'g');
      result = result.replace(widthPattern, `$1${Math.round(width)}`);

      // 更新高度
      const heightPattern = new RegExp(`(${this.escapeRegExp(swimlaneId)}\\s*\\{[\\s\\S]*?height\\s*:\\s*)\\d+(\\.\\d+)?`, 'g');
      result = result.replace(heightPattern, `$1${Math.round(height)}`);

      return result;
   }

   /**
    * 转义正则表达式特殊字符
    * Escape regex special characters
    */
   private escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   }
}
