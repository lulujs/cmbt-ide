/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程模型 Reducer
 * Workflow model reducer
 * 需求 8.4: 确保表单编辑正确更新语义模型
 */

import {
   addEdgeToModel,
   addNodeToModel,
   addSwimlaneToModel,
   AnyWorkflowNode,
   DecisionTableData,
   DecisionTableNode,
   ReferenceNode,
   removeEdgeFromModel,
   removeNodeFromModel,
   removeSwimlaneFromModel,
   Swimlane,
   WorkflowEdge,
   WorkflowModel
} from '@crossmodel/protocol';

/**
 * 工作流程状态原因
 * Workflow state reason
 */
export type WorkflowStateReason = WorkflowDispatchAction['type'] | 'workflow:initial';

/**
 * 工作流程模型状态
 * Workflow model state
 */
export interface WorkflowModelState {
   workflow: WorkflowModel;
   reason: WorkflowStateReason;
}

/**
 * 工作流程模型动作类型
 * Workflow model action types
 */
export type WorkflowDispatchAction =
   // Model actions
   | { type: 'workflow:update-model'; model: WorkflowModel }
   | { type: 'workflow:update-name'; name: string }
   | { type: 'workflow:update-metadata'; metadata: Partial<WorkflowModel['metadata']> }
   // Node actions
   | { type: 'workflow:add-node'; node: AnyWorkflowNode | DecisionTableNode }
   | { type: 'workflow:update-node'; nodeId: string; node: Partial<AnyWorkflowNode | DecisionTableNode> }
   | { type: 'workflow:remove-node'; nodeId: string }
   | { type: 'workflow:update-decision-table'; nodeId: string; tableData: DecisionTableData }
   // Edge actions
   | { type: 'workflow:add-edge'; edge: WorkflowEdge }
   | { type: 'workflow:update-edge'; edgeId: string; edge: Partial<WorkflowEdge> }
   | { type: 'workflow:remove-edge'; edgeId: string }
   // Swimlane actions
   | { type: 'workflow:add-swimlane'; swimlane: Swimlane }
   | { type: 'workflow:update-swimlane'; swimlaneId: string; swimlane: Partial<Swimlane> }
   | { type: 'workflow:remove-swimlane'; swimlaneId: string }
   | { type: 'workflow:assign-node-to-swimlane'; nodeId: string; swimlaneId: string }
   | { type: 'workflow:remove-node-from-swimlane'; nodeId: string }
   // Reference node actions
   | { type: 'workflow:create-reference'; sourceNodeId: string }
   | { type: 'workflow:create-references'; sourceNodeIds: string[] }
   | { type: 'workflow:update-reference'; referenceId: string; updates: Partial<Pick<ReferenceNode, 'name' | 'properties'>> };

/**
 * 检查是否为工作流程动作
 * Check if action is a workflow action
 */
export function isWorkflowDispatchAction(action: { type: string }): action is WorkflowDispatchAction {
   return action.type.startsWith('workflow:');
}

/**
 * 工作流程模型 Reducer
 * Workflow model reducer
 */
export function WorkflowModelReducer(state: WorkflowModelState, action: WorkflowDispatchAction): WorkflowModelState {
   const workflow = state.workflow;
   if (!workflow) {
      console.error('Workflow model is undefined');
      return state;
   }

   switch (action.type) {
      case 'workflow:update-model':
         return {
            workflow: action.model,
            reason: action.type
         };

      case 'workflow:update-name':
         return {
            workflow: {
               ...workflow,
               name: action.name,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };

      case 'workflow:update-metadata':
         return {
            workflow: {
               ...workflow,
               metadata: { ...workflow.metadata, ...action.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };

      case 'workflow:add-node':
         return {
            workflow: addNodeToModel(workflow, action.node),
            reason: action.type
         };

      case 'workflow:update-node': {
         const existingNode = workflow.nodes.get(action.nodeId);
         if (!existingNode) {
            console.error(`Node ${action.nodeId} not found`);
            return state;
         }
         const updatedNode = { ...existingNode, ...action.node } as AnyWorkflowNode | DecisionTableNode;
         const newNodes = new Map(workflow.nodes);
         newNodes.set(action.nodeId, updatedNode);
         return {
            workflow: {
               ...workflow,
               nodes: newNodes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:remove-node':
         return {
            workflow: removeNodeFromModel(workflow, action.nodeId),
            reason: action.type
         };

      case 'workflow:update-decision-table': {
         const dtNode = workflow.nodes.get(action.nodeId) as DecisionTableNode | undefined;
         if (!dtNode || dtNode.type !== 'decision_table') {
            console.error(`Decision table node ${action.nodeId} not found`);
            return state;
         }
         const updatedDtNode: DecisionTableNode = { ...dtNode, tableData: action.tableData };
         const newNodes = new Map(workflow.nodes);
         newNodes.set(action.nodeId, updatedDtNode);
         return {
            workflow: {
               ...workflow,
               nodes: newNodes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:add-edge':
         return {
            workflow: addEdgeToModel(workflow, action.edge),
            reason: action.type
         };

      case 'workflow:update-edge': {
         const existingEdge = workflow.edges.get(action.edgeId);
         if (!existingEdge) {
            console.error(`Edge ${action.edgeId} not found`);
            return state;
         }
         const updatedEdge = { ...existingEdge, ...action.edge };
         const newEdges = new Map(workflow.edges);
         newEdges.set(action.edgeId, updatedEdge);
         return {
            workflow: {
               ...workflow,
               edges: newEdges,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:remove-edge':
         return {
            workflow: removeEdgeFromModel(workflow, action.edgeId),
            reason: action.type
         };

      case 'workflow:add-swimlane':
         return {
            workflow: addSwimlaneToModel(workflow, action.swimlane),
            reason: action.type
         };

      case 'workflow:update-swimlane': {
         const existingSwimlane = workflow.swimlanes.get(action.swimlaneId);
         if (!existingSwimlane) {
            console.error(`Swimlane ${action.swimlaneId} not found`);
            return state;
         }
         const updatedSwimlane = { ...existingSwimlane, ...action.swimlane };
         const newSwimlanes = new Map(workflow.swimlanes);
         newSwimlanes.set(action.swimlaneId, updatedSwimlane);
         return {
            workflow: {
               ...workflow,
               swimlanes: newSwimlanes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:remove-swimlane':
         return {
            workflow: removeSwimlaneFromModel(workflow, action.swimlaneId),
            reason: action.type
         };

      case 'workflow:assign-node-to-swimlane': {
         // Remove node from any existing swimlane
         const newSwimlanes = new Map(workflow.swimlanes);
         for (const [id, swimlane] of newSwimlanes) {
            if (swimlane.containedNodes.includes(action.nodeId)) {
               newSwimlanes.set(id, {
                  ...swimlane,
                  containedNodes: swimlane.containedNodes.filter((nid: string) => nid !== action.nodeId)
               });
            }
         }
         // Add node to target swimlane
         const targetSwimlane = newSwimlanes.get(action.swimlaneId);
         if (targetSwimlane) {
            newSwimlanes.set(action.swimlaneId, {
               ...targetSwimlane,
               containedNodes: [...targetSwimlane.containedNodes, action.nodeId]
            });
         }
         return {
            workflow: {
               ...workflow,
               swimlanes: newSwimlanes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:remove-node-from-swimlane': {
         const newSwimlanes = new Map(workflow.swimlanes);
         for (const [id, swimlane] of newSwimlanes) {
            if (swimlane.containedNodes.includes(action.nodeId)) {
               newSwimlanes.set(id, {
                  ...swimlane,
                  containedNodes: swimlane.containedNodes.filter((nid: string) => nid !== action.nodeId)
               });
            }
         }
         return {
            workflow: {
               ...workflow,
               swimlanes: newSwimlanes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:create-reference': {
         const sourceNode = workflow.nodes.get(action.sourceNodeId);
         if (!sourceNode) {
            console.error(`Source node ${action.sourceNodeId} not found`);
            return state;
         }
         const referenceNode: ReferenceNode = {
            ...sourceNode,
            id: `ref_${action.sourceNodeId}_${Date.now()}`,
            name: `${sourceNode.name} (引用)`,
            sourceNodeId: action.sourceNodeId,
            isReference: true,
            editableProperties: ['name', 'stepDisplay'] as const
         };
         const newNodes = new Map(workflow.nodes);
         newNodes.set(referenceNode.id, referenceNode as unknown as AnyWorkflowNode);
         return {
            workflow: {
               ...workflow,
               nodes: newNodes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:create-references': {
         const newNodes = new Map(workflow.nodes);
         for (const sourceNodeId of action.sourceNodeIds) {
            const sourceNode = workflow.nodes.get(sourceNodeId);
            if (sourceNode) {
               const referenceNode: ReferenceNode = {
                  ...sourceNode,
                  id: `ref_${sourceNodeId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  name: `${sourceNode.name} (引用)`,
                  sourceNodeId,
                  isReference: true,
                  editableProperties: ['name', 'stepDisplay'] as const
               };
               newNodes.set(referenceNode.id, referenceNode as unknown as AnyWorkflowNode);
            }
         }
         return {
            workflow: {
               ...workflow,
               nodes: newNodes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      case 'workflow:update-reference': {
         const refNode = workflow.nodes.get(action.referenceId) as ReferenceNode | undefined;
         if (!refNode || !refNode.isReference) {
            console.error(`Reference node ${action.referenceId} not found`);
            return state;
         }
         // Only allow updating name and stepDisplay
         const updatedRefNode: ReferenceNode = {
            ...refNode,
            name: action.updates.name ?? refNode.name,
            properties: {
               ...refNode.properties,
               stepDisplay: action.updates.properties?.stepDisplay ?? refNode.properties.stepDisplay
            }
         };
         const newNodes = new Map(workflow.nodes);
         newNodes.set(action.referenceId, updatedRefNode as unknown as AnyWorkflowNode);
         return {
            workflow: {
               ...workflow,
               nodes: newNodes,
               metadata: { ...workflow.metadata, updatedAt: new Date().toISOString() }
            },
            reason: action.type
         };
      }

      default:
         return state;
   }
}
