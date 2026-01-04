/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { WORKFLOW_EDGE_LABEL_TYPE, WORKFLOW_EDGE_TYPE } from '@crossmodel/protocol';
import { ArgsUtil, GEdge, GEdgeBuilder, GLabel } from '@eclipse-glsp/server';
import { WorkflowEdge } from '../../../language-server/generated/ast.js';
import { WorkflowModelIndex } from './workflow-model-index.js';

/**
 * 工作流程边 - 连接工作流程节点
 * Workflow edge - connects workflow nodes
 * 需求 8.2: 提供可视化的流程图编辑器
 */
export class GWorkflowEdge extends GEdge {
   override type = WORKFLOW_EDGE_TYPE;

   static override builder(): GWorkflowEdgeBuilder {
      return new GWorkflowEdgeBuilder(GWorkflowEdge).type(WORKFLOW_EDGE_TYPE);
   }
}

export class GWorkflowEdgeBuilder extends GEdgeBuilder<GWorkflowEdge> {
   set(edge: WorkflowEdge, index: WorkflowModelIndex): this {
      if (!edge) {
         return this;
      }

      this.id(index.createId(edge));
      this.addCssClasses('workflow-edge');
      this.addArgs(ArgsUtil.edgePadding(5));
      this.routerKind('libavoid');

      // 设置源节点和目标节点
      const sourceId = index.createId(edge.source?.ref);
      const targetId = index.createId(edge.target?.ref);

      this.sourceId(sourceId || '');
      this.targetId(targetId || '');

      // 添加条件标签（如果有）
      if (edge.condition || edge.edgeValue) {
         const labelText = edge.edgeValue || edge.condition || '';
         this.add(
            GLabel.builder()
               .type(WORKFLOW_EDGE_LABEL_TYPE)
               .id(`${this.proxy.id}_label`)
               .text(labelText)
               .addCssClass('workflow-edge-label')
               .build()
         );
      }

      // 添加边的值作为参数
      if (edge.edgeValue) {
         this.addArg('edgeValue', edge.edgeValue);
      }
      if (edge.condition) {
         this.addArg('condition', edge.condition);
      }
      if (edge.dataType) {
         this.addArg('dataType', edge.dataType);
      }

      return this;
   }
}
