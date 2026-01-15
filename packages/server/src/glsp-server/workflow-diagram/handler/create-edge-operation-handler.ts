/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { WORKFLOW_EDGE_TYPE } from '@crossmodel/protocol';
import { ActionDispatcher, Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, SelectAction } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { WorkflowEdge } from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程边创建操作处理器
 * Workflow edge creation operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramCreateEdgeOperationHandler extends JsonCreateEdgeOperationHandler {
   override label = 'Workflow Edge';
   elementTypeIds = [WORKFLOW_EDGE_TYPE];

   declare protected modelState: WorkflowModelState;
   @inject(ActionDispatcher) protected actionDispatcher: ActionDispatcher;

   createCommand(operation: CreateEdgeOperation): Command {
      return new CrossModelCommand(this.modelState, () => this.createEdge(operation));
   }

   protected async createEdge(operation: CreateEdgeOperation): Promise<void> {
      const sourceNode = this.modelState.index.findWorkflowNode(operation.sourceElementId);
      const targetNode = this.modelState.index.findWorkflowNode(operation.targetElementId);

      if (!sourceNode || !targetNode) {
         return;
      }

      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return;
      }

      // 创建边对象
      const edgeId = this.generateEdgeId();
      const edge: WorkflowEdge = {
         $type: 'WorkflowEdge',
         $container: workflowModel,
         id: edgeId,
         source: {
            ref: sourceNode,
            $refText: sourceNode.id || ''
         },
         target: {
            ref: targetNode,
            $refText: targetNode.id || ''
         },
         automationActions: [],
         testData: []
      };

      // 添加到模型
      workflowModel.edges.push(edge);

      // 选中新创建的边
      this.actionDispatcher.dispatchAfterNextUpdate(SelectAction.create({ selectedElementsIDs: [this.modelState.index.createId(edge)] }));
   }

   /**
    * 生成边ID
    * Generate edge ID
    */
   private generateEdgeId(): string {
      const timestamp = Date.now();
      return `edge_${timestamp}`;
   }
}
