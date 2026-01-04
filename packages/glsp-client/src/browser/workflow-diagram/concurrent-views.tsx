/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Concurrent Process Views
 * 并发流程视图
 *
 * This module provides the GLSP view components for concurrent process visualization.
 * It includes:
 * - ConcurrentStartNodeView: Visual rendering of concurrent start node
 * - ConcurrentEndNodeView: Visual rendering of concurrent end node
 * - ConcurrentBranchEdgeView: Visual rendering of concurrent branch edges
 *
 * Requirements: 6.1-6.4
 ********************************************************************************/
/** @jsx svg */
/* eslint-disable react/no-unknown-property */
/* eslint-disable max-len */

import {
   GCompartmentView,
   GEdge,
   Hoverable,
   Point,
   PolylineEdgeView,
   RenderingContext,
   Selectable,
   ShapeView,
   svg
} from '@eclipse-glsp/client';
import { ReactNode } from '@theia/core/shared/react';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { ConcurrentContainerCompartment, ConcurrentEndNode, ConcurrentLabel, ConcurrentStartNode } from './concurrent-model';

/**
 * 并发开始节点视图
 * Concurrent start node view - 需求 6.1: 创建并发流程的特殊图形表示
 *
 * Visual representation: A diamond shape with a "+" symbol inside,
 * indicating the start of parallel execution branches.
 */
@injectable()
export class ConcurrentStartNodeView extends ShapeView {
   override render(node: Readonly<ConcurrentStartNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }

      const { width, height } = node.bounds;
      const centerX = width / 2;
      const centerY = height / 2;

      // Diamond shape points
      const diamondPath = `M ${centerX} 0 L ${width} ${centerY} L ${centerX} ${height} L 0 ${centerY} Z`;

      // Plus symbol inside
      const plusSize = Math.min(width, height) * 0.3;
      const plusPath = `M ${centerX - plusSize} ${centerY} L ${centerX + plusSize} ${centerY} M ${centerX} ${centerY - plusSize} L ${centerX} ${centerY + plusSize}`;

      const vnode: any = (
         <g class-concurrent-start-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            {/* Diamond background */}
            <path
               class-concurrent-start-background={true}
               d={diamondPath}
               style={{
                  fill: 'var(--theia-editor-background)',
                  stroke: node.selected ? 'var(--theia-focusBorder)' : 'var(--theia-charts-green)',
                  strokeWidth: node.selected ? '2' : '1.5'
               }}
            />

            {/* Plus symbol */}
            <path
               class-concurrent-start-symbol={true}
               d={plusPath}
               style={{
                  fill: 'none',
                  stroke: 'var(--theia-charts-green)',
                  strokeWidth: '2',
                  strokeLinecap: 'round'
               }}
            />

            {/* Render children (labels, etc.) */}
            {context.renderChildren(node) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 并发结束节点视图
 * Concurrent end node view - 需求 6.1: 创建并发流程的特殊图形表示
 *
 * Visual representation: A diamond shape with a "×" symbol inside,
 * indicating the synchronization point where parallel branches merge.
 */
@injectable()
export class ConcurrentEndNodeView extends ShapeView {
   override render(node: Readonly<ConcurrentEndNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }

      const { width, height } = node.bounds;
      const centerX = width / 2;
      const centerY = height / 2;

      // Diamond shape points
      const diamondPath = `M ${centerX} 0 L ${width} ${centerY} L ${centerX} ${height} L 0 ${centerY} Z`;

      // X symbol inside (synchronization symbol)
      const xSize = Math.min(width, height) * 0.25;
      const xPath = `M ${centerX - xSize} ${centerY - xSize} L ${centerX + xSize} ${centerY + xSize} M ${centerX + xSize} ${centerY - xSize} L ${centerX - xSize} ${centerY + xSize}`;

      const vnode: any = (
         <g class-concurrent-end-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}>
            {/* Diamond background */}
            <path
               class-concurrent-end-background={true}
               d={diamondPath}
               style={{
                  fill: 'var(--theia-editor-background)',
                  stroke: node.selected ? 'var(--theia-focusBorder)' : 'var(--theia-charts-orange)',
                  strokeWidth: node.selected ? '2' : '1.5'
               }}
            />

            {/* X symbol (synchronization) */}
            <path
               class-concurrent-end-symbol={true}
               d={xPath}
               style={{
                  fill: 'none',
                  stroke: 'var(--theia-charts-orange)',
                  strokeWidth: '2',
                  strokeLinecap: 'round'
               }}
            />

            {/* Render children (labels, etc.) */}
            {context.renderChildren(node) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 并发容器视图
 * Concurrent container view - 需求 6.1: 实现并发分支的可视化编辑
 *
 * Visual representation: A dashed rectangle that contains the concurrent branches.
 */
@injectable()
export class ConcurrentContainerView extends GCompartmentView {
   override render(compartment: Readonly<ConcurrentContainerCompartment>, context: RenderingContext): VNode | undefined {
      const translate = `translate(${compartment.bounds.x}, ${compartment.bounds.y})`;

      const vnode: any = (
         <g
            transform={translate}
            class-concurrent-container={true}
            class-mouseover={compartment.hoverFeedback}
            class-selected={compartment.selected}
         >
            {/* Container background with dashed border */}
            <rect
               class-concurrent-container-background={true}
               x={0}
               y={0}
               width={Math.max(compartment.size.width, 0)}
               height={Math.max(compartment.size.height, 0)}
               rx={4}
               ry={4}
               style={{
                  fill: 'var(--theia-editor-background)',
                  fillOpacity: '0.3',
                  stroke: 'var(--theia-panel-border)',
                  strokeWidth: '1',
                  strokeDasharray: '5,5'
               }}
            />
            {context.renderChildren(compartment) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 并发分支边视图
 * Concurrent branch edge view - 需求 6.1: 实现并发分支的可视化编辑
 *
 * Visual representation: A dashed line connecting concurrent start/end nodes
 * with branch nodes, indicating parallel execution paths.
 */
@injectable()
export class ConcurrentBranchEdgeView extends PolylineEdgeView {
   protected override renderLine(edge: GEdge, segments: Point[], context: RenderingContext): VNode {
      const path = this.createPathForSegments(segments);

      const vnode: any = (
         <path
            class-concurrent-branch-edge={true}
            d={path}
            style={{
               fill: 'none',
               stroke: 'var(--theia-charts-blue)',
               strokeWidth: '1.5',
               strokeDasharray: '4,2'
            }}
         />
      );

      return vnode;
   }

   protected createPathForSegments(segments: Point[]): string {
      if (segments.length === 0) {
         return '';
      }

      const firstPoint = segments[0];
      let path = `M ${firstPoint.x},${firstPoint.y}`;
      for (let i = 1; i < segments.length; i++) {
         const p = segments[i];
         path += ` L ${p.x},${p.y}`;
      }
      return path;
   }

   protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
      const additionals: VNode[] = [];

      // Add arrow at the end
      if (segments.length >= 2) {
         const lastSegment = segments[segments.length - 1];
         const secondLastSegment = segments[segments.length - 2];
         const arrow = this.renderArrow(secondLastSegment, lastSegment);
         if (arrow) {
            additionals.push(arrow);
         }
      }

      return additionals;
   }

   protected renderArrow(from: Point, to: Point): VNode | undefined {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
         return undefined;
      }

      const unitX = dx / length;
      const unitY = dy / length;

      const arrowSize = 8;
      const arrowAngle = Math.PI / 6; // 30 degrees

      const arrowPoint1X = to.x - arrowSize * (unitX * Math.cos(arrowAngle) - unitY * Math.sin(arrowAngle));
      const arrowPoint1Y = to.y - arrowSize * (unitY * Math.cos(arrowAngle) + unitX * Math.sin(arrowAngle));
      const arrowPoint2X = to.x - arrowSize * (unitX * Math.cos(arrowAngle) + unitY * Math.sin(arrowAngle));
      const arrowPoint2Y = to.y - arrowSize * (unitY * Math.cos(arrowAngle) - unitX * Math.sin(arrowAngle));

      const arrowPath = `M ${to.x},${to.y} L ${arrowPoint1X},${arrowPoint1Y} M ${to.x},${to.y} L ${arrowPoint2X},${arrowPoint2Y}`;

      const vnode: any = (
         <path
            class-concurrent-branch-arrow={true}
            d={arrowPath}
            style={{
               fill: 'none',
               stroke: 'var(--theia-charts-blue)',
               strokeWidth: '1.5'
            }}
         />
      );

      return vnode;
   }
}

/**
 * 并发标签视图
 * Concurrent label view
 */
@injectable()
export class ConcurrentLabelView extends ShapeView {
   override render(label: Readonly<ConcurrentLabel & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      const vnode: any = (
         <text
            class-concurrent-label={true}
            class-selected={label.selected}
            style={{
               fill: 'var(--theia-foreground)',
               fontSize: '12px',
               textAnchor: 'middle',
               dominantBaseline: 'middle'
            }}
         >
            {label.text}
         </text>
      );

      return vnode;
   }
}
