/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   CONCURRENT_BRANCH_EDGE_TYPE,
   CONCURRENT_CONTAINER_TYPE,
   CONCURRENT_END_NODE_TYPE,
   CONCURRENT_LABEL_TYPE,
   CONCURRENT_START_NODE_TYPE,
   SWIMLANE_CONTENT_TYPE,
   SWIMLANE_HEADER_TYPE,
   SWIMLANE_LABEL_TYPE,
   SWIMLANE_NODE_TYPE,
   WORKFLOW_API_NODE_TYPE,
   WORKFLOW_AUTO_NODE_TYPE,
   WORKFLOW_BEGIN_NODE_TYPE,
   WORKFLOW_CONCURRENT_NODE_TYPE,
   WORKFLOW_DECISION_NODE_TYPE,
   WORKFLOW_DECISION_TABLE_NODE_TYPE,
   WORKFLOW_EDGE_LABEL_TYPE,
   WORKFLOW_EDGE_TYPE,
   WORKFLOW_END_NODE_TYPE,
   WORKFLOW_EXCEPTION_NODE_TYPE,
   WORKFLOW_NODE_LABEL_TYPE,
   WORKFLOW_PROCESS_NODE_TYPE,
   WORKFLOW_SUBPROCESS_NODE_TYPE
} from '@crossmodel/protocol';
import {
   configureDefaultModelElements,
   configureModelElement,
   ContainerConfiguration,
   DefaultTypes,
   editLabelFeature,
   GGraph,
   gridModule,
   initializeDiagramContainer,
   overrideModelElement,
   withEditLabelFeature
} from '@eclipse-glsp/client';
import { GLSPDiagramConfiguration } from '@eclipse-glsp/theia-integration';
import { Container } from '@theia/core/shared/inversify/index';
import { WorkflowDiagramLanguage } from '../../common/crossmodel-diagram-language';
import { createCrossModelDiagramModule } from '../crossmodel-diagram-module';
import { libAvoidModule } from '../libavoid-module';
import { DEFAULT_LIBAVOID_EDGE_ROUTER_CONFIG, LibavoidEdgeRouterConfiguration, LibavoidEdgeRouterOptions } from '../libavoid-options';
import {
   ConcurrentBranchEdge,
   ConcurrentContainerCompartment,
   ConcurrentEndNode,
   ConcurrentLabel,
   ConcurrentStartNode
} from './concurrent-model';
import { ConcurrentBranchEdgeView, ConcurrentEndNodeView, ConcurrentLabelView, ConcurrentStartNodeView } from './concurrent-views';
import { workflowEdgeCreationToolModule } from './edge-creation-tool/workflow-edge-creation-tool-module';
import { workflowNodeCreationModule } from './node-creation-tool/workflow-node-creation-tool-module';
import { SwimlaneContentCompartment, SwimlaneHeaderCompartment, SwimlaneLabel, SwimlaneNode } from './swimlane-model';
import { SwimlaneContentView, SwimlaneHeaderView, SwimlaneLabelView, SwimlaneNodeView } from './swimlane-views';
import {
   WorkflowApiNode,
   WorkflowAutoNode,
   WorkflowBeginNode,
   WorkflowConcurrentNode,
   WorkflowDecisionNode,
   WorkflowDecisionTableNode,
   WorkflowEdge,
   WorkflowEdgeLabel,
   WorkflowEndNode,
   WorkflowExceptionNode,
   WorkflowNodeLabel,
   WorkflowProcessNode,
   WorkflowSubprocessNode
} from './workflow-model';
import {
   WorkflowApiNodeView,
   WorkflowAutoNodeView,
   WorkflowBeginNodeView,
   WorkflowConcurrentNodeView,
   WorkflowDecisionNodeView,
   WorkflowDecisionTableNodeView,
   WorkflowEdgeLabelView,
   WorkflowEdgeView,
   WorkflowEndNodeView,
   WorkflowExceptionNodeView,
   WorkflowGraphView,
   WorkflowNodeLabelView,
   WorkflowProcessNodeView,
   WorkflowSubprocessNodeView
} from './workflow-views';

/**
 * 工作流程图配置 - 配置工作流程图的模型元素和视图
 * Workflow diagram configuration - configures model elements and views for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
export class WorkflowDiagramConfiguration extends GLSPDiagramConfiguration {
   diagramType: string = WorkflowDiagramLanguage.diagramType;

   configureContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
      return initializeDiagramContainer(
         container,
         ...containerConfiguration,
         libAvoidModule,
         gridModule,
         workflowNodeCreationModule,
         workflowEdgeCreationToolModule,
         workflowDiagramModule
      );
   }
}

const workflowDiagramModule = createCrossModelDiagramModule((bind, unbind, isBound, rebind) => {
   const context = { bind, unbind, isBound, rebind };

   // 使用GLSP默认模型元素和视图
   configureDefaultModelElements(context);

   // 覆盖图形视图
   overrideModelElement(context, DefaultTypes.GRAPH, GGraph, WorkflowGraphView);

   // 配置工作流程节点
   configureModelElement(context, WORKFLOW_BEGIN_NODE_TYPE, WorkflowBeginNode, WorkflowBeginNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_END_NODE_TYPE, WorkflowEndNode, WorkflowEndNodeView, { enable: [withEditLabelFeature] });
   configureModelElement(context, WORKFLOW_EXCEPTION_NODE_TYPE, WorkflowExceptionNode, WorkflowExceptionNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_PROCESS_NODE_TYPE, WorkflowProcessNode, WorkflowProcessNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_DECISION_NODE_TYPE, WorkflowDecisionNode, WorkflowDecisionNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_DECISION_TABLE_NODE_TYPE, WorkflowDecisionTableNode, WorkflowDecisionTableNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_SUBPROCESS_NODE_TYPE, WorkflowSubprocessNode, WorkflowSubprocessNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_CONCURRENT_NODE_TYPE, WorkflowConcurrentNode, WorkflowConcurrentNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, WORKFLOW_AUTO_NODE_TYPE, WorkflowAutoNode, WorkflowAutoNodeView, { enable: [withEditLabelFeature] });
   configureModelElement(context, WORKFLOW_API_NODE_TYPE, WorkflowApiNode, WorkflowApiNodeView, { enable: [withEditLabelFeature] });

   // 配置工作流程边
   configureModelElement(context, WORKFLOW_EDGE_TYPE, WorkflowEdge, WorkflowEdgeView);

   // 配置标签
   configureModelElement(context, WORKFLOW_NODE_LABEL_TYPE, WorkflowNodeLabel, WorkflowNodeLabelView, { enable: [editLabelFeature] });
   configureModelElement(context, WORKFLOW_EDGE_LABEL_TYPE, WorkflowEdgeLabel, WorkflowEdgeLabelView);

   // 配置泳道
   configureModelElement(context, SWIMLANE_NODE_TYPE, SwimlaneNode, SwimlaneNodeView, { enable: [withEditLabelFeature] });
   configureModelElement(context, SWIMLANE_HEADER_TYPE, SwimlaneHeaderCompartment, SwimlaneHeaderView);
   configureModelElement(context, SWIMLANE_CONTENT_TYPE, SwimlaneContentCompartment, SwimlaneContentView);
   configureModelElement(context, SWIMLANE_LABEL_TYPE, SwimlaneLabel, SwimlaneLabelView, { enable: [editLabelFeature] });

   // 配置并发节点
   configureModelElement(context, CONCURRENT_START_NODE_TYPE, ConcurrentStartNode, ConcurrentStartNodeView, {
      enable: [withEditLabelFeature]
   });
   configureModelElement(context, CONCURRENT_END_NODE_TYPE, ConcurrentEndNode, ConcurrentEndNodeView, { enable: [withEditLabelFeature] });
   configureModelElement(context, CONCURRENT_BRANCH_EDGE_TYPE, ConcurrentBranchEdge, ConcurrentBranchEdgeView);
   configureModelElement(context, CONCURRENT_CONTAINER_TYPE, ConcurrentContainerCompartment, SwimlaneContentView);
   configureModelElement(context, CONCURRENT_LABEL_TYPE, ConcurrentLabel, ConcurrentLabelView, { enable: [editLabelFeature] });

   // 配置边路由器
   rebind(LibavoidEdgeRouterOptions).toConstantValue({
      ...DEFAULT_LIBAVOID_EDGE_ROUTER_CONFIG,
      shapeBufferDistance: 25,
      idealNudgingDistance: 20
   } as LibavoidEdgeRouterConfiguration);
});
