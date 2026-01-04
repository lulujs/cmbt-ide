/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   SWIMLANE_COLOR,
   SWIMLANE_CONTENT_TYPE,
   SWIMLANE_HEADER_TYPE,
   SWIMLANE_LABEL_TYPE,
   SWIMLANE_NODE_TYPE,
   SWIMLANE_ORIENTATION
} from '@crossmodel/protocol';
import {
   Args,
   ArgsAware,
   BoundsAware,
   Dimension,
   EditableLabel,
   GChildElement,
   GCompartment,
   GLabel,
   GModelElement,
   GParentElement,
   Hoverable,
   isEditableLabel,
   isParent,
   ModelFilterPredicate,
   RectangularNode,
   Selectable,
   WithEditableLabel
} from '@eclipse-glsp/client';

/**
 * 泳道方向类型
 * Swimlane orientation type
 */
export type SwimlaneOrientation = 'horizontal' | 'vertical';

/**
 * 泳道节点 - 可容纳其他节点的容器
 * Swimlane node - container that can hold other nodes
 * 需求 3.1: 创建一个可容纳节点的泳道容器
 */
export class SwimlaneNode extends RectangularNode implements WithEditableLabel, ArgsAware {
   static readonly DEFAULT_WIDTH = 400;
   static readonly DEFAULT_HEIGHT = 300;
   static readonly HEADER_HEIGHT = 30;

   args?: Args;

   /**
    * 获取泳道方向
    * Get swimlane orientation
    */
   get orientation(): SwimlaneOrientation {
      return (this.args?.[SWIMLANE_ORIENTATION] as SwimlaneOrientation) ?? 'horizontal';
   }

   /**
    * 获取泳道颜色
    * Get swimlane color
    */
   get color(): string | undefined {
      return this.args?.[SWIMLANE_COLOR] as string | undefined;
   }

   /**
    * 获取可编辑标签
    * Get editable label
    */
   get editableLabel(): (GChildElement & EditableLabel) | undefined {
      return findElementBy(this, isEditableLabel) as (GChildElement & EditableLabel) | undefined;
   }

   /**
    * 获取泳道头部区域
    * Get swimlane header compartment
    */
   get header(): SwimlaneHeaderCompartment | undefined {
      return this.children.find(child => child instanceof SwimlaneHeaderCompartment) as SwimlaneHeaderCompartment | undefined;
   }

   /**
    * 获取泳道内容区域
    * Get swimlane content compartment
    */
   get content(): SwimlaneContentCompartment | undefined {
      return this.children.find(child => child instanceof SwimlaneContentCompartment) as SwimlaneContentCompartment | undefined;
   }

   /**
    * 获取包含的节点ID列表
    * Get contained node IDs
    */
   get containedNodeIds(): string[] {
      const content = this.content;
      if (content) {
         return content.children.map(child => child.id);
      }
      return [];
   }

   /**
    * 检查是否为泳道节点
    * Check if element is a swimlane node
    */
   static is(element?: GModelElement): element is SwimlaneNode {
      return !!element && element.type === SWIMLANE_NODE_TYPE;
   }
}

/**
 * 泳道头部区域 - 显示泳道名称
 * Swimlane header compartment - displays swimlane name
 */
export class SwimlaneHeaderCompartment extends GCompartment implements Hoverable, Selectable {
   hoverFeedback: boolean = false;
   selected: boolean = false;

   static is(element?: GModelElement): element is SwimlaneHeaderCompartment {
      return !!element && element.type === SWIMLANE_HEADER_TYPE;
   }
}

/**
 * 泳道内容区域 - 容纳节点
 * Swimlane content compartment - holds nodes
 * 需求 3.2: 将节点归属到该泳道
 */
export class SwimlaneContentCompartment extends GCompartment implements Hoverable, Selectable {
   hoverFeedback: boolean = false;
   selected: boolean = false;

   /**
    * 检查点是否在内容区域内
    * Check if point is within content bounds
    */
   containsPoint(x: number, y: number): boolean {
      const bounds = this.bounds;
      return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
   }

   static is(element?: GModelElement): element is SwimlaneContentCompartment {
      return !!element && element.type === SWIMLANE_CONTENT_TYPE;
   }
}

/**
 * 泳道标签 - 可编辑的泳道名称
 * Swimlane label - editable swimlane name
 */
export class SwimlaneLabel extends GLabel implements EditableLabel {
   editControlPositionCorrection = {
      x: -5,
      y: -3
   };

   get editControlDimension(): Dimension {
      const parentBounds = (this.parent as any as BoundsAware).bounds;
      return {
         width: parentBounds?.width ? parentBounds.width - 10 : this.bounds.width,
         height: parentBounds?.height ? parentBounds.height : 24
      };
   }

   static is(element?: GModelElement): element is SwimlaneLabel {
      return !!element && element.type === SWIMLANE_LABEL_TYPE;
   }
}

/**
 * 在父元素中查找符合条件的元素
 * Find element in parent that matches predicate
 */
export function findElementBy<T>(parent: GParentElement, predicate: ModelFilterPredicate<T>): (GModelElement & T) | undefined {
   if (predicate(parent)) {
      return parent;
   }
   if (isParent(parent)) {
      for (const child of parent.children) {
         const result = findElementBy(child, predicate);
         if (result !== undefined) {
            return result;
         }
      }
   }
   return undefined;
}

/**
 * 检查节点是否在泳道内
 * Check if node is inside a swimlane
 */
export function isNodeInSwimlane(node: GModelElement): boolean {
   let parent: GModelElement | undefined = (node as any).parent;
   while (parent) {
      if (SwimlaneContentCompartment.is(parent) || SwimlaneNode.is(parent)) {
         return true;
      }
      parent = (parent as any).parent;
   }
   return false;
}

/**
 * 获取节点所属的泳道
 * Get the swimlane that contains the node
 */
export function getContainingSwimlane(node: GModelElement): SwimlaneNode | undefined {
   let parent: GModelElement | undefined = (node as any).parent;
   while (parent) {
      if (SwimlaneNode.is(parent)) {
         return parent;
      }
      if (SwimlaneContentCompartment.is(parent)) {
         parent = (parent as any).parent;
         if (SwimlaneNode.is(parent)) {
            return parent;
         }
      }
      parent = (parent as any).parent;
   }
   return undefined;
}
