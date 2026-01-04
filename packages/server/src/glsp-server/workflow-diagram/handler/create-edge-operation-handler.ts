/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { WORKFLOW_EDGE_TYPE } from '@crossmodel/protocol';
import { Command, CreateEdgeOperation, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程边创建操作处理器
 * Workflow edge creation operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramCreateEdgeOperationHandler extends JsonOperationHandler {
   override operationType = CreateEdgeOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
      if (operation.elementTypeId !== WORKFLOW_EDGE_TYPE) {
         return undefined;
      }

      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      const sourceNode = this.modelState.index.findWorkflowNode(operation.sourceElementId);
      const targetNode = this.modelState.index.findWorkflowNode(operation.targetElementId);

      if (!sourceNode || !targetNode) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.createEdge(sourceNode.id!, targetNode.id!));
   }

   protected createEdge(sourceId: string, targetId: string): void {
      const edgeId = this.generateEdgeId();
      const edgeText = this.generateEdgeDSL(edgeId, sourceId, targetId);

      // 更新语义模型
      const currentText = this.modelState.semanticText();
      const updatedText = this.insertEdgeIntoModel(currentText, edgeText);

      this.modelState.updateSourceModel({ text: updatedText });
   }

   /**
    * 生成边ID
    * Generate edge ID
    */
   private generateEdgeId(): string {
      const timestamp = Date.now();
      return `edge_${timestamp}`;
   }

   /**
    * 生成边DSL文本
    * Generate edge DSL text
    */
   private generateEdgeDSL(edgeId: string, sourceId: string, targetId: string): string {
      let dsl = `    edge ${edgeId} {\n`;
      dsl += `        source: ${sourceId}\n`;
      dsl += `        target: ${targetId}\n`;
      dsl += `    }\n`;
      return dsl;
   }

   /**
    * 将边插入到模型中
    * Insert edge into model
    */
   private insertEdgeIntoModel(currentText: string, edgeText: string): string {
      // 查找edges块的结束位置
      const edgesEndPattern = /(\s*edges\s*\{[\s\S]*?)(\s*\}\s*(?:swimlanes|\}))/;
      const match = currentText.match(edgesEndPattern);

      if (match) {
         const insertPosition = match.index! + match[1].length;
         return currentText.slice(0, insertPosition) + '\n' + edgeText + currentText.slice(insertPosition);
      }

      // 如果没有找到edges块，在nodes块后添加
      const nodesEndPattern = /(\s*nodes\s*\{[\s\S]*?\}\s*)/;
      const nodesMatch = currentText.match(nodesEndPattern);

      if (nodesMatch) {
         const insertPosition = nodesMatch.index! + nodesMatch[1].length;
         const edgesBlock = `\n    edges {\n${edgeText}    }\n`;
         return currentText.slice(0, insertPosition) + edgesBlock + currentText.slice(insertPosition);
      }

      return currentText;
   }
}
