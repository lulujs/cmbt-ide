/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { DecisionTableNode } from './decision-table';
import { WorkflowEdge } from './edge';
import { AnyWorkflowNode, WorkflowNode } from './node';
import { Swimlane } from './swimlane';

/**
 * 工作流程元数据接口
 * Workflow metadata interface
 */
export interface WorkflowMetadata {
   version: string;
   createdAt: string;
   updatedAt: string;
   author?: string;
   description?: string;
   tags?: string[];
}

/**
 * 工作流程模型接口
 * Workflow model interface
 */
export interface WorkflowModel {
   id: string;
   name: string;
   nodes: Map<string, AnyWorkflowNode | DecisionTableNode>;
   edges: Map<string, WorkflowEdge>;
   swimlanes: Map<string, Swimlane>;
   metadata: WorkflowMetadata;
}

/**
 * 创建空的工作流程模型
 * Create empty workflow model
 */
export function createEmptyWorkflowModel(id: string, name: string): WorkflowModel {
   const now = new Date().toISOString();
   return {
      id,
      name,
      nodes: new Map(),
      edges: new Map(),
      swimlanes: new Map(),
      metadata: {
         version: '1.0.0',
         createdAt: now,
         updatedAt: now
      }
   };
}

/**
 * 添加节点到工作流程模型
 * Add node to workflow model
 */
export function addNodeToModel(
   model: WorkflowModel,
   node: AnyWorkflowNode | DecisionTableNode
): WorkflowModel {
   const newNodes = new Map(model.nodes);
   newNodes.set(node.id, node);
   return {
      ...model,
      nodes: newNodes,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 从工作流程模型移除节点
 * Remove node from workflow model
 */
export function removeNodeFromModel(model: WorkflowModel, nodeId: string): WorkflowModel {
   const newNodes = new Map(model.nodes);
   newNodes.delete(nodeId);

   // 同时移除相关的边
   const newEdges = new Map(model.edges);
   for (const [edgeId, edge] of model.edges) {
      if (edge.source === nodeId || edge.target === nodeId) {
         newEdges.delete(edgeId);
      }
   }

   // 从泳道中移除节点
   const newSwimlanes = new Map(model.swimlanes);
   for (const [swimlaneId, swimlane] of model.swimlanes) {
      if (swimlane.containedNodes.includes(nodeId)) {
         newSwimlanes.set(swimlaneId, {
            ...swimlane,
            containedNodes: swimlane.containedNodes.filter(id => id !== nodeId)
         });
      }
   }

   return {
      ...model,
      nodes: newNodes,
      edges: newEdges,
      swimlanes: newSwimlanes,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 添加边到工作流程模型
 * Add edge to workflow model
 */
export function addEdgeToModel(model: WorkflowModel, edge: WorkflowEdge): WorkflowModel {
   const newEdges = new Map(model.edges);
   newEdges.set(edge.id, edge);
   return {
      ...model,
      edges: newEdges,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 从工作流程模型移除边
 * Remove edge from workflow model
 */
export function removeEdgeFromModel(model: WorkflowModel, edgeId: string): WorkflowModel {
   const newEdges = new Map(model.edges);
   newEdges.delete(edgeId);
   return {
      ...model,
      edges: newEdges,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 添加泳道到工作流程模型
 * Add swimlane to workflow model
 */
export function addSwimlaneToModel(model: WorkflowModel, swimlane: Swimlane): WorkflowModel {
   const newSwimlanes = new Map(model.swimlanes);
   newSwimlanes.set(swimlane.id, swimlane);
   return {
      ...model,
      swimlanes: newSwimlanes,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 从工作流程模型移除泳道
 * Remove swimlane from workflow model
 */
export function removeSwimlaneFromModel(model: WorkflowModel, swimlaneId: string): WorkflowModel {
   const newSwimlanes = new Map(model.swimlanes);
   newSwimlanes.delete(swimlaneId);
   return {
      ...model,
      swimlanes: newSwimlanes,
      metadata: {
         ...model.metadata,
         updatedAt: new Date().toISOString()
      }
   };
}

/**
 * 获取节点的所有出边
 * Get all outgoing edges for a node
 */
export function getOutgoingEdges(model: WorkflowModel, nodeId: string): WorkflowEdge[] {
   return Array.from(model.edges.values()).filter(edge => edge.source === nodeId);
}

/**
 * 获取节点的所有入边
 * Get all incoming edges for a node
 */
export function getIncomingEdges(model: WorkflowModel, nodeId: string): WorkflowEdge[] {
   return Array.from(model.edges.values()).filter(edge => edge.target === nodeId);
}

/**
 * 获取所有节点数组
 * Get all nodes as array
 */
export function getAllNodes(model: WorkflowModel): WorkflowNode[] {
   return Array.from(model.nodes.values());
}

/**
 * 获取所有边数组
 * Get all edges as array
 */
export function getAllEdges(model: WorkflowModel): WorkflowEdge[] {
   return Array.from(model.edges.values());
}

/**
 * 获取所有泳道数组
 * Get all swimlanes as array
 */
export function getAllSwimlanes(model: WorkflowModel): Swimlane[] {
   return Array.from(model.swimlanes.values());
}
