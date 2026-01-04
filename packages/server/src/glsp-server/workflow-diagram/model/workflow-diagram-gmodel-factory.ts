/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GEdge, GGraph, GModelFactory, GNode, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import {
   isApiNode,
   isAutoNode,
   isBeginNode,
   isConcurrentNode,
   isDecisionNode,
   isDecisionTableNode,
   isEndNode,
   isExceptionNode,
   isProcessNode,
   isSubprocessNode,
   Swimlane,
   WorkflowEdge,
   WorkflowNode
} from '../../../language-server/generated/ast.js';
import { GWorkflowEdge } from './edges.js';
import {
   GApiNode,
   GAutoNode,
   GBeginNode,
   GConcurrentNode,
   GDecisionNode,
   GDecisionTableNode,
   GEndNode,
   GExceptionNode,
   GProcessNode,
   GSubprocessNode,
   GSwimlaneNode
} from './nodes.js';
import { WorkflowModelState } from './workflow-model-state.js';

/**
 * 工作流程图GModel工厂 - 将语义模型转换为GLSP图形模型
 * Workflow diagram GModel factory - converts semantic model to GLSP graphical model
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramGModelFactory implements GModelFactory {
   @inject(ModelState) protected readonly modelState!: WorkflowModelState;

   createModel(): void {
      const newRoot = this.createGraph();
      if (newRoot) {
         this.modelState.updateRoot(newRoot);
      }
   }

   protected createGraph(): GGraph | undefined {
      const workflowModel = this.modelState.workflowModel;
      if (!workflowModel) {
         return;
      }

      const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);

      // 首先添加泳道（作为容器）
      workflowModel.swimlanes.map(swimlane => this.createSwimlaneNode(swimlane)).forEach(node => graphBuilder.add(node));

      // 添加所有工作流程节点
      workflowModel.nodes.map(node => this.createWorkflowNode(node)).forEach(node => graphBuilder.add(node));

      // 添加所有工作流程边
      workflowModel.edges.map(edge => this.createWorkflowEdge(edge)).forEach(edge => graphBuilder.add(edge));

      return graphBuilder.build();
   }

   /**
    * 创建工作流程节点的图形表示
    * Create graphical representation of workflow node
    */
   protected createWorkflowNode(node: WorkflowNode): GNode {
      if (isBeginNode(node)) {
         return GBeginNode.builder().set(node, this.modelState.index).build();
      }
      if (isEndNode(node)) {
         return GEndNode.builder().set(node, this.modelState.index).build();
      }
      if (isExceptionNode(node)) {
         return GExceptionNode.builder().set(node, this.modelState.index).build();
      }
      if (isProcessNode(node)) {
         return GProcessNode.builder().set(node, this.modelState.index).build();
      }
      if (isDecisionNode(node)) {
         return GDecisionNode.builder().set(node, this.modelState.index).build();
      }
      if (isDecisionTableNode(node)) {
         return GDecisionTableNode.builder().set(node, this.modelState.index).build();
      }
      if (isSubprocessNode(node)) {
         return GSubprocessNode.builder().set(node, this.modelState.index).build();
      }
      if (isConcurrentNode(node)) {
         return GConcurrentNode.builder().set(node, this.modelState.index).build();
      }
      if (isAutoNode(node)) {
         return GAutoNode.builder().set(node, this.modelState.index).build();
      }
      if (isApiNode(node)) {
         return GApiNode.builder().set(node, this.modelState.index).build();
      }

      // 默认返回过程节点 - 使用类型断言因为所有节点类型都已处理
      // Default to process node - use type assertion since all node types are handled
      return GProcessNode.builder()
         .set(node as unknown as import('../../../language-server/generated/ast.js').ProcessNode, this.modelState.index)
         .build();
   }

   /**
    * 创建工作流程边的图形表示
    * Create graphical representation of workflow edge
    */
   protected createWorkflowEdge(edge: WorkflowEdge): GEdge {
      return GWorkflowEdge.builder().set(edge, this.modelState.index).build();
   }

   /**
    * 创建泳道的图形表示
    * Create graphical representation of swimlane
    */
   protected createSwimlaneNode(swimlane: Swimlane): GNode {
      return GSwimlaneNode.builder().set(swimlane, this.modelState.index).build();
   }
}
