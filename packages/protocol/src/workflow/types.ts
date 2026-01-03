/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程节点类型枚举
 * Workflow node type enumeration
 */
export enum NodeType {
   BEGIN = 'begin',
   END = 'end',
   EXCEPTION = 'exception',
   PROCESS = 'process',
   DECISION = 'decision',
   DECISION_TABLE = 'decision_table',
   SUBPROCESS = 'subprocess',
   CONCURRENT = 'concurrent',
   AUTO = 'auto',
   API = 'api'
}

/**
 * 节点位置接口
 * Node position interface
 */
export interface Position {
   x: number;
   y: number;
}

/**
 * 测试数据接口
 * Test data interface
 */
export interface TestData {
   id: string;
   name: string;
   inputData: Record<string, unknown>;
   expectedOutput: Record<string, unknown>;
   edgeBinding: string; // 绑定到特定输出边
}

/**
 * 自动化动作类型
 * Automation action type
 */
export type AutomationActionType = 'api_call' | 'script' | 'webhook';

/**
 * 自动化动作接口
 * Automation action interface
 */
export interface AutomationAction {
   id: string;
   name: string;
   actionType: AutomationActionType;
   configuration: Record<string, unknown>;
   edgeBinding: string; // 绑定到特定输出边
}
