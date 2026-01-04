/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Args, GNode, IView, RenderingContext, ShapeView, svg } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';
import { VNode } from 'snabbdom';

const JSX = { createElement: svg };

/**
 * 引用节点模型
 * Reference node model
 */
export class ReferenceNodeModel extends GNode {
   static override readonly DEFAULT_FEATURES = GNode.DEFAULT_FEATURES;

   sourceNodeId?: string;
   isReference: boolean = true;

   constructor() {
      super();
   }
}

/**
 * 检查节点是否是引用节点
 * Check if a node is a reference node
 */
export function isReferenceNodeModel(element: unknown): element is ReferenceNodeModel {
   const args = (element as { args?: Args }).args;
   return args?.isReference === true || (element as ReferenceNodeModel).isReference === true;
}

/**
 * 获取引用节点的源节点ID
 * Get the source node ID for a reference node
 */
export function getSourceNodeId(element: unknown): string | undefined {
   const args = (element as { args?: Args }).args;
   return (args?.sourceNodeId as string | undefined) || (element as ReferenceNodeModel).sourceNodeId;
}

/**
 * 引用节点视图
 * Reference node view - 需求 4.1-4.5
 *
 * This view adds visual indicators to reference nodes:
 * - A reference icon/badge
 * - A dashed border to distinguish from regular nodes
 * - A link indicator showing the source node relationship
 */
@injectable()
export class ReferenceNodeView extends ShapeView implements IView {
   override render(node: Readonly<GNode>, context: RenderingContext): VNode | undefined {
      if (!this.isVisible(node, context)) {
         return undefined;
      }

      const isRef = isReferenceNodeModel(node);
      const sourceId = getSourceNodeId(node);

      // Base node rendering
      const nodeWidth = node.bounds?.width || 100;
      const nodeHeight = node.bounds?.height || 50;

      // Reference indicator badge
      const referenceBadge = isRef ? this.renderReferenceBadge(nodeWidth) : undefined;

      // Reference link indicator (small icon showing it's linked)
      const linkIndicator = isRef && sourceId ? this.renderLinkIndicator(nodeHeight) : undefined;

      return JSX.createElement(
         'g',
         { 'class-reference-node': isRef },
         JSX.createElement('rect', {
            'class-node-body': true,
            'class-reference': isRef,
            x: 0,
            y: 0,
            width: nodeWidth,
            height: nodeHeight,
            rx: 5,
            ry: 5,
            style: isRef ? { strokeDasharray: '5,3' } : {}
         }),
         referenceBadge,
         linkIndicator,
         ...context.renderChildren(node)
      );
   }

   /**
    * 渲染引用标记
    * Render reference badge
    */
   protected renderReferenceBadge(nodeWidth: number): VNode {
      const badgeSize = 16;
      const badgeX = nodeWidth - badgeSize - 4;
      const badgeY = 4;

      return JSX.createElement(
         'g',
         {
            'class-reference-badge': true,
            transform: `translate(${badgeX}, ${badgeY})`
         },
         JSX.createElement('circle', {
            cx: badgeSize / 2,
            cy: badgeSize / 2,
            r: badgeSize / 2,
            'class-badge-background': true
         }),
         JSX.createElement(
            'text',
            {
               x: badgeSize / 2,
               y: badgeSize / 2 + 4,
               'class-badge-icon': true,
               'text-anchor': 'middle',
               'font-size': '10'
            },
            '🔗'
         )
      );
   }

   /**
    * 渲染链接指示器
    * Render link indicator showing connection to source node
    */
   protected renderLinkIndicator(nodeHeight: number): VNode {
      const indicatorX = 4;
      const indicatorY = nodeHeight - 12;

      return JSX.createElement(
         'g',
         {
            'class-link-indicator': true,
            transform: `translate(${indicatorX}, ${indicatorY})`
         },
         JSX.createElement(
            'text',
            {
               'class-link-text': true,
               'font-size': '8',
               fill: '#666'
            },
            '↗ 引用'
         )
      );
   }
}

/**
 * 引用关系连线视图
 * Reference relationship edge view
 *
 * This view renders a visual connection between a reference node
 * and its source node (optional, can be toggled)
 */
@injectable()
export class ReferenceRelationshipView implements IView {
   render(_element: Readonly<GNode>, _context: RenderingContext): VNode | undefined {
      // This view is for rendering the relationship line between
      // a reference node and its source node
      // Implementation depends on whether we want to show these connections
      return undefined;
   }
}
