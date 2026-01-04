/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/** @jsx svg */
/* eslint-disable react/no-unknown-property */
/* eslint-disable max-len */

import {
   GGraph,
   GGraphView,
   GLabelView,
   Hoverable,
   IViewArgs,
   PolylineEdgeView,
   RenderingContext,
   Selectable,
   ShapeView,
   svg
} from '@eclipse-glsp/client';
import { ReactNode } from '@theia/core/shared/react';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
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

/**
 * 工作流程图视图 - 渲染整个工作流程图
 * Workflow graph view - renders the entire workflow diagram
 */
@injectable()
export class WorkflowGraphView extends GGraphView {
   override render(model: Readonly<GGraph>, context: RenderingContext): VNode {
      const edgeRouting = this.edgeRouterRegistry.routeAllChildren(model);
      const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
      const graph: any = (
         <svg class-sprotty-graph={true}>
            <g transform={transform}>{context.renderChildren(model, { edgeRouting }) as ReactNode}</g>
         </svg>
      );
      return graph;
   }
}

/**
 * 开始节点视图
 * Begin node view
 */
@injectable()
export class WorkflowBeginNodeView extends ShapeView {
   override render(node: Readonly<WorkflowBeginNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const radius = Math.min(node.size.width, node.size.height) / 2;
      const vnode: any = (
         <g class-workflow-node={true} class-begin-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <circle cx={radius} cy={radius} r={radius} class-node-circle={true} style={{ fill: '#4CAF50', stroke: '#388E3C' }} />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 结束节点视图
 * End node view
 */
@injectable()
export class WorkflowEndNodeView extends ShapeView {
   override render(node: Readonly<WorkflowEndNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const radius = Math.min(node.size.width, node.size.height) / 2;
      const vnode: any = (
         <g class-workflow-node={true} class-end-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <circle cx={radius} cy={radius} r={radius} class-node-circle={true} style={{ fill: '#F44336', stroke: '#D32F2F' }} />
            <circle cx={radius} cy={radius} r={radius - 5} class-node-inner-circle={true} style={{ fill: '#D32F2F' }} />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 异常节点视图
 * Exception node view
 */
@injectable()
export class WorkflowExceptionNodeView extends ShapeView {
   override render(node: Readonly<WorkflowExceptionNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const radius = Math.min(node.size.width, node.size.height) / 2;
      const vnode: any = (
         <g class-workflow-node={true} class-exception-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <circle cx={radius} cy={radius} r={radius} class-node-circle={true} style={{ fill: '#FF9800', stroke: '#F57C00' }} />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 过程节点视图
 * Process node view
 */
@injectable()
export class WorkflowProcessNodeView extends ShapeView {
   override render(node: Readonly<WorkflowProcessNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-process-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#2196F3', stroke: '#1976D2' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 分支节点视图 - 菱形
 * Decision node view - diamond shape
 */
@injectable()
export class WorkflowDecisionNodeView extends ShapeView {
   override render(node: Readonly<WorkflowDecisionNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const halfWidth = node.size.width / 2;
      const halfHeight = node.size.height / 2;
      const points = `${halfWidth},0 ${node.size.width},${halfHeight} ${halfWidth},${node.size.height} 0,${halfHeight}`;
      const vnode: any = (
         <g class-workflow-node={true} class-decision-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <polygon points={points} class-node-diamond={true} style={{ fill: '#9C27B0', stroke: '#7B1FA2' }} />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 决策表节点视图
 * Decision table node view
 */
@injectable()
export class WorkflowDecisionTableNodeView extends ShapeView {
   override render(node: Readonly<WorkflowDecisionTableNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-decision-table-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#673AB7', stroke: '#512DA8' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 子流程节点视图
 * Subprocess node view
 */
@injectable()
export class WorkflowSubprocessNodeView extends ShapeView {
   override render(node: Readonly<WorkflowSubprocessNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-subprocess-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#00BCD4', stroke: '#0097A7' }}
            />
            <rect
               x={node.size.width / 2 - 10}
               y={node.size.height - 15}
               width={20}
               height={10}
               class-subprocess-marker={true}
               style={{ fill: '#0097A7' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 并发节点视图
 * Concurrent node view
 */
@injectable()
export class WorkflowConcurrentNodeView extends ShapeView {
   override render(node: Readonly<WorkflowConcurrentNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-concurrent-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#009688', stroke: '#00796B' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * Auto节点视图
 * Auto node view
 */
@injectable()
export class WorkflowAutoNodeView extends ShapeView {
   override render(node: Readonly<WorkflowAutoNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-auto-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#607D8B', stroke: '#455A64' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * API节点视图
 * API node view
 */
@injectable()
export class WorkflowApiNodeView extends ShapeView {
   override render(node: Readonly<WorkflowApiNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }
      const vnode: any = (
         <g class-workflow-node={true} class-api-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            <rect
               x={0}
               y={0}
               width={node.size.width}
               height={node.size.height}
               rx={5}
               ry={5}
               class-node-rect={true}
               style={{ fill: '#795548', stroke: '#5D4037' }}
            />
            {context.renderChildren(node) as ReactNode}
         </g>
      );
      return vnode;
   }
}

/**
 * 工作流程边视图
 * Workflow edge view
 */
@injectable()
export class WorkflowEdgeView extends PolylineEdgeView {
   protected override renderLine(edge: WorkflowEdge, segments: any[], _context: RenderingContext): VNode {
      const firstPoint = segments[0];
      let path = `M ${firstPoint.x},${firstPoint.y}`;
      for (let i = 1; i < segments.length; i++) {
         const p = segments[i];
         path += ` L ${p.x},${p.y}`;
      }
      return <path class-workflow-edge={true} d={path} style={{ stroke: '#666', strokeWidth: '2', fill: 'none' }} />;
   }
}

/**
 * 工作流程节点标签视图
 * Workflow node label view
 */
@injectable()
export class WorkflowNodeLabelView extends GLabelView {
   override render(label: Readonly<WorkflowNodeLabel>, _context: RenderingContext, _args?: IViewArgs): VNode | undefined {
      return (
         <text class-workflow-node-label={true} style={{ fill: 'white', textAnchor: 'middle' }}>
            {label.text}
         </text>
      );
   }
}

/**
 * 工作流程边标签视图
 * Workflow edge label view
 */
@injectable()
export class WorkflowEdgeLabelView extends GLabelView {
   override render(label: Readonly<WorkflowEdgeLabel>, _context: RenderingContext, _args?: IViewArgs): VNode | undefined {
      return (
         <text class-workflow-edge-label={true} style={{ fill: '#666' }}>
            {label.text}
         </text>
      );
   }
}
