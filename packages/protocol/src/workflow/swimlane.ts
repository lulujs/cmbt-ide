/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Position } from './types';

/**
 * 泳道属性接口
 * Swimlane properties interface
 */
export interface SwimlaneProperties {
   description?: string;
   color?: string;
   [key: string]: unknown;
}

/**
 * 泳道接口 - 可容纳节点的容器
 * Swimlane interface - container that can hold nodes
 */
export interface Swimlane {
   id: string;
   name: string;
   position: Position;
   size: {
      width: number;
      height: number;
   };
   properties: SwimlaneProperties;
   containedNodes: string[]; // 包含的节点ID列表
}

/**
 * 创建泳道参数接口
 * Create swimlane parameters interface
 */
export interface CreateSwimlaneParams {
   name: string;
   position?: Position;
   size?: { width: number; height: number };
   properties?: SwimlaneProperties;
}

/**
 * 创建泳道
 * Create swimlane
 */
export function createSwimlane(
   id: string,
   params: CreateSwimlaneParams
): Swimlane {
   return {
      id,
      name: params.name,
      position: params.position ?? { x: 0, y: 0 },
      size: params.size ?? { width: 400, height: 300 },
      properties: params.properties ?? {},
      containedNodes: []
   };
}

/**
 * 将节点添加到泳道
 * Add node to swimlane
 */
export function addNodeToSwimlane(swimlane: Swimlane, nodeId: string): Swimlane {
   if (!swimlane.containedNodes.includes(nodeId)) {
      return {
         ...swimlane,
         containedNodes: [...swimlane.containedNodes, nodeId]
      };
   }
   return swimlane;
}

/**
 * 从泳道移除节点
 * Remove node from swimlane
 */
export function removeNodeFromSwimlane(swimlane: Swimlane, nodeId: string): Swimlane {
   return {
      ...swimlane,
      containedNodes: swimlane.containedNodes.filter(id => id !== nodeId)
   };
}

/**
 * 检查节点是否在泳道中
 * Check if node is in swimlane
 */
export function isNodeInSwimlane(swimlane: Swimlane, nodeId: string): boolean {
   return swimlane.containedNodes.includes(nodeId);
}

/**
 * 获取节点所属的泳道
 * Get swimlane that contains the node
 */
export function findSwimlaneForNode(swimlanes: Swimlane[], nodeId: string): Swimlane | undefined {
   return swimlanes.find(swimlane => swimlane.containedNodes.includes(nodeId));
}
