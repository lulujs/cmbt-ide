/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { SWIMLANE_NODE_TYPE } from '@crossmodel/protocol';
import { Command, CreateNodeOperation, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 泳道创建操作处理器
 * Swimlane creation operation handler
 * 需求 3.1: 创建一个可容纳节点的泳道容器
 */
@injectable()
export class WorkflowDiagramCreateSwimlaneOperationHandler extends JsonOperationHandler {
   override operationType = CreateNodeOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      if (operation.elementTypeId !== SWIMLANE_NODE_TYPE) {
         return undefined;
      }

      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.createSwimlane(operation));
   }

   protected createSwimlane(operation: CreateNodeOperation): void {
      const swimlaneId = this.generateSwimlaneId();
      const position = operation.location || { x: 50, y: 50 };
      const swimlaneText = this.generateSwimlaneDSL(swimlaneId, position);

      // 更新语义模型
      const currentText = this.modelState.semanticText();
      const updatedText = this.insertSwimlaneIntoModel(currentText, swimlaneText);

      this.modelState.updateSourceModel({ text: updatedText });
   }

   /**
    * 生成泳道ID
    * Generate swimlane ID
    */
   private generateSwimlaneId(): string {
      const timestamp = Date.now();
      return `swimlane_${timestamp}`;
   }

   /**
    * 生成泳道DSL文本
    * Generate swimlane DSL text
    */
   private generateSwimlaneDSL(swimlaneId: string, position: { x: number; y: number }): string {
      let dsl = `    swimlane ${swimlaneId} {\n`;
      dsl += `        name: "泳道"\n`;
      dsl += `        position: { x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }\n`;
      dsl += `        width: 400\n`;
      dsl += `        height: 300\n`;
      dsl += `        orientation: "horizontal"\n`;
      dsl += `        nodes: []\n`;
      dsl += `    }\n`;
      return dsl;
   }

   /**
    * 将泳道插入到模型中
    * Insert swimlane into model
    */
   private insertSwimlaneIntoModel(currentText: string, swimlaneText: string): string {
      // 查找swimlanes块的结束位置
      const swimlanesEndPattern = /(\s*swimlanes\s*\{[\s\S]*?)(\s*\}\s*\})/;
      const match = currentText.match(swimlanesEndPattern);

      if (match) {
         const insertPosition = match.index! + match[1].length;
         return currentText.slice(0, insertPosition) + '\n' + swimlaneText + currentText.slice(insertPosition);
      }

      // 如果没有找到swimlanes块，在edges块后添加
      const edgesEndPattern = /(\s*edges\s*\{[\s\S]*?\}\s*)/;
      const edgesMatch = currentText.match(edgesEndPattern);

      if (edgesMatch) {
         const insertPosition = edgesMatch.index! + edgesMatch[1].length;
         const swimlanesBlock = `\n    swimlanes {\n${swimlaneText}    }\n`;
         return currentText.slice(0, insertPosition) + swimlanesBlock + currentText.slice(insertPosition);
      }

      return currentText;
   }
}
