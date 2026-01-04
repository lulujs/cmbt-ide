/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   WORKFLOW_API_NODE_TYPE,
   WORKFLOW_AUTO_NODE_TYPE,
   WORKFLOW_BEGIN_NODE_TYPE,
   WORKFLOW_CONCURRENT_NODE_TYPE,
   WORKFLOW_DECISION_NODE_TYPE,
   WORKFLOW_DECISION_TABLE_NODE_TYPE,
   WORKFLOW_END_NODE_TYPE,
   WORKFLOW_EXCEPTION_NODE_TYPE,
   WORKFLOW_PROCESS_NODE_TYPE,
   WORKFLOW_SUBPROCESS_NODE_TYPE
} from '@crossmodel/protocol';
import { Command, CreateNodeOperation, JsonOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程节点创建操作处理器
 * Workflow node creation operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramCreateNodeOperationHandler extends JsonOperationHandler {
   override operationType = CreateNodeOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      const nodeType = this.getNodeTypeFromElementType(operation.elementTypeId);
      if (!nodeType) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.createNode(operation, nodeType));
   }

   protected createNode(operation: CreateNodeOperation, nodeType: string): void {
      const nodeId = this.generateNodeId(nodeType);
      const nodeName = this.getDefaultNodeName(nodeType);

      // 创建新节点的DSL文本
      const position = operation.location || { x: 100, y: 100 };
      const nodeText = this.generateNodeDSL(nodeType, nodeId, nodeName, position);

      // 更新语义模型
      const currentText = this.modelState.semanticText();
      const updatedText = this.insertNodeIntoModel(currentText, nodeText);

      this.modelState.updateSourceModel({ text: updatedText });
   }

   /**
    * 从元素类型ID获取节点类型
    * Get node type from element type ID
    */
   private getNodeTypeFromElementType(elementTypeId: string): string | undefined {
      const typeMap: Record<string, string> = {
         [WORKFLOW_BEGIN_NODE_TYPE]: 'begin',
         [WORKFLOW_END_NODE_TYPE]: 'end',
         [WORKFLOW_EXCEPTION_NODE_TYPE]: 'exception',
         [WORKFLOW_PROCESS_NODE_TYPE]: 'process',
         [WORKFLOW_DECISION_NODE_TYPE]: 'decision',
         [WORKFLOW_DECISION_TABLE_NODE_TYPE]: 'decision_table',
         [WORKFLOW_SUBPROCESS_NODE_TYPE]: 'subprocess',
         [WORKFLOW_CONCURRENT_NODE_TYPE]: 'concurrent',
         [WORKFLOW_AUTO_NODE_TYPE]: 'auto',
         [WORKFLOW_API_NODE_TYPE]: 'api'
      };
      return typeMap[elementTypeId];
   }

   /**
    * 获取默认节点名称
    * Get default node name
    */
   private getDefaultNodeName(nodeType: string): string {
      const nameMap: Record<string, string> = {
         begin: '开始',
         end: '结束',
         exception: '异常',
         process: '过程',
         decision: '分支',
         decision_table: '决策表',
         subprocess: '子流程',
         concurrent: '并发',
         auto: '自动化',
         api: 'API'
      };
      return nameMap[nodeType] || '节点';
   }

   /**
    * 生成节点ID
    * Generate node ID
    */
   private generateNodeId(nodeType: string): string {
      const timestamp = Date.now();
      return `${nodeType}_${timestamp}`;
   }

   /**
    * 生成节点DSL文本
    * Generate node DSL text
    */
   private generateNodeDSL(nodeType: string, nodeId: string, nodeName: string, position: { x: number; y: number }): string {
      let dsl = `    ${nodeType} ${nodeId} {\n`;
      dsl += `        name: "${nodeName}"\n`;
      dsl += `        position: { x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }\n`;

      // 为特定节点类型添加额外属性
      if (nodeType === 'end' || nodeType === 'exception') {
         dsl += `        expectedValue: ""\n`;
      }
      if (nodeType === 'decision') {
         dsl += `        branches: [\n`;
         dsl += `            { id: "branch_1", value: "是", isDefault: true }\n`;
         dsl += `            { id: "branch_2", value: "否" }\n`;
         dsl += `        ]\n`;
      }

      dsl += `    }\n`;
      return dsl;
   }

   /**
    * 将节点插入到模型中
    * Insert node into model
    */
   private insertNodeIntoModel(currentText: string, nodeText: string): string {
      // 查找nodes块的结束位置
      const nodesEndPattern = /(\s*nodes\s*\{[\s\S]*?)(\s*\}\s*(?:edges|swimlanes|\}))/;
      const match = currentText.match(nodesEndPattern);

      if (match) {
         const insertPosition = match.index! + match[1].length;
         return currentText.slice(0, insertPosition) + '\n' + nodeText + currentText.slice(insertPosition);
      }

      // 如果没有找到nodes块，在workflow块末尾添加
      const workflowEndPattern = /(\s*workflow\s+\w+\s*\{[\s\S]*?)(\s*\})\s*$/;
      const workflowMatch = currentText.match(workflowEndPattern);

      if (workflowMatch) {
         const insertPosition = workflowMatch.index! + workflowMatch[1].length;
         const nodesBlock = `\n    nodes {\n${nodeText}    }\n`;
         return currentText.slice(0, insertPosition) + nodesBlock + currentText.slice(insertPosition);
      }

      return currentText;
   }
}
