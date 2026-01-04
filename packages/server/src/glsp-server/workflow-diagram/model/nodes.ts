/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   SWIMLANE_COLOR,
   SWIMLANE_CONTENT_TYPE,
   SWIMLANE_HEADER_TYPE,
   SWIMLANE_LABEL_TYPE,
   SWIMLANE_NODE_TYPE,
   SWIMLANE_ORIENTATION,
   WORKFLOW_API_NODE_TYPE,
   WORKFLOW_AUTO_NODE_TYPE,
   WORKFLOW_BEGIN_NODE_TYPE,
   WORKFLOW_CONCURRENT_NODE_TYPE,
   WORKFLOW_DECISION_NODE_TYPE,
   WORKFLOW_DECISION_TABLE_NODE_TYPE,
   WORKFLOW_END_NODE_TYPE,
   WORKFLOW_EXCEPTION_NODE_TYPE,
   WORKFLOW_EXPECTED_VALUE_ARG,
   WORKFLOW_NODE_LABEL_TYPE,
   WORKFLOW_NODE_TYPE_ARG,
   WORKFLOW_PROCESS_NODE_TYPE,
   WORKFLOW_REFERENCE_PATH_ARG,
   WORKFLOW_SUBPROCESS_NODE_TYPE
} from '@crossmodel/protocol';
import { ArgsUtil, GCompartment, GLabel, GNode, GNodeBuilder } from '@eclipse-glsp/server';
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
   Swimlane,
   WorkflowNode
} from '../../../language-server/generated/ast.js';
import { WorkflowModelIndex } from './workflow-model-index.js';

/**
 * 创建节点头部标签
 * Create node header label
 */
function createNodeHeader(text: string, containerId: string, labelType = WORKFLOW_NODE_LABEL_TYPE): GCompartment {
   return GCompartment.builder()
      .id(`${containerId}_header`)
      .layout('hbox')
      .addLayoutOption('hAlign', 'center')
      .addLayoutOption('vAlign', 'center')
      .addLayoutOption('paddingTop', 5)
      .addLayoutOption('paddingBottom', 5)
      .addCssClass('workflow-node-header')
      .add(GLabel.builder().type(labelType).text(text).id(`${containerId}_label`).addCssClass('workflow-node-label').build())
      .build();
}

/**
 * 基础工作流程节点构建器
 * Base workflow node builder
 */
abstract class BaseWorkflowNodeBuilder<T extends GNode> extends GNodeBuilder<T> {
   protected setBaseProperties(node: WorkflowNode, index: WorkflowModelIndex): this {
      this.id(index.createId(node));
      this.addArg(WORKFLOW_NODE_TYPE_ARG, node.nodeType);

      // 设置位置
      if (node.position) {
         this.position(node.position.x, node.position.y);
      } else {
         this.position(100, 100);
      }

      return this;
   }
}

// ============= 开始节点 =============
export class GBeginNode extends GNode {
   override type = WORKFLOW_BEGIN_NODE_TYPE;

   static override builder(): GBeginNodeBuilder {
      return new GBeginNodeBuilder(GBeginNode).type(WORKFLOW_BEGIN_NODE_TYPE);
   }
}

export class GBeginNodeBuilder extends BaseWorkflowNodeBuilder<GBeginNode> {
   set(node: BeginNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'begin-node');
      this.size(60, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(30));
      this.add(createNodeHeader(node.name || '开始', this.proxy.id));
      return this;
   }
}

// ============= 结束节点 =============
export class GEndNode extends GNode {
   override type = WORKFLOW_END_NODE_TYPE;

   static override builder(): GEndNodeBuilder {
      return new GEndNodeBuilder(GEndNode).type(WORKFLOW_END_NODE_TYPE);
   }
}

export class GEndNodeBuilder extends BaseWorkflowNodeBuilder<GEndNode> {
   set(node: EndNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'end-node');
      this.size(60, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(30));
      this.add(createNodeHeader(node.name || '结束', this.proxy.id));
      if (node.expectedValue) {
         this.addArg(WORKFLOW_EXPECTED_VALUE_ARG, node.expectedValue);
      }
      return this;
   }
}

// ============= 异常节点 =============
export class GExceptionNode extends GNode {
   override type = WORKFLOW_EXCEPTION_NODE_TYPE;

   static override builder(): GExceptionNodeBuilder {
      return new GExceptionNodeBuilder(GExceptionNode).type(WORKFLOW_EXCEPTION_NODE_TYPE);
   }
}

export class GExceptionNodeBuilder extends BaseWorkflowNodeBuilder<GExceptionNode> {
   set(node: ExceptionNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'exception-node');
      this.size(60, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(30));
      this.add(createNodeHeader(node.name || '异常', this.proxy.id));
      if (node.expectedValue) {
         this.addArg(WORKFLOW_EXPECTED_VALUE_ARG, node.expectedValue);
      }
      return this;
   }
}

// ============= 过程节点 =============
export class GProcessNode extends GNode {
   override type = WORKFLOW_PROCESS_NODE_TYPE;

   static override builder(): GProcessNodeBuilder {
      return new GProcessNodeBuilder(GProcessNode).type(WORKFLOW_PROCESS_NODE_TYPE);
   }
}

export class GProcessNodeBuilder extends BaseWorkflowNodeBuilder<GProcessNode> {
   set(node: ProcessNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'process-node');
      this.size(120, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || '过程', this.proxy.id));
      return this;
   }
}

// ============= 分支节点 =============
export class GDecisionNode extends GNode {
   override type = WORKFLOW_DECISION_NODE_TYPE;

   static override builder(): GDecisionNodeBuilder {
      return new GDecisionNodeBuilder(GDecisionNode).type(WORKFLOW_DECISION_NODE_TYPE);
   }
}

export class GDecisionNodeBuilder extends BaseWorkflowNodeBuilder<GDecisionNode> {
   set(node: DecisionNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'decision-node');
      this.size(80, 80);
      this.layout('vbox');
      this.add(createNodeHeader(node.name || '分支', this.proxy.id));
      return this;
   }
}

// ============= 决策表节点 =============
export class GDecisionTableNode extends GNode {
   override type = WORKFLOW_DECISION_TABLE_NODE_TYPE;

   static override builder(): GDecisionTableNodeBuilder {
      return new GDecisionTableNodeBuilder(GDecisionTableNode).type(WORKFLOW_DECISION_TABLE_NODE_TYPE);
   }
}

export class GDecisionTableNodeBuilder extends BaseWorkflowNodeBuilder<GDecisionTableNode> {
   set(node: DecisionTableNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'decision-table-node');
      this.size(200, 120);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || '决策表', this.proxy.id));

      // 添加表格预览区域
      const tablePreview = GCompartment.builder()
         .id(`${this.proxy.id}_table_preview`)
         .layout('vbox')
         .addCssClass('decision-table-preview')
         .addLayoutOption('paddingLeft', 5)
         .addLayoutOption('paddingRight', 5)
         .build();
      this.add(tablePreview);

      return this;
   }
}

// ============= 子流程节点 =============
export class GSubprocessNode extends GNode {
   override type = WORKFLOW_SUBPROCESS_NODE_TYPE;

   static override builder(): GSubprocessNodeBuilder {
      return new GSubprocessNodeBuilder(GSubprocessNode).type(WORKFLOW_SUBPROCESS_NODE_TYPE);
   }
}

export class GSubprocessNodeBuilder extends BaseWorkflowNodeBuilder<GSubprocessNode> {
   set(node: SubprocessNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'subprocess-node');
      this.size(140, 80);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || '子流程', this.proxy.id));
      if (node.referencePath) {
         this.addArg(WORKFLOW_REFERENCE_PATH_ARG, node.referencePath);
      }
      return this;
   }
}

// ============= 并发节点 =============
export class GConcurrentNode extends GNode {
   override type = WORKFLOW_CONCURRENT_NODE_TYPE;

   static override builder(): GConcurrentNodeBuilder {
      return new GConcurrentNodeBuilder(GConcurrentNode).type(WORKFLOW_CONCURRENT_NODE_TYPE);
   }
}

export class GConcurrentNodeBuilder extends BaseWorkflowNodeBuilder<GConcurrentNode> {
   set(node: ConcurrentNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'concurrent-node');
      this.size(160, 100);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || '并发', this.proxy.id));
      return this;
   }
}

// ============= Auto节点 =============
export class GAutoNode extends GNode {
   override type = WORKFLOW_AUTO_NODE_TYPE;

   static override builder(): GAutoNodeBuilder {
      return new GAutoNodeBuilder(GAutoNode).type(WORKFLOW_AUTO_NODE_TYPE);
   }
}

export class GAutoNodeBuilder extends BaseWorkflowNodeBuilder<GAutoNode> {
   set(node: AutoNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'auto-node');
      this.size(120, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || '自动化', this.proxy.id));
      return this;
   }
}

// ============= API节点 =============
export class GApiNode extends GNode {
   override type = WORKFLOW_API_NODE_TYPE;

   static override builder(): GApiNodeBuilder {
      return new GApiNodeBuilder(GApiNode).type(WORKFLOW_API_NODE_TYPE);
   }
}

export class GApiNodeBuilder extends BaseWorkflowNodeBuilder<GApiNode> {
   set(node: ApiNode, index: WorkflowModelIndex): this {
      this.setBaseProperties(node, index);
      this.addCssClasses('workflow-node', 'api-node');
      this.size(120, 60);
      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(5));
      this.add(createNodeHeader(node.name || 'API', this.proxy.id));
      return this;
   }
}

// ============= 泳道节点 =============
export class GSwimlaneNode extends GNode {
   override type = SWIMLANE_NODE_TYPE;

   static override builder(): GSwimlaneNodeBuilder {
      return new GSwimlaneNodeBuilder(GSwimlaneNode).type(SWIMLANE_NODE_TYPE);
   }
}

export class GSwimlaneNodeBuilder extends GNodeBuilder<GSwimlaneNode> {
   set(swimlane: Swimlane, index: WorkflowModelIndex): this {
      this.id(index.createId(swimlane));
      this.addCssClasses('swimlane-node');
      this.size(swimlane.width || 400, swimlane.height || 300);

      if (swimlane.position) {
         this.position(swimlane.position.x, swimlane.position.y);
      } else {
         this.position(50, 50);
      }

      this.layout('vbox');

      // 添加泳道方向和颜色参数
      this.addArg(SWIMLANE_ORIENTATION, 'horizontal');
      if (swimlane.color) {
         this.addArg(SWIMLANE_COLOR, swimlane.color);
      }

      // 添加头部区域
      const header = GCompartment.builder()
         .id(`${this.proxy.id}_header`)
         .type(SWIMLANE_HEADER_TYPE)
         .layout('hbox')
         .addLayoutOption('hAlign', 'center')
         .addLayoutOption('vAlign', 'center')
         .addCssClass('swimlane-header')
         .add(
            GLabel.builder()
               .type(SWIMLANE_LABEL_TYPE)
               .text(swimlane.name || '泳道')
               .id(`${this.proxy.id}_label`)
               .addCssClass('swimlane-label')
               .build()
         )
         .build();
      this.add(header);

      // 添加内容区域
      const content = GCompartment.builder()
         .id(`${this.proxy.id}_content`)
         .type(SWIMLANE_CONTENT_TYPE)
         .layout('freeform')
         .addCssClass('swimlane-content')
         .addLayoutOption('hAlign', 'left')
         .addLayoutOption('vAlign', 'top')
         .build();
      this.add(content);

      return this;
   }
}
