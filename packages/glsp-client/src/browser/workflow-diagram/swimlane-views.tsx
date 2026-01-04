/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/** @jsx svg */
/* eslint-disable react/no-unknown-property */
/* eslint-disable max-len */

import { GCompartmentView, GNode, Hoverable, RenderingContext, Selectable, ShapeView, svg } from '@eclipse-glsp/client';
import { ReactNode } from '@theia/core/shared/react';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { SwimlaneContentCompartment, SwimlaneHeaderCompartment, SwimlaneNode } from './swimlane-model';

/**
 * 泳道节点视图
 * Swimlane node view - 需求 3.1: 创建泳道的图形表示
 */
@injectable()
export class SwimlaneNodeView extends ShapeView {
   override render(node: Readonly<SwimlaneNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }

      const { width, height } = node.bounds;
      const orientation = node.orientation;
      const color = node.color ?? 'var(--theia-editor-background)';
      const headerHeight = SwimlaneNode.HEADER_HEIGHT;

      // 根据方向确定头部位置
      const isHorizontal = orientation === 'horizontal';

      const vnode: any = (
         <g
            class-swimlane-node={true}
            class-selected={node.selected}
            class-mouseover={node.hoverFeedback}
            class-horizontal={isHorizontal}
            class-vertical={!isHorizontal}
         >
            {/* 泳道背景 */}
            <rect
               class-swimlane-background={true}
               x={0}
               y={0}
               width={Math.max(width, 0)}
               height={Math.max(height, 0)}
               rx={4}
               ry={4}
               style={{ fill: color, fillOpacity: '0.1' }}
            />

            {/* 泳道边框 */}
            <rect
               class-swimlane-border={true}
               x={0}
               y={0}
               width={Math.max(width, 0)}
               height={Math.max(height, 0)}
               rx={4}
               ry={4}
               style={{
                  fill: 'none',
                  stroke: node.selected ? 'var(--theia-focusBorder)' : 'var(--theia-panel-border)',
                  strokeWidth: node.selected ? '2' : '1'
               }}
            />

            {/* 头部分隔线 */}
            {isHorizontal ? (
               <line
                  class-swimlane-header-separator={true}
                  x1={0}
                  y1={headerHeight}
                  x2={width}
                  y2={headerHeight}
                  style={{
                     stroke: 'var(--theia-panel-border)',
                     strokeWidth: '1'
                  }}
               />
            ) : (
               <line
                  class-swimlane-header-separator={true}
                  x1={headerHeight}
                  y1={0}
                  x2={headerHeight}
                  y2={height}
                  style={{
                     stroke: 'var(--theia-panel-border)',
                     strokeWidth: '1'
                  }}
               />
            )}

            {/* 渲染子元素 */}
            {context.renderChildren(node) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 泳道头部视图
 * Swimlane header view
 */
@injectable()
export class SwimlaneHeaderView extends GCompartmentView {
   override render(compartment: Readonly<SwimlaneHeaderCompartment>, context: RenderingContext): VNode | undefined {
      const translate = `translate(${compartment.bounds.x}, ${compartment.bounds.y})`;

      const vnode: any = (
         <g
            transform={translate}
            class-swimlane-header={true}
            class-mouseover={compartment.hoverFeedback}
            class-selected={compartment.selected}
         >
            <rect
               class-swimlane-header-background={true}
               x={0}
               y={0}
               width={Math.max(compartment.size.width, 0)}
               height={Math.max(compartment.size.height, 0)}
               style={{
                  fill: 'var(--theia-editor-background)',
                  fillOpacity: '0.5'
               }}
            />
            {context.renderChildren(compartment) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 泳道内容区域视图
 * Swimlane content view - 需求 3.2: 实现拖拽节点到泳道的功能
 */
@injectable()
export class SwimlaneContentView extends GCompartmentView {
   override render(compartment: Readonly<SwimlaneContentCompartment>, context: RenderingContext): VNode | undefined {
      const translate = `translate(${compartment.bounds.x}, ${compartment.bounds.y})`;

      const vnode: any = (
         <g
            transform={translate}
            class-swimlane-content={true}
            class-mouseover={compartment.hoverFeedback}
            class-selected={compartment.selected}
         >
            {/* 内容区域背景（用于拖放目标检测） */}
            <rect
               class-swimlane-content-background={true}
               x={0}
               y={0}
               width={Math.max(compartment.size.width, 0)}
               height={Math.max(compartment.size.height, 0)}
               style={{
                  fill: 'transparent',
                  pointerEvents: 'all'
               }}
            />
            {context.renderChildren(compartment) as ReactNode}
         </g>
      );

      return vnode;
   }
}

/**
 * 泳道标签视图
 * Swimlane label view
 */
@injectable()
export class SwimlaneLabelView extends ShapeView {
   override render(label: Readonly<GNode & Hoverable & Selectable>, context: RenderingContext): VNode | undefined {
      const vnode: any = (
         <text class-swimlane-label={true} class-selected={label.selected}>
            {(label as any).text}
         </text>
      );

      return vnode;
   }
}
