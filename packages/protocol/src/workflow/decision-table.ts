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
   dataType: 'string' | 'number' | 'boolean' | 'date';
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
 * 需求 2.1: 决策表节点提供默认的决策表数据
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
 * 需求 1.7: 决策表节点类似Excel表格，包含输出列
 */
export interface DecisionTableNode extends WorkflowNode {
   type: NodeType.DECISION_TABLE;
   tableData: DecisionTableData;
}

/**
 * 决策表验证结果接口
 * Decision table validation result interface
 */
export interface DecisionTableValidationResult {
   isValid: boolean;
   errors: string[];
   warnings?: string[];
   duplicateRowIndices?: number[];
}

/**
 * 决策表导入结果接口
 * Decision table import result interface
 */
export interface DecisionTableImportResult {
   success: boolean;
   data?: DecisionTableData;
   errors: string[];
   generatedEdgeValues: string[];
}

/**
 * 决策表导出格式
 * Decision table export format
 */
export type DecisionTableExportFormat = 'json' | 'csv';

/**
 * 决策表管理器创建参数
 * Decision table manager creation parameters
 */
export interface DecisionTableCreateParams {
   id: string;
   name: string;
   position: Position;
   properties?: NodeProperties;
   tableData?: DecisionTableData;
}

/**
 * 创建默认的决策表数据
 * Create default decision table data
 * 需求 2.1: 创建决策表节点时提供默认的决策表数据
 */
export function createDefaultDecisionTableData(): DecisionTableData {
   return {
      inputColumns: [{ id: 'input1', name: 'Input 1', dataType: 'string' }],
      outputColumns: [{ id: 'output1', name: 'Output 1', dataType: 'string' }],
      decisionColumns: [{ id: 'decision1', name: 'Decision 1', dataType: 'string' }],
      rows: [{ id: 'row1', values: { input1: '', output1: '', decision1: '' } }]
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
 * 需求 2.3: 验证决策列内容不能完全相同
 * 需求 2.4: 决策表缺少决策内容列时阻止保存
 * 需求 2.5: 决策列内容完全相同时阻止保存
 */
export function validateDecisionTableData(data: DecisionTableData): DecisionTableValidationResult {
   const errors: string[] = [];
   const warnings: string[] = [];
   const duplicateRowIndices: number[] = [];

   // 需求 2.4: 检查是否有决策列
   if (data.decisionColumns.length === 0) {
      errors.push('决策表必须包含至少一个决策列 (Decision table must have at least one decision column)');
   }

   // 检查是否有输出列
   if (data.outputColumns.length === 0) {
      errors.push('决策表必须包含至少一个输出列 (Decision table must have at least one output column)');
   }

   // 检查是否有行数据
   if (data.rows.length === 0) {
      warnings.push('决策表没有数据行 (Decision table has no data rows)');
   }

   // 需求 2.3, 2.5: 检查决策列内容是否完全相同
   if (data.rows.length > 1 && data.decisionColumns.length > 0) {
      const decisionColumnIds = data.decisionColumns.map(c => c.id);
      const decisionValueMap = new Map<string, number[]>();

      data.rows.forEach((row, index) => {
         const decisionKey = decisionColumnIds.map(colId => JSON.stringify(row.values[colId] ?? '')).join('|');

         if (!decisionValueMap.has(decisionKey)) {
            decisionValueMap.set(decisionKey, []);
         }
         decisionValueMap.get(decisionKey)!.push(index);
      });

      // 找出重复的行
      for (const [, indices] of decisionValueMap) {
         if (indices.length > 1) {
            duplicateRowIndices.push(...indices);
         }
      }

      if (duplicateRowIndices.length > 0) {
         errors.push('决策表的决策列内容不能完全相同 (Decision column values cannot be identical across rows)');
      }
   }

   // 验证列ID唯一性
   const allColumnIds = [...data.inputColumns.map(c => c.id), ...data.outputColumns.map(c => c.id), ...data.decisionColumns.map(c => c.id)];
   const uniqueColumnIds = new Set(allColumnIds);
   if (uniqueColumnIds.size !== allColumnIds.length) {
      errors.push('列ID必须唯一 (Column IDs must be unique)');
   }

   // 验证行ID唯一性
   const rowIds = data.rows.map(r => r.id);
   const uniqueRowIds = new Set(rowIds);
   if (uniqueRowIds.size !== rowIds.length) {
      errors.push('行ID必须唯一 (Row IDs must be unique)');
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      duplicateRowIndices: duplicateRowIndices.length > 0 ? duplicateRowIndices : undefined
   };
}

/**
 * 从决策表数据生成输出边值
 * Generate output edge values from decision table data
 * 需求 2.2: 根据输出字段值创建相应的出边
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
 * 决策表管理器
 * Decision table manager
 * 需求 2.1-2.5: 决策表功能的完整管理
 */
export class DecisionTableManager {
   private static rowIdCounter = 0;
   private static columnIdCounter = 0;
   protected node: DecisionTableNode;

   constructor(params: DecisionTableCreateParams) {
      this.node = {
         id: params.id,
         type: NodeType.DECISION_TABLE,
         name: params.name,
         position: params.position,
         properties: params.properties || {},
         tableData: params.tableData ?? createDefaultDecisionTableData()
      };
   }

   /**
    * 重置ID计数器
    * Reset ID counters
    */
   static resetIdCounters(): void {
      this.rowIdCounter = 0;
      this.columnIdCounter = 0;
   }

   /**
    * 生成唯一的行ID
    * Generate unique row ID
    */
   static generateRowId(): string {
      return `row_${++this.rowIdCounter}`;
   }

   /**
    * 生成唯一的列ID
    * Generate unique column ID
    */
   static generateColumnId(prefix: string = 'col'): string {
      return `${prefix}_${++this.columnIdCounter}`;
   }

   /**
    * 获取节点
    * Get the node
    */
   getNode(): DecisionTableNode {
      return this.node;
   }

   /**
    * 更新节点属性
    * Update node properties
    */
   updateProperties(properties: Partial<NodeProperties>): void {
      this.node.properties = { ...this.node.properties, ...properties };
   }

   /**
    * 更新节点位置
    * Update node position
    */
   updatePosition(position: Position): void {
      this.node.position = position;
   }

   /**
    * 更新节点名称
    * Update node name
    */
   updateName(name: string): void {
      this.node.name = name;
   }

   /**
    * 获取决策表数据
    * Get decision table data
    */
   getTableData(): DecisionTableData {
      return this.node.tableData;
   }

   /**
    * 设置决策表数据
    * Set decision table data
    */
   setTableData(data: DecisionTableData): DecisionTableValidationResult {
      const validation = validateDecisionTableData(data);
      if (validation.isValid) {
         this.node.tableData = data;
      }
      return validation;
   }

   /**
    * 添加输入列
    * Add input column
    */
   addInputColumn(name: string, dataType: Column['dataType'] = 'string'): Column {
      const column: Column = {
         id: DecisionTableManager.generateColumnId('input'),
         name,
         dataType
      };
      this.node.tableData.inputColumns.push(column);

      // 为所有行添加该列的默认值
      for (const row of this.node.tableData.rows) {
         row.values[column.id] = '';
      }

      return column;
   }

   /**
    * 添加输出列
    * Add output column
    */
   addOutputColumn(name: string, dataType: Column['dataType'] = 'string'): Column {
      const column: Column = {
         id: DecisionTableManager.generateColumnId('output'),
         name,
         dataType
      };
      this.node.tableData.outputColumns.push(column);

      // 为所有行添加该列的默认值
      for (const row of this.node.tableData.rows) {
         row.values[column.id] = '';
      }

      return column;
   }

   /**
    * 添加决策列
    * Add decision column
    */
   addDecisionColumn(name: string, dataType: Column['dataType'] = 'string'): Column {
      const column: Column = {
         id: DecisionTableManager.generateColumnId('decision'),
         name,
         dataType
      };
      this.node.tableData.decisionColumns.push(column);

      // 为所有行添加该列的默认值
      for (const row of this.node.tableData.rows) {
         row.values[column.id] = '';
      }

      return column;
   }

   /**
    * 删除列
    * Remove column
    */
   removeColumn(columnId: string): boolean {
      const data = this.node.tableData;

      // 尝试从各列类型中删除
      let removed = false;

      const inputIndex = data.inputColumns.findIndex(c => c.id === columnId);
      if (inputIndex > -1) {
         data.inputColumns.splice(inputIndex, 1);
         removed = true;
      }

      const outputIndex = data.outputColumns.findIndex(c => c.id === columnId);
      if (outputIndex > -1) {
         data.outputColumns.splice(outputIndex, 1);
         removed = true;
      }

      const decisionIndex = data.decisionColumns.findIndex(c => c.id === columnId);
      if (decisionIndex > -1) {
         data.decisionColumns.splice(decisionIndex, 1);
         removed = true;
      }

      // 从所有行中删除该列的值
      if (removed) {
         for (const row of data.rows) {
            delete row.values[columnId];
         }
      }

      return removed;
   }

   /**
    * 添加行
    * Add row
    */
   addRow(values?: Record<string, unknown>): TableRow {
      const allColumns = [
         ...this.node.tableData.inputColumns,
         ...this.node.tableData.outputColumns,
         ...this.node.tableData.decisionColumns
      ];

      const defaultValues: Record<string, unknown> = {};
      for (const col of allColumns) {
         defaultValues[col.id] = values?.[col.id] ?? '';
      }

      const row: TableRow = {
         id: DecisionTableManager.generateRowId(),
         values: defaultValues
      };

      this.node.tableData.rows.push(row);
      return row;
   }

   /**
    * 删除行
    * Remove row
    */
   removeRow(rowId: string): boolean {
      const index = this.node.tableData.rows.findIndex(r => r.id === rowId);
      if (index > -1) {
         this.node.tableData.rows.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 更新单元格值
    * Update cell value
    */
   updateCellValue(rowId: string, columnId: string, value: unknown): boolean {
      const row = this.node.tableData.rows.find(r => r.id === rowId);
      if (row) {
         row.values[columnId] = value;
         return true;
      }
      return false;
   }

   /**
    * 获取单元格值
    * Get cell value
    */
   getCellValue(rowId: string, columnId: string): unknown {
      const row = this.node.tableData.rows.find(r => r.id === rowId);
      return row?.values[columnId];
   }

   /**
    * 导入CSV数据
    * Import CSV data
    * 需求 2.2: 导入决策表数据时根据输出字段值创建相应的出边
    */
   importFromCSV(csvContent: string, hasHeader: boolean = true): DecisionTableImportResult {
      try {
         const lines = csvContent
            .trim()
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

         if (lines.length === 0) {
            return {
               success: false,
               errors: ['CSV内容为空 (CSV content is empty)'],
               generatedEdgeValues: []
            };
         }

         // 解析CSV行
         const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
               const char = line[i];
               if (char === '"') {
                  inQuotes = !inQuotes;
               } else if (char === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
               } else {
                  current += char;
               }
            }
            result.push(current.trim());
            return result;
         };

         const parsedLines = lines.map(parseCSVLine);

         let headers: string[];
         let dataStartIndex: number;

         if (hasHeader) {
            headers = parsedLines[0];
            dataStartIndex = 1;
         } else {
            // 自动生成列名
            const columnCount = parsedLines[0].length;
            headers = Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
            dataStartIndex = 0;
         }

         if (headers.length < 2) {
            return {
               success: false,
               errors: ['CSV必须至少包含2列（输入和输出）(CSV must have at least 2 columns)'],
               generatedEdgeValues: []
            };
         }

         // 创建列结构：假设最后一列是输出列，倒数第二列是决策列，其余是输入列
         const inputColumns: Column[] = [];
         const outputColumns: Column[] = [];
         const decisionColumns: Column[] = [];

         DecisionTableManager.resetIdCounters();

         for (let i = 0; i < headers.length; i++) {
            const column: Column = {
               id: DecisionTableManager.generateColumnId(
                  i === headers.length - 1 ? 'output' : i === headers.length - 2 ? 'decision' : 'input'
               ),
               name: headers[i],
               dataType: 'string'
            };

            if (i === headers.length - 1) {
               outputColumns.push(column);
            } else if (i === headers.length - 2) {
               decisionColumns.push(column);
            } else {
               inputColumns.push(column);
            }
         }

         // 创建行数据
         const rows: TableRow[] = [];
         const allColumns = [...inputColumns, ...decisionColumns, ...outputColumns];

         for (let i = dataStartIndex; i < parsedLines.length; i++) {
            const lineValues = parsedLines[i];
            const rowValues: Record<string, unknown> = {};

            for (let j = 0; j < allColumns.length && j < lineValues.length; j++) {
               rowValues[allColumns[j].id] = lineValues[j];
            }

            rows.push({
               id: DecisionTableManager.generateRowId(),
               values: rowValues
            });
         }

         const importedData: DecisionTableData = {
            inputColumns,
            outputColumns,
            decisionColumns,
            rows
         };

         // 验证导入的数据
         const validation = validateDecisionTableData(importedData);
         if (!validation.isValid) {
            return {
               success: false,
               errors: validation.errors,
               generatedEdgeValues: []
            };
         }

         // 生成输出边值
         const generatedEdgeValues = generateOutputEdgeValues(importedData);

         // 设置数据
         this.node.tableData = importedData;

         return {
            success: true,
            data: importedData,
            errors: [],
            generatedEdgeValues
         };
      } catch (error) {
         return {
            success: false,
            errors: [`导入失败: ${error instanceof Error ? error.message : String(error)}`],
            generatedEdgeValues: []
         };
      }
   }

   /**
    * 导入JSON数据
    * Import JSON data
    */
   importFromJSON(jsonContent: string): DecisionTableImportResult {
      try {
         const data = JSON.parse(jsonContent) as DecisionTableData;

         // 验证数据结构
         if (!data.inputColumns || !data.outputColumns || !data.decisionColumns || !data.rows) {
            return {
               success: false,
               errors: ['JSON数据结构无效 (Invalid JSON data structure)'],
               generatedEdgeValues: []
            };
         }

         // 验证数据
         const validation = validateDecisionTableData(data);
         if (!validation.isValid) {
            return {
               success: false,
               errors: validation.errors,
               generatedEdgeValues: []
            };
         }

         // 生成输出边值
         const generatedEdgeValues = generateOutputEdgeValues(data);

         // 设置数据
         this.node.tableData = data;

         return {
            success: true,
            data,
            errors: [],
            generatedEdgeValues
         };
      } catch (error) {
         return {
            success: false,
            errors: [`JSON解析失败: ${error instanceof Error ? error.message : String(error)}`],
            generatedEdgeValues: []
         };
      }
   }

   /**
    * 导出为CSV
    * Export to CSV
    */
   exportToCSV(): string {
      const data = this.node.tableData;
      const allColumns = [...data.inputColumns, ...data.decisionColumns, ...data.outputColumns];

      // 生成表头
      const headers = allColumns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(',');

      // 生成数据行
      const rows = data.rows.map(row => {
         return allColumns
            .map(col => {
               const value = row.values[col.id];
               const strValue = value === undefined || value === null ? '' : String(value);
               return `"${strValue.replace(/"/g, '""')}"`;
            })
            .join(',');
      });

      return [headers, ...rows].join('\n');
   }

   /**
    * 导出为JSON
    * Export to JSON
    */
   exportToJSON(): string {
      return JSON.stringify(this.node.tableData, null, 2);
   }

   /**
    * 获取生成的输出边值
    * Get generated output edge values
    * 需求 2.2: 根据输出字段值创建相应的出边
    */
   getGeneratedEdgeValues(): string[] {
      return generateOutputEdgeValues(this.node.tableData);
   }

   /**
    * 验证决策表节点
    * Validate decision table node
    * 属性 7: 决策表节点默认数据
    * 属性 8: 决策表数据导入边创建
    * 属性 9: 决策表决策列唯一性
    */
   validate(): DecisionTableValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.node.name || this.node.name.trim() === '') {
         warnings.push('决策表节点应该有一个名称 (Decision table node should have a name)');
      }

      // 验证决策表数据
      const tableValidation = validateDecisionTableData(this.node.tableData);
      errors.push(...tableValidation.errors);
      if (tableValidation.warnings) {
         warnings.push(...tableValidation.warnings);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined,
         duplicateRowIndices: tableValidation.duplicateRowIndices
      };
   }
}

/**
 * 类型守卫函数
 * Type guard function
 */
export function isDecisionTableNode(node: WorkflowNode): node is DecisionTableNode {
   return node.type === NodeType.DECISION_TABLE;
}
