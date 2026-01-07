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
      console.log(`[DEBUG] ChangeBounds operation with ${operation.newBounds.length} elements`);

      let hasChanges = false;

      for (const elementAndBounds of operation.newBounds) {
         const elementId = elementAndBounds.elementId;
         const newPosition = elementAndBounds.newPosition;
         const newSize = elementAndBounds.newSize;

         console.log(`[DEBUG] Processing element: ${elementId}, position: ${newPosition?.x}, ${newPosition?.y}`);

         // 查找节点或泳道
         const node = this.modelState.index.findWorkflowNode(elementId);
         const swimlane = this.modelState.index.findSwimlane(elementId);

         if (node && newPosition) {
            console.log(`[DEBUG] Found node: ${node.id}, updating position to (${newPosition.x}, ${newPosition.y})`);
            
            // 直接修改AST节点的位置属性
            if (!node.position) {
               (node as any).position = { x: 0, y: 0 };
            }
            (node.position as any).x = Math.round(newPosition.x);
            (node.position as any).y = Math.round(newPosition.y);
            hasChanges = true;
            
            console.log(`[DEBUG] Node position updated in AST: (${node.position!.x}, ${node.position!.y})`);
         } else if (swimlane && newPosition) {
            console.log(`[DEBUG] Found swimlane: ${swimlane.id}, updating position and size`);
            
            // 直接修改AST泳道的位置和大小属性
            if (!swimlane.position) {
               (swimlane as any).position = { x: 0, y: 0 };
            }
            (swimlane.position as any).x = Math.round(newPosition.x);
            (swimlane.position as any).y = Math.round(newPosition.y);
            
            if (newSize) {
               (swimlane as any).width = Math.round(newSize.width);
               (swimlane as any).height = Math.round(newSize.height);
            }
            hasChanges = true;
            
            console.log(`[DEBUG] Swimlane updated in AST: position (${swimlane.position!.x}, ${swimlane.position!.y}), size (${swimlane.width}, ${swimlane.height})`);
         } else {
            console.log(`[DEBUG] Element not found: ${elementId}`);
         }
      }

      if (hasChanges) {
         console.log(`[DEBUG] Updating source model with modified AST`);
         // 使用修改后的AST重新序列化
         const updatedText = this.modelState.semanticText();
         this.modelState.updateSourceModel({ text: updatedText });
      } else {
         console.log(`[DEBUG] No changes made - source model not updated`);
      }
   }

}