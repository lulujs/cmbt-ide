/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { NodeProperties, WorkflowNode } from './node';
import { NodeType, Position } from './types';

/**
 * 决策表列接口
 * Decision table column interface
 */
export interface Column {
   id: string;
   name: string;
   dataType: string;
}

/**
 * 决策表行接口
 * Decision table row interface
 */
export interface TableRow {
   id: string;
   values: Record<string, unknown>;
}

/**
 * 决策表数据接口
 * Decision table data interface
 */
export interface DecisionTableData {
   inputColumns: Column[];
   outputColumns: Column[];
   decisionColumns: Column[];
   rows: TableRow[];
}

/**
 * 决策表节点接口 - 类似Excel表格的节点，包含输出列
 * Decision table node interface - Excel-like table node with output columns
 */
export interface DecisionTableNode extends WorkflowNode {
   type: NodeType.DECISION_TABLE;
   tableData: DecisionTableData;
}

/**
 * 创建默认的决策表数据
 * Create default decision table data
 */
export function createDefaultDecisionTableData(): DecisionTableData {
   return {
      inputColumns: [
         { id: 'input1', name: 'Input 1', dataType: 'string' }
      ],
      outputColumns: [
         { id: 'output1', name: 'Output 1', dataType: 'string' }
      ],
      decisionColumns: [
         { id: 'decision1', name: 'Decision 1', dataType: 'string' }
      ],
      rows: [
         { id: 'row1', values: { input1: '', output1: '', decision1: '' } }
      ]
   };
}

/**
 * 创建决策表节点
 * Create decision table node
 */
export function createDecisionTableNode(
   id: string,
   name: string,
   position: Position,
   properties: NodeProperties = {},
   tableData?: DecisionTableData
): DecisionTableNode {
   return {
      id,
      type: NodeType.DECISION_TABLE,
      name,
      position,
      properties,
      tableData: tableData ?? createDefaultDecisionTableData()
   };
}

/**
 * 验证决策表数据
 * Validate decision table data
 */
export interface DecisionTableValidationResult {
   isValid: boolean;
   errors: string[];
}

/**
 * 验证决策表数据
 * Validate decision table data
 */
export function validateDecisionTableData(data: DecisionTableData): DecisionTableValidationResult {
   const errors: string[] = [];

   // 检查是否有决策列
   if (data.decisionColumns.length === 0) {
      errors.push('决策表必须包含至少一个决策列');
   }

   // 检查是否有输出列
   if (data.outputColumns.length === 0) {
      errors.push('决策表必须包含至少一个输出列');
   }

   // 检查决策列内容是否完全相同
   if (data.rows.length > 1) {
      const decisionColumnIds = data.decisionColumns.map(c => c.id);
      const decisionValues = data.rows.map(row =>
         decisionColumnIds.map(colId => JSON.stringify(row.values[colId])).join('|')
      );

      const uniqueDecisionValues = new Set(decisionValues);
      if (uniqueDecisionValues.size !== decisionValues.length) {
         errors.push('决策表的决策列内容不能完全相同');
      }
   }

   return {
      isValid: errors.length === 0,
      errors
   };
}

/**
 * 从决策表数据生成输出边值
 * Generate output edge values from decision table data
 */
export function generateOutputEdgeValues(data: DecisionTableData): string[] {
   const outputColumnIds = data.outputColumns.map(c => c.id);
   const uniqueOutputValues = new Set<string>();

   for (const row of data.rows) {
      for (const colId of outputColumnIds) {
         const value = row.values[colId];
         if (value !== undefined && value !== null && value !== '') {
            uniqueOutputValues.add(String(value));
         }
      }
   }

   return Array.from(uniqueOutputValues);
}

/**
 * 类型守卫函数
 * Type guard function
 */
export function isDecisionTableNode(node: WorkflowNode): node is DecisionTableNode {
   return node.type === NodeType.DECISION_TABLE;
}
