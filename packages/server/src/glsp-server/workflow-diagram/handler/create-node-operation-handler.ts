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
import { Command, CreateNodeOperation, JsonCreateNodeOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import {
   ApiNode,
   AutoNode,
   BeginNode,
   ConcurrentNode,
   DecisionNode,
   DecisionTableNode,
   EndNode,
   ExceptionNode,
   ProcessNode,
   SubprocessNode,
   WorkflowNode
} from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程节点创建操作处理器
 * Workflow node creation operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramCreateNodeOperationHandler extends JsonCreateNodeOperationHandler {
   override label = 'Create Workflow Node';
   elementTypeIds = [
      WORKFLOW_BEGIN_NODE_TYPE,
      WORKFLOW_END_NODE_TYPE,
      WORKFLOW_EXCEPTION_NODE_TYPE,
      WORKFLOW_PROCESS_NODE_TYPE,
      WORKFLOW_DECISION_NODE_TYPE,
      WORKFLOW_DECISION_TABLE_NODE_TYPE,
      WORKFLOW_SUBPROCESS_NODE_TYPE,
      WORKFLOW_CONCURRENT_NODE_TYPE,
      WORKFLOW_AUTO_NODE_TYPE,
      WORKFLOW_API_NODE_TYPE
   ];

   declare protected modelState: WorkflowModelState;

   override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.createNode(operation));
   }

   protected createNode(operation: CreateNodeOperation): void {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return;
      }

      const location = this.getLocation(operation) ?? Point.ORIGIN;
      const node = this.createNodeByType(operation.elementTypeId, location);

      if (node) {
         workflowModel.nodes.push(node);
      } else {
         console.log('[WorkflowDiagramCreateNodeOperationHandler] Failed to create node');
      }
   }

   /**
    * 根据元素类型创建对应的节点
    * Create node by element type
    */
   protected createNodeByType(elementTypeId: string, location: Point): WorkflowNode | undefined {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return undefined;
      }

      const baseId = this.generateNodeId(elementTypeId);
      const documentUri = this.modelState.semanticRoot.$document?.uri;
      if (!documentUri) {
         return undefined;
      }
      const id = this.modelState.idProvider.findNextLocalId('WorkflowNode', baseId, documentUri);

      switch (elementTypeId) {
         case WORKFLOW_BEGIN_NODE_TYPE:
            return this.createBeginNode(id, location, workflowModel);
         case WORKFLOW_END_NODE_TYPE:
            return this.createEndNode(id, location, workflowModel);
         case WORKFLOW_EXCEPTION_NODE_TYPE:
            return this.createExceptionNode(id, location, workflowModel);
         case WORKFLOW_PROCESS_NODE_TYPE:
            return this.createProcessNode(id, location, workflowModel);
         case WORKFLOW_DECISION_NODE_TYPE:
            return this.createDecisionNode(id, location, workflowModel);
         case WORKFLOW_DECISION_TABLE_NODE_TYPE:
            return this.createDecisionTableNode(id, location, workflowModel);
         case WORKFLOW_SUBPROCESS_NODE_TYPE:
            return this.createSubprocessNode(id, location, workflowModel);
         case WORKFLOW_CONCURRENT_NODE_TYPE:
            return this.createConcurrentNode(id, location, workflowModel);
         case WORKFLOW_AUTO_NODE_TYPE:
            return this.createAutoNode(id, location, workflowModel);
         case WORKFLOW_API_NODE_TYPE:
            return this.createApiNode(id, location, workflowModel);
         default:
            return undefined;
      }
   }

   /**
    * 生成节点ID
    * Generate node ID
    */
   protected generateNodeId(elementTypeId: string): string {
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
      const nodeType = typeMap[elementTypeId] || 'node';
      return `${nodeType}_${Date.now()}`;
   }

   /**
    * 创建位置对象
    * Create position object
    */
   protected createPosition(location: Point, container: any): any {
      return {
         $type: 'Position',
         $container: container,
         x: Math.round(location.x),
         y: Math.round(location.y)
      };
   }

   protected createBeginNode(id: string, location: Point, container: any): BeginNode {
      const node: any = {
         $type: 'BeginNode',
         $container: container,
         id,
         name: '开始',
         nodeType: 'begin',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createEndNode(id: string, location: Point, container: any): EndNode {
      const node: any = {
         $type: 'EndNode',
         $container: container,
         id,
         name: '结束',
         nodeType: 'end',
         expectedValue: '',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createExceptionNode(id: string, location: Point, container: any): ExceptionNode {
      const node: any = {
         $type: 'ExceptionNode',
         $container: container,
         id,
         name: '异常',
         nodeType: 'exception',
         expectedValue: '',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createProcessNode(id: string, location: Point, container: any): ProcessNode {
      const node: any = {
         $type: 'ProcessNode',
         $container: container,
         id,
         name: '过程',
         nodeType: 'process',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createDecisionNode(id: string, location: Point, container: any): DecisionNode {
      const node: any = {
         $type: 'DecisionNode',
         $container: container,
         id,
         name: '分支',
         nodeType: 'decision',
         branches: [],
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);

      // 添加分支条件
      node.branches.push({
         $type: 'BranchCondition',
         $container: node,
         id: 'branch_1',
         value: '是',
         isDefault: true
      });
      node.branches.push({
         $type: 'BranchCondition',
         $container: node,
         id: 'branch_2',
         value: '否',
         isDefault: false
      });

      return node;
   }

   protected createDecisionTableNode(id: string, location: Point, container: any): DecisionTableNode {
      const node: any = {
         $type: 'DecisionTableNode',
         $container: container,
         id,
         name: '决策表',
         nodeType: 'decision_table',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createSubprocessNode(id: string, location: Point, container: any): SubprocessNode {
      const node: any = {
         $type: 'SubprocessNode',
         $container: container,
         id,
         name: '子流程',
         nodeType: 'subprocess',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createConcurrentNode(id: string, location: Point, container: any): ConcurrentNode {
      const node: any = {
         $type: 'ConcurrentNode',
         $container: container,
         id,
         name: '并发',
         nodeType: 'concurrent',
         parallelBranches: [],
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createAutoNode(id: string, location: Point, container: any): AutoNode {
      const node: any = {
         $type: 'AutoNode',
         $container: container,
         id,
         name: '自动化',
         nodeType: 'auto',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }

   protected createApiNode(id: string, location: Point, container: any): ApiNode {
      const node: any = {
         $type: 'ApiNode',
         $container: container,
         id,
         name: 'API',
         nodeType: 'api',
         automationActions: [],
         testData: []
      };
      node.position = this.createPosition(location, node);
      return node;
   }
}
