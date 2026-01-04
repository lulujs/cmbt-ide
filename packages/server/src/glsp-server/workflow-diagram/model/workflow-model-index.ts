/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { Swimlane, WorkflowEdge, WorkflowModel, WorkflowNode } from '../../../language-server/generated/ast.js';
import { CrossModelIndex } from '../../common/cross-model-index.js';

/**
 * 工作流程模型索引 - 提供工作流程元素的快速查找
 * Workflow model index - provides fast lookup for workflow elements
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowModelIndex extends CrossModelIndex {
   /**
    * 根据ID查找工作流程节点
    * Find workflow node by ID
    */
   findWorkflowNode(nodeId: string): WorkflowNode | undefined {
      const element = this.findSemanticElement(nodeId);
      if (element && this.isWorkflowNode(element)) {
         return element as WorkflowNode;
      }
      return undefined;
   }

   /**
    * 根据ID查找工作流程边
    * Find workflow edge by ID
    */
   findWorkflowEdge(edgeId: string): WorkflowEdge | undefined {
      const element = this.findSemanticElement(edgeId);
      if (element && this.isWorkflowEdge(element)) {
         return element as WorkflowEdge;
      }
      return undefined;
   }

   /**
    * 根据ID查找泳道
    * Find swimlane by ID
    */
   findSwimlane(swimlaneId: string): Swimlane | undefined {
      const element = this.findSemanticElement(swimlaneId);
      if (element && this.isSwimlane(element)) {
         return element as Swimlane;
      }
      return undefined;
   }

   /**
    * 获取工作流程模型中的所有节点
    * Get all nodes in workflow model
    */
   getAllWorkflowNodes(model: WorkflowModel): WorkflowNode[] {
      return model.nodes;
   }

   /**
    * 获取工作流程模型中的所有边
    * Get all edges in workflow model
    */
   getAllWorkflowEdges(model: WorkflowModel): WorkflowEdge[] {
      return model.edges;
   }

   /**
    * 获取工作流程模型中的所有泳道
    * Get all swimlanes in workflow model
    */
   getAllSwimlanes(model: WorkflowModel): Swimlane[] {
      return model.swimlanes;
   }

   /**
    * 检查元素是否为工作流程节点
    * Check if element is a workflow node
    */
   private isWorkflowNode(element: unknown): element is WorkflowNode {
      return (
         element !== null &&
         typeof element === 'object' &&
         '$type' in element &&
         [
            'BeginNode',
            'EndNode',
            'ExceptionNode',
            'ProcessNode',
            'DecisionNode',
            'DecisionTableNode',
            'SubprocessNode',
            'ConcurrentNode',
            'AutoNode',
            'ApiNode',
            'WorkflowNode'
         ].includes((element as { $type: string }).$type)
      );
   }

   /**
    * 检查元素是否为工作流程边
    * Check if element is a workflow edge
    */
   private isWorkflowEdge(element: unknown): element is WorkflowEdge {
      return (
         element !== null && typeof element === 'object' && '$type' in element && (element as { $type: string }).$type === 'WorkflowEdge'
      );
   }

   /**
    * 检查元素是否为泳道
    * Check if element is a swimlane
    */
   private isSwimlane(element: unknown): element is Swimlane {
      return element !== null && typeof element === 'object' && '$type' in element && (element as { $type: string }).$type === 'Swimlane';
   }
}
