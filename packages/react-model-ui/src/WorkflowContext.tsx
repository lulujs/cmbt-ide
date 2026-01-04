/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程上下文
 * Workflow context
 * 需求 8.4: 实现与文本和图形编辑器的数据同步
 */

import {
   AnyWorkflowNode,
   createEmptyWorkflowModel,
   DecisionTableNode,
   getAllEdges,
   getAllNodes,
   getAllSwimlanes,
   getIncomingEdges,
   getOutgoingEdges,
   isReferenceNode,
   ReferenceNode,
   Swimlane,
   WorkflowEdge,
   WorkflowModel,
   WorkflowNode
} from '@crossmodel/protocol';
import * as React from 'react';
import { WorkflowDispatchAction } from './WorkflowModelReducer';

/**
 * 工作流程验证结果
 * Workflow validation result
 */
export interface WorkflowValidationResult {
   isValid: boolean;
   errors: string[];
   warnings: string[];
   nodeErrors: Map<string, string[]>;
   edgeErrors: Map<string, string[]>;
}

/**
 * 工作流程上下文值
 * Workflow context value
 */
export interface WorkflowContextValue {
   workflow: WorkflowModel;
   dispatch: React.Dispatch<WorkflowDispatchAction>;
   validation: WorkflowValidationResult;
   isDirty: boolean;
   isReadonly: boolean;
   // Node helpers
   getNode: (nodeId: string) => AnyWorkflowNode | DecisionTableNode | undefined;
   getAllNodes: () => WorkflowNode[];
   getNodeOutgoingEdges: (nodeId: string) => WorkflowEdge[];
   getNodeIncomingEdges: (nodeId: string) => WorkflowEdge[];
   getReferenceNodes: () => ReferenceNode[];
   // Edge helpers
   getEdge: (edgeId: string) => WorkflowEdge | undefined;
   getAllEdges: () => WorkflowEdge[];
   // Swimlane helpers
   getSwimlane: (swimlaneId: string) => Swimlane | undefined;
   getAllSwimlanes: () => Swimlane[];
   getNodeSwimlane: (nodeId: string) => Swimlane | undefined;
}

/**
 * 默认验证结果
 * Default validation result
 */
const DEFAULT_VALIDATION: WorkflowValidationResult = {
   isValid: true,
   errors: [],
   warnings: [],
   nodeErrors: new Map(),
   edgeErrors: new Map()
};

/**
 * 默认工作流程上下文值
 * Default workflow context value
 */
const DEFAULT_WORKFLOW_CONTEXT: WorkflowContextValue = {
   workflow: createEmptyWorkflowModel('default', 'Default Workflow'),
   dispatch: () => {},
   validation: DEFAULT_VALIDATION,
   isDirty: false,
   isReadonly: false,
   getNode: () => undefined,
   getAllNodes: () => [],
   getNodeOutgoingEdges: () => [],
   getNodeIncomingEdges: () => [],
   getReferenceNodes: () => [],
   getEdge: () => undefined,
   getAllEdges: () => [],
   getSwimlane: () => undefined,
   getAllSwimlanes: () => [],
   getNodeSwimlane: () => undefined
};

/**
 * 工作流程上下文
 * Workflow context
 */
export const WorkflowContext = React.createContext<WorkflowContextValue>(DEFAULT_WORKFLOW_CONTEXT);

/**
 * 工作流程提供者属性
 * Workflow provider props
 */
export interface WorkflowProviderProps {
   workflow: WorkflowModel;
   dispatch: React.Dispatch<WorkflowDispatchAction>;
   validation?: WorkflowValidationResult;
   isDirty?: boolean;
   isReadonly?: boolean;
   children: React.ReactNode;
}

/**
 * 工作流程提供者
 * Workflow provider
 */
export function WorkflowProvider({
   workflow,
   dispatch,
   validation = DEFAULT_VALIDATION,
   isDirty = false,
   isReadonly = false,
   children
}: WorkflowProviderProps): React.ReactElement {
   // Create helper functions
   const getNode = React.useCallback((nodeId: string) => workflow.nodes.get(nodeId), [workflow.nodes]);

   const getAllNodesHelper = React.useCallback(() => getAllNodes(workflow), [workflow]);

   const getNodeOutgoingEdges = React.useCallback((nodeId: string) => getOutgoingEdges(workflow, nodeId), [workflow]);

   const getNodeIncomingEdges = React.useCallback((nodeId: string) => getIncomingEdges(workflow, nodeId), [workflow]);

   const getReferenceNodes = React.useCallback(
      () => getAllNodes(workflow).filter((node): node is ReferenceNode => isReferenceNode(node)),
      [workflow]
   );

   const getEdge = React.useCallback((edgeId: string) => workflow.edges.get(edgeId), [workflow.edges]);

   const getAllEdgesHelper = React.useCallback(() => getAllEdges(workflow), [workflow]);

   const getSwimlane = React.useCallback((swimlaneId: string) => workflow.swimlanes.get(swimlaneId), [workflow.swimlanes]);

   const getAllSwimlanesHelper = React.useCallback(() => getAllSwimlanes(workflow), [workflow]);

   const getNodeSwimlane = React.useCallback(
      (nodeId: string) => {
         for (const swimlane of workflow.swimlanes.values()) {
            if (swimlane.containedNodes.includes(nodeId)) {
               return swimlane;
            }
         }
         return undefined;
      },
      [workflow.swimlanes]
   );

   // Create context value
   const contextValue = React.useMemo<WorkflowContextValue>(
      () => ({
         workflow,
         dispatch,
         validation,
         isDirty,
         isReadonly,
         getNode,
         getAllNodes: getAllNodesHelper,
         getNodeOutgoingEdges,
         getNodeIncomingEdges,
         getReferenceNodes,
         getEdge,
         getAllEdges: getAllEdgesHelper,
         getSwimlane,
         getAllSwimlanes: getAllSwimlanesHelper,
         getNodeSwimlane
      }),
      [
         workflow,
         dispatch,
         validation,
         isDirty,
         isReadonly,
         getNode,
         getAllNodesHelper,
         getNodeOutgoingEdges,
         getNodeIncomingEdges,
         getReferenceNodes,
         getEdge,
         getAllEdgesHelper,
         getSwimlane,
         getAllSwimlanesHelper,
         getNodeSwimlane
      ]
   );

   return <WorkflowContext.Provider value={contextValue}>{children}</WorkflowContext.Provider>;
}

/**
 * 使用工作流程上下文
 * Use workflow context
 */
export function useWorkflow(): WorkflowContextValue {
   return React.useContext(WorkflowContext);
}

/**
 * 使用工作流程模型
 * Use workflow model
 */
export function useWorkflowModel(): WorkflowModel {
   return useWorkflow().workflow;
}

/**
 * 使用工作流程调度器
 * Use workflow dispatch
 */
export function useWorkflowDispatch(): React.Dispatch<WorkflowDispatchAction> {
   return useWorkflow().dispatch;
}

/**
 * 使用工作流程验证
 * Use workflow validation
 */
export function useWorkflowValidation(): WorkflowValidationResult {
   return useWorkflow().validation;
}

/**
 * 使用工作流程只读状态
 * Use workflow readonly state
 */
export function useWorkflowReadonly(): boolean {
   return useWorkflow().isReadonly;
}

/**
 * 使用工作流程脏状态
 * Use workflow dirty state
 */
export function useWorkflowDirty(): boolean {
   return useWorkflow().isDirty;
}

/**
 * 使用节点
 * Use node
 */
export function useNode(nodeId: string): AnyWorkflowNode | DecisionTableNode | undefined {
   const { getNode } = useWorkflow();
   return getNode(nodeId);
}

/**
 * 使用边
 * Use edge
 */
export function useEdge(edgeId: string): WorkflowEdge | undefined {
   const { getEdge } = useWorkflow();
   return getEdge(edgeId);
}

/**
 * 使用泳道
 * Use swimlane
 */
export function useSwimlane(swimlaneId: string): Swimlane | undefined {
   const { getSwimlane } = useWorkflow();
   return getSwimlane(swimlaneId);
}
