/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Concurrent Process Model
 * 并发流程模型
 *
 * This module provides the GLSP model classes for concurrent process visualization.
 * It includes:
 * - ConcurrentStartNode: Visual representation of concurrent process start
 * - ConcurrentEndNode: Visual representation of concurrent process end
 * - ConcurrentContainerCompartment: Container for concurrent branches
 *
 * Requirements: 6.1-6.4
 ********************************************************************************/

import {
   CONCURRENT_BRANCH_COUNT,
   CONCURRENT_BRANCH_EDGE_TYPE,
   CONCURRENT_BRANCH_ID,
   CONCURRENT_CONTAINER_TYPE,
   CONCURRENT_END_NODE_TYPE,
   CONCURRENT_LABEL_TYPE,
   CONCURRENT_PROCESS_ID,
   CONCURRENT_START_NODE_TYPE
} from '@crossmodel/protocol';
import {
   Args,
   ArgsAware,
   BoundsAware,
   Dimension,
   EditableLabel,
   GChildElement,
   GCompartment,
   GEdge,
   GLabel,
   GModelElement,
   Hoverable,
   isEditableLabel,
   RectangularNode,
   Selectable,
   WithEditableLabel
} from '@eclipse-glsp/client';
import { findElementBy } from './swimlane-model';

/**
 * 并发开始节点 - 并发流程的起点
 * Concurrent start node - entry point of concurrent process
 * 需求 6.1: 内部节点从并发开始流向并发结束
 */
export class ConcurrentStartNode extends RectangularNode implements WithEditableLabel, ArgsAware {
   static readonly DEFAULT_WIDTH = 60;
   static readonly DEFAULT_HEIGHT = 60;

   args?: Args;

   /**
    * 获取并发流程ID
    * Get concurrent process ID
    */
   get processId(): string | undefined {
      return this.args?.[CONCURRENT_PROCESS_ID] as string | undefined;
   }

   /**
    * 获取分支数量
    * Get branch count
    */
   get branchCount(): number {
      return (this.args?.[CONCURRENT_BRANCH_COUNT] as number) ?? 2;
   }

   /**
    * 获取可编辑标签
    * Get editable label
    */
   get editableLabel(): (GChildElement & EditableLabel) | undefined {
      return findElementBy(this, isEditableLabel) as (GChildElement & EditableLabel) | undefined;
   }

   /**
    * 检查是否为并发开始节点
    * Check if element is a concurrent start node
    */
   static is(element?: GModelElement): element is ConcurrentStartNode {
      return !!element && element.type === CONCURRENT_START_NODE_TYPE;
   }
}

/**
 * 并发结束节点 - 并发流程的终点
 * Concurrent end node - exit point of concurrent process
 * 需求 6.1: 内部节点从并发开始流向并发结束
 */
export class ConcurrentEndNode extends RectangularNode implements WithEditableLabel, ArgsAware {
   static readonly DEFAULT_WIDTH = 60;
   static readonly DEFAULT_HEIGHT = 60;

   args?: Args;

   /**
    * 获取并发流程ID
    * Get concurrent process ID
    */
   get processId(): string | undefined {
      return this.args?.[CONCURRENT_PROCESS_ID] as string | undefined;
   }

   /**
    * 获取可编辑标签
    * Get editable label
    */
   get editableLabel(): (GChildElement & EditableLabel) | undefined {
      return findElementBy(this, isEditableLabel) as (GChildElement & EditableLabel) | undefined;
   }

   /**
    * 检查是否为并发结束节点
    * Check if element is a concurrent end node
    */
   static is(element?: GModelElement): element is ConcurrentEndNode {
      return !!element && element.type === CONCURRENT_END_NODE_TYPE;
   }
}

/**
 * 并发容器区域 - 包含并发分支的容器
 * Concurrent container compartment - holds concurrent branches
 */
export class ConcurrentContainerCompartment extends GCompartment implements Hoverable, Selectable {
   hoverFeedback: boolean = false;
   selected: boolean = false;

   /**
    * 检查点是否在容器区域内
    * Check if point is within container bounds
    */
   containsPoint(x: number, y: number): boolean {
      const bounds = this.bounds;
      return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
   }

   static is(element?: GModelElement): element is ConcurrentContainerCompartment {
      return !!element && element.type === CONCURRENT_CONTAINER_TYPE;
   }
}

/**
 * 并发分支边 - 连接并发开始/结束节点与分支节点
 * Concurrent branch edge - connects concurrent start/end nodes with branch nodes
 */
export class ConcurrentBranchEdge extends GEdge implements ArgsAware {
   override args?: Args;

   /**
    * 获取分支ID
    * Get branch ID
    */
   get branchId(): string | undefined {
      return this.args?.[CONCURRENT_BRANCH_ID] as string | undefined;
   }

   /**
    * 检查是否为并发分支边
    * Check if element is a concurrent branch edge
    */
   static is(element?: GModelElement): element is ConcurrentBranchEdge {
      return !!element && element.type === CONCURRENT_BRANCH_EDGE_TYPE;
   }
}

/**
 * 并发标签 - 可编辑的并发节点名称
 * Concurrent label - editable concurrent node name
 */
export class ConcurrentLabel extends GLabel implements EditableLabel {
   override text: string = '';

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

   static is(element?: GModelElement): element is ConcurrentLabel {
      return !!element && element.type === CONCURRENT_LABEL_TYPE;
   }
}

/**
 * 检查节点是否为并发流程的一部分
 * Check if node is part of a concurrent process
 */
export function isNodeInConcurrentProcess(node: GModelElement): boolean {
   let parent: GModelElement | undefined = (node as any).parent;
   while (parent) {
      if (ConcurrentContainerCompartment.is(parent) || ConcurrentStartNode.is(parent) || ConcurrentEndNode.is(parent)) {
         return true;
      }
      parent = (parent as any).parent;
   }
   return false;
}

/**
 * 获取节点所属的并发流程ID
 * Get the concurrent process ID that contains the node
 */
export function getConcurrentProcessId(node: GModelElement): string | undefined {
   if (ConcurrentStartNode.is(node)) {
      return node.processId;
   }
   if (ConcurrentEndNode.is(node)) {
      return node.processId;
   }

   let parent: GModelElement | undefined = (node as any).parent;
   while (parent) {
      if (ConcurrentStartNode.is(parent)) {
         return parent.processId;
      }
      if (ConcurrentEndNode.is(parent)) {
         return parent.processId;
      }
      parent = (parent as any).parent;
   }
   return undefined;
}

/**
 * 检查两个节点是否属于同一个并发流程
 * Check if two nodes belong to the same concurrent process
 */
export function areNodesInSameConcurrentProcess(node1: GModelElement, node2: GModelElement): boolean {
   const processId1 = getConcurrentProcessId(node1);
   const processId2 = getConcurrentProcessId(node2);
   return processId1 !== undefined && processId1 === processId2;
}
