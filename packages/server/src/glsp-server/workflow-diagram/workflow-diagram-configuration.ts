/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   CONCURRENT_BRANCH_EDGE_TYPE,
   CONCURRENT_END_NODE_TYPE,
   CONCURRENT_START_NODE_TYPE,
   SWIMLANE_NODE_TYPE,
   WORKFLOW_API_NODE_TYPE,
   WORKFLOW_AUTO_NODE_TYPE,
   WORKFLOW_BEGIN_NODE_TYPE,
   WORKFLOW_CONCURRENT_NODE_TYPE,
   WORKFLOW_DECISION_NODE_TYPE,
   WORKFLOW_DECISION_TABLE_NODE_TYPE,
   WORKFLOW_EDGE_TYPE,
   WORKFLOW_END_NODE_TYPE,
   WORKFLOW_EXCEPTION_NODE_TYPE,
   WORKFLOW_PROCESS_NODE_TYPE,
   WORKFLOW_SUBPROCESS_NODE_TYPE
} from '@crossmodel/protocol';
import { DiagramConfiguration, EdgeTypeHint, ServerLayoutKind, ShapeTypeHint, getDefaultMapping } from '@eclipse-glsp/server';
import { injectable } from 'inversify';

/**
 * 工作流程图配置 - 定义工作流程图的类型提示和布局配置
 * Workflow diagram configuration - defines type hints and layout configuration
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramConfiguration implements DiagramConfiguration {
   layoutKind = ServerLayoutKind.MANUAL;
   needsClientLayout = true;
   animatedUpdate = true;

   typeMapping = getDefaultMapping();

   shapeTypeHints: ShapeTypeHint[] = [
      // 基础节点类型
      {
         elementTypeId: WORKFLOW_BEGIN_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: false
      },
      {
         elementTypeId: WORKFLOW_END_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: false
      },
      {
         elementTypeId: WORKFLOW_EXCEPTION_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: false
      },
      {
         elementTypeId: WORKFLOW_PROCESS_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      {
         elementTypeId: WORKFLOW_DECISION_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: false
      },
      {
         elementTypeId: WORKFLOW_DECISION_TABLE_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      {
         elementTypeId: WORKFLOW_SUBPROCESS_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      {
         elementTypeId: WORKFLOW_CONCURRENT_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      {
         elementTypeId: WORKFLOW_AUTO_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      {
         elementTypeId: WORKFLOW_API_NODE_TYPE,
         deletable: true,
         reparentable: true,
         repositionable: true,
         resizable: true
      },
      // 泳道
      {
         elementTypeId: SWIMLANE_NODE_TYPE,
         deletable: true,
         reparentable: false,
         repositionable: true,
         resizable: true,
         containableElementTypeIds: [
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
         ]
      },
      // 并发节点
      {
         elementTypeId: CONCURRENT_START_NODE_TYPE,
         deletable: true,
         reparentable: false,
         repositionable: true,
         resizable: false
      },
      {
         elementTypeId: CONCURRENT_END_NODE_TYPE,
         deletable: true,
         reparentable: false,
         repositionable: true,
         resizable: false
      }
   ];

   edgeTypeHints: EdgeTypeHint[] = [
      {
         elementTypeId: WORKFLOW_EDGE_TYPE,
         deletable: true,
         repositionable: false,
         routable: true,
         sourceElementTypeIds: [
            WORKFLOW_BEGIN_NODE_TYPE,
            WORKFLOW_PROCESS_NODE_TYPE,
            WORKFLOW_DECISION_NODE_TYPE,
            WORKFLOW_DECISION_TABLE_NODE_TYPE,
            WORKFLOW_SUBPROCESS_NODE_TYPE,
            WORKFLOW_CONCURRENT_NODE_TYPE,
            WORKFLOW_AUTO_NODE_TYPE,
            WORKFLOW_API_NODE_TYPE,
            CONCURRENT_START_NODE_TYPE
         ],
         targetElementTypeIds: [
            WORKFLOW_END_NODE_TYPE,
            WORKFLOW_EXCEPTION_NODE_TYPE,
            WORKFLOW_PROCESS_NODE_TYPE,
            WORKFLOW_DECISION_NODE_TYPE,
            WORKFLOW_DECISION_TABLE_NODE_TYPE,
            WORKFLOW_SUBPROCESS_NODE_TYPE,
            WORKFLOW_CONCURRENT_NODE_TYPE,
            WORKFLOW_AUTO_NODE_TYPE,
            WORKFLOW_API_NODE_TYPE,
            CONCURRENT_END_NODE_TYPE
         ]
      },
      {
         elementTypeId: CONCURRENT_BRANCH_EDGE_TYPE,
         deletable: true,
         repositionable: false,
         routable: true,
         sourceElementTypeIds: [CONCURRENT_START_NODE_TYPE],
         targetElementTypeIds: [CONCURRENT_END_NODE_TYPE]
      }
   ];
}
