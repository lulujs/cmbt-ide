/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
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
import {
   Args,
   MaybePromise,
   PaletteItem,
   ToolPaletteItemProvider,
   TriggerEdgeCreationAction,
   TriggerNodeCreationAction
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';

/**
 * 工作流程工具面板提供器 - 提供工作流程图的工具面板项
 * Workflow tool palette provider - provides tool palette items for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowToolPaletteProvider extends ToolPaletteItemProvider {
   override getItems(_args?: Args): MaybePromise<PaletteItem[]> {
      const items = [
         {
            id: 'workflow-basic-nodes',
            label: '基础节点',
            sortString: 'B',
            actions: [],
            children: [
               {
                  id: 'workflow-begin-node',
                  label: '开始节点',
                  sortString: 'A',
                  icon: 'play-circle',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_BEGIN_NODE_TYPE)]
               },
               {
                  id: 'workflow-end-node',
                  label: '结束节点',
                  sortString: 'B',
                  icon: 'stop-circle',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_END_NODE_TYPE)]
               },
               {
                  id: 'workflow-exception-node',
                  label: '异常节点',
                  sortString: 'C',
                  icon: 'warning',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_EXCEPTION_NODE_TYPE)]
               },
               {
                  id: 'workflow-process-node',
                  label: '过程节点',
                  sortString: 'D',
                  icon: 'symbol-method',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_PROCESS_NODE_TYPE)]
               }
            ]
         },
         // 分支节点组
         {
            id: 'workflow-decision-nodes',
            label: '分支节点',
            sortString: 'C',
            actions: [],
            children: [
               {
                  id: 'workflow-decision-node',
                  label: '分支节点',
                  sortString: 'A',
                  icon: 'git-merge',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_DECISION_NODE_TYPE)]
               },
               {
                  id: 'workflow-decision-table-node',
                  label: '决策表节点',
                  sortString: 'B',
                  icon: 'table',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_DECISION_TABLE_NODE_TYPE)]
               }
            ]
         },
         // 高级节点组
         {
            id: 'workflow-advanced-nodes',
            label: '高级节点',
            sortString: 'D',
            actions: [],
            children: [
               {
                  id: 'workflow-subprocess-node',
                  label: '子流程节点',
                  sortString: 'A',
                  icon: 'symbol-namespace',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_SUBPROCESS_NODE_TYPE)]
               },
               {
                  id: 'workflow-concurrent-node',
                  label: '并发节点',
                  sortString: 'B',
                  icon: 'split-horizontal',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_CONCURRENT_NODE_TYPE)]
               },
               {
                  id: 'workflow-auto-node',
                  label: '自动化节点',
                  sortString: 'C',
                  icon: 'gear',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_AUTO_NODE_TYPE)]
               },
               {
                  id: 'workflow-api-node',
                  label: 'API节点',
                  sortString: 'D',
                  icon: 'plug',
                  actions: [TriggerNodeCreationAction.create(WORKFLOW_API_NODE_TYPE)]
               }
            ]
         },
         // 容器组
         {
            id: 'workflow-containers',
            label: '容器',
            sortString: 'E',
            actions: [],
            children: [
               {
                  id: 'workflow-swimlane',
                  label: '泳道',
                  sortString: 'A',
                  icon: 'layout',
                  actions: [TriggerNodeCreationAction.create(SWIMLANE_NODE_TYPE)]
               }
            ]
         },
         // 连接组
         {
            id: 'workflow-edges',
            label: '连接',
            sortString: 'F',
            actions: [],
            children: [
               {
                  id: 'workflow-edge',
                  label: '流程连接',
                  sortString: 'A',
                  icon: 'arrow-right',
                  actions: [TriggerEdgeCreationAction.create(WORKFLOW_EDGE_TYPE)]
               }
            ]
         }
      ];
      return items;
   }
}
