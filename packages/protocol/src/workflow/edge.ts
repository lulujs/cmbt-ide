/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { AutomationAction, TestData } from './types';

/**
 * 工作流程边接口
 * Workflow edge interface
 */
export interface WorkflowEdge {
   id: string;
   source: string; // 源节点ID
   target: string; // 目标节点ID
   condition?: string; // 条件表达式
   value?: string; // 边的值（用于分支节点）
   dataType?: string; // 数据类型
   testData?: TestData[];
   automationActions?: AutomationAction[];
}

/**
 * 边属性接口
 * Edge properties interface
 */
export interface EdgeProperties {
   condition?: string;
   value?: string;
   dataType?: string;
}

/**
 * 创建边的参数接口
 * Create edge parameters interface
 */
export interface CreateEdgeParams {
   source: string;
   target: string;
   properties?: EdgeProperties;
}

/**
 * 验证边的唯一性
 * Validate edge value uniqueness for decision nodes
 */
export function validateEdgeValueUniqueness(edges: WorkflowEdge[]): boolean {
   const values = edges.map(e => e.value).filter((v): v is string => v !== undefined);
   const uniqueValues = new Set(values);
   return values.length === uniqueValues.size;
}

/**
 * 获取节点的出边数量
 * Get outgoing edge count for a node
 */
export function getOutgoingEdgeCount(edges: WorkflowEdge[], nodeId: string): number {
   return edges.filter(e => e.source === nodeId).length;
}

/**
 * 获取节点的入边数量
 * Get incoming edge count for a node
 */
export function getIncomingEdgeCount(edges: WorkflowEdge[], nodeId: string): number {
   return edges.filter(e => e.target === nodeId).length;
}
