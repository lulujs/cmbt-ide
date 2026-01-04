/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Decision Table Editor Component
 * 决策表编辑器组件
 *
 * 需求 2.1-2.5: 决策表功能实现
 * - 创建类似 Excel 的表格编辑组件
 * - 实现数据导入和编辑功能
 * - 添加实时验证和错误提示
 ********************************************************************************/

import {
   Column,
   DecisionTableData,
   DecisionTableManager,
   DecisionTableValidationResult,
   TableRow,
   validateDecisionTableData
} from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { Column as PrimeColumn } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Toolbar } from 'primereact/toolbar';
import * as React from 'react';

/**
 * Decision Table Editor Props
 */
export interface DecisionTableEditorProps {
   /** Initial decision table data */
   data: DecisionTableData;
   /** Callback when data changes */
   onChange: (data: DecisionTableData, generatedEdgeValues: string[]) => void;
   /** Whether the editor is readonly */
   readonly?: boolean;
   /** Custom class name */
   className?: string;
}

/**
 * Data type options for columns
 */
const dataTypeOptions = [
   { label: 'String', value: 'string' },
   { label: 'Number', value: 'number' },
   { label: 'Boolean', value: 'boolean' },
   { label: 'Date', value: 'date' }
];

/**
 * Column type options
 */
const columnTypeOptions = [
   { label: 'Input', value: 'input' },
   { label: 'Decision', value: 'decision' },
   { label: 'Output', value: 'output' }
];

/**
 * Decision Table Editor Component
 * 决策表编辑器组件
 */
export function DecisionTableEditor({ data, onChange, readonly = false, className }: DecisionTableEditorProps): React.ReactElement {
   const [tableData, setTableData] = React.useState<DecisionTableData>(data);
   const [validation, setValidation] = React.useState<DecisionTableValidationResult>({ isValid: true, errors: [] });
   const [editingRows, setEditingRows] = React.useState<Record<string, boolean>>({});
   const [showAddColumnDialog, setShowAddColumnDialog] = React.useState(false);
   const [showImportDialog, setShowImportDialog] = React.useState(false);
   const [newColumnName, setNewColumnName] = React.useState('');
   const [newColumnType, setNewColumnType] = React.useState<'input' | 'decision' | 'output'>('input');
   const [newColumnDataType, setNewColumnDataType] = React.useState<Column['dataType']>('string');
   const [importContent, setImportContent] = React.useState('');
   const [importFormat, setImportFormat] = React.useState<'csv' | 'json'>('csv');

   // Validate data whenever it changes
   React.useEffect(() => {
      const result = validateDecisionTableData(tableData);
      setValidation(result);
   }, [tableData]);

   // Notify parent of changes
   const notifyChange = React.useCallback(
      (newData: DecisionTableData) => {
         setTableData(newData);
         const manager = new DecisionTableManager({
            id: 'temp',
            name: 'temp',
            position: { x: 0, y: 0 },
            tableData: newData
         });
         onChange(newData, manager.getGeneratedEdgeValues());
      },
      [onChange]
   );

   // Get all columns in display order
   const allColumns = React.useMemo(() => {
      return [...tableData.inputColumns, ...tableData.decisionColumns, ...tableData.outputColumns];
   }, [tableData]);

   // Add a new row
   const handleAddRow = React.useCallback(() => {
      const newRowId = `row_${Date.now()}`;
      const values: Record<string, unknown> = {};
      allColumns.forEach(col => {
         values[col.id] = '';
      });

      const newRow: TableRow = { id: newRowId, values };
      const newData = { ...tableData, rows: [...tableData.rows, newRow] };
      notifyChange(newData);
   }, [tableData, allColumns, notifyChange]);

   // Delete a row
   const handleDeleteRow = React.useCallback(
      (rowId: string) => {
         confirmDialog({
            message: '确定要删除这一行吗？(Are you sure you want to delete this row?)',
            header: '确认删除 (Confirm Delete)',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
               const newData = { ...tableData, rows: tableData.rows.filter(r => r.id !== rowId) };
               notifyChange(newData);
            }
         });
      },
      [tableData, notifyChange]
   );

   // Add a new column
   const handleAddColumn = React.useCallback(() => {
      if (!newColumnName.trim()) {
         return;
      }

      const newColumn: Column = {
         id: `${newColumnType}_${Date.now()}`,
         name: newColumnName,
         dataType: newColumnDataType
      };

      const newData = { ...tableData };

      // Add column to appropriate array
      switch (newColumnType) {
         case 'input':
            newData.inputColumns = [...tableData.inputColumns, newColumn];
            break;
         case 'decision':
            newData.decisionColumns = [...tableData.decisionColumns, newColumn];
            break;
         case 'output':
            newData.outputColumns = [...tableData.outputColumns, newColumn];
            break;
      }

      // Add default value to all rows
      newData.rows = tableData.rows.map(row => ({
         ...row,
         values: { ...row.values, [newColumn.id]: '' }
      }));

      notifyChange(newData);
      setShowAddColumnDialog(false);
      setNewColumnName('');
      setNewColumnType('input');
      setNewColumnDataType('string');
   }, [newColumnName, newColumnType, newColumnDataType, tableData, notifyChange]);

   // Delete a column
   const handleDeleteColumn = React.useCallback(
      (columnId: string) => {
         confirmDialog({
            message: '确定要删除这一列吗？(Are you sure you want to delete this column?)',
            header: '确认删除 (Confirm Delete)',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
               const newData = {
                  ...tableData,
                  inputColumns: tableData.inputColumns.filter(c => c.id !== columnId),
                  decisionColumns: tableData.decisionColumns.filter(c => c.id !== columnId),
                  outputColumns: tableData.outputColumns.filter(c => c.id !== columnId),
                  rows: tableData.rows.map(row => {
                     const newValues = { ...row.values };
                     delete newValues[columnId];
                     return { ...row, values: newValues };
                  })
               };
               notifyChange(newData);
            }
         });
      },
      [tableData, notifyChange]
   );

   // Handle cell edit
   const handleRowEditComplete = React.useCallback(
      (e: DataTableRowEditCompleteEvent) => {
         const { newData: editedRow, index } = e;
         const newRows = [...tableData.rows];
         newRows[index] = editedRow as TableRow;
         notifyChange({ ...tableData, rows: newRows });
      },
      [tableData, notifyChange]
   );

   // Handle import
   const handleImport = React.useCallback(() => {
      const manager = new DecisionTableManager({
         id: 'temp',
         name: 'temp',
         position: { x: 0, y: 0 }
      });

      let result;
      if (importFormat === 'csv') {
         result = manager.importFromCSV(importContent);
      } else {
         result = manager.importFromJSON(importContent);
      }

      if (result.success && result.data) {
         notifyChange(result.data);
         setShowImportDialog(false);
         setImportContent('');
      } else {
         // Show error message
         confirmDialog({
            message: result.errors.join('\n'),
            header: '导入失败 (Import Failed)',
            icon: 'pi pi-times-circle',
            acceptLabel: '确定 (OK)',
            rejectClassName: 'hidden'
         });
      }
   }, [importContent, importFormat, notifyChange]);

   // Handle file upload
   const handleFileUpload = React.useCallback((event: FileUploadHandlerEvent) => {
      const file = event.files[0];
      const reader = new FileReader();
      reader.onload = e => {
         const content = e.target?.result as string;
         setImportContent(content);
         // Auto-detect format
         if (file.name.endsWith('.json')) {
            setImportFormat('json');
         } else {
            setImportFormat('csv');
         }
      };
      reader.readAsText(file);
   }, []);

   // Export to CSV
   const handleExportCSV = React.useCallback(() => {
      const manager = new DecisionTableManager({
         id: 'temp',
         name: 'temp',
         position: { x: 0, y: 0 },
         tableData
      });
      const csv = manager.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'decision_table.csv';
      link.click();
   }, [tableData]);

   // Export to JSON
   const handleExportJSON = React.useCallback(() => {
      const manager = new DecisionTableManager({
         id: 'temp',
         name: 'temp',
         position: { x: 0, y: 0 },
         tableData
      });
      const json = manager.exportToJSON();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'decision_table.json';
      link.click();
   }, [tableData]);

   // Cell editor template
   const cellEditor = React.useCallback(
      (options: any) => (
         <InputText
            type='text'
            value={options.value ?? ''}
            onChange={e => options.editorCallback(e.target.value)}
            style={{ width: '100%' }}
         />
      ),
      []
   );

   // Cell body template
   const cellBody = React.useCallback((rowData: TableRow, column: Column) => {
      const value = rowData.values[column.id];
      return <span>{value !== undefined && value !== null ? String(value) : ''}</span>;
   }, []);

   // Column header template with delete button
   const columnHeader = React.useCallback(
      (column: Column, type: 'input' | 'decision' | 'output') => (
         <div className='flex align-items-center justify-content-between'>
            <span className={`column-type-${type}`}>
               {column.name}
               <small className='ml-1 text-500'>({type})</small>
            </span>
            {!readonly && (
               <Button
                  icon='pi pi-trash'
                  className='p-button-rounded p-button-text p-button-danger p-button-sm'
                  onClick={() => handleDeleteColumn(column.id)}
                  tooltip='删除列 (Delete Column)'
               />
            )}
         </div>
      ),
      [readonly, handleDeleteColumn]
   );

   // Row actions template
   const rowActionsTemplate = React.useCallback(
      (rowData: TableRow) => (
         <Button
            icon='pi pi-trash'
            className='p-button-rounded p-button-text p-button-danger'
            onClick={() => handleDeleteRow(rowData.id)}
            disabled={readonly}
            tooltip='删除行 (Delete Row)'
         />
      ),
      [readonly, handleDeleteRow]
   );

   // Toolbar left content
   const toolbarLeftContent = React.useMemo(
      () => (
         <div className='flex gap-2'>
            <Button label='添加行 (Add Row)' icon='pi pi-plus' onClick={handleAddRow} disabled={readonly} />
            <Button
               label='添加列 (Add Column)'
               icon='pi pi-plus-circle'
               onClick={() => setShowAddColumnDialog(true)}
               disabled={readonly}
               className='p-button-secondary'
            />
         </div>
      ),
      [handleAddRow, readonly]
   );

   // Toolbar right content
   const toolbarRightContent = React.useMemo(
      () => (
         <div className='flex gap-2'>
            <Button
               label='导入 (Import)'
               icon='pi pi-upload'
               onClick={() => setShowImportDialog(true)}
               disabled={readonly}
               className='p-button-help'
            />
            <Button label='导出CSV (Export CSV)' icon='pi pi-download' onClick={handleExportCSV} className='p-button-success' />
            <Button label='导出JSON (Export JSON)' icon='pi pi-download' onClick={handleExportJSON} className='p-button-info' />
         </div>
      ),
      [readonly, handleExportCSV, handleExportJSON]
   );

   return (
      <div className={`decision-table-editor ${className || ''}`}>
         <ConfirmDialog />

         {/* Validation Messages */}
         {!validation.isValid && (
            <div className='mb-3'>
               {validation.errors.map((error, index) => (
                  <Message key={index} severity='error' text={error} className='w-full mb-1' />
               ))}
            </div>
         )}
         {validation.warnings?.map((warning, index) => (
            <Message key={`warning-${index}`} severity='warn' text={warning} className='w-full mb-1' />
         ))}

         {/* Toolbar */}
         <Toolbar left={toolbarLeftContent} right={toolbarRightContent} className='mb-3' />

         {/* Data Table */}
         <DataTable
            value={tableData.rows}
            editMode='row'
            dataKey='id'
            editingRows={editingRows}
            onRowEditChange={e => setEditingRows(e.data as Record<string, boolean>)}
            onRowEditComplete={handleRowEditComplete}
            scrollable
            scrollHeight='400px'
            className='p-datatable-sm'
            emptyMessage='没有数据行 (No data rows)'
            rowClassName={rowData => {
               if (validation.duplicateRowIndices?.includes(tableData.rows.indexOf(rowData))) {
                  return 'p-highlight-error';
               }
               return '';
            }}
         >
            {/* Row number column */}
            <PrimeColumn header='#' body={(_, options) => options.rowIndex + 1} style={{ width: '50px' }} />

            {/* Input columns */}
            {tableData.inputColumns.map(column => (
               <PrimeColumn
                  key={column.id}
                  field={`values.${column.id}`}
                  header={columnHeader(column, 'input')}
                  editor={cellEditor}
                  body={rowData => cellBody(rowData, column)}
                  style={{ minWidth: '120px' }}
                  headerClassName='column-header-input'
               />
            ))}

            {/* Decision columns */}
            {tableData.decisionColumns.map(column => (
               <PrimeColumn
                  key={column.id}
                  field={`values.${column.id}`}
                  header={columnHeader(column, 'decision')}
                  editor={cellEditor}
                  body={rowData => cellBody(rowData, column)}
                  style={{ minWidth: '120px' }}
                  headerClassName='column-header-decision'
               />
            ))}

            {/* Output columns */}
            {tableData.outputColumns.map(column => (
               <PrimeColumn
                  key={column.id}
                  field={`values.${column.id}`}
                  header={columnHeader(column, 'output')}
                  editor={cellEditor}
                  body={rowData => cellBody(rowData, column)}
                  style={{ minWidth: '120px' }}
                  headerClassName='column-header-output'
               />
            ))}

            {/* Row editor column */}
            <PrimeColumn rowEditor headerStyle={{ width: '80px' }} bodyStyle={{ textAlign: 'center' }} />

            {/* Actions column */}
            <PrimeColumn header='操作' body={rowActionsTemplate} style={{ width: '80px' }} />
         </DataTable>

         {/* Add Column Dialog */}
         <Dialog
            header='添加列 (Add Column)'
            visible={showAddColumnDialog}
            onHide={() => setShowAddColumnDialog(false)}
            style={{ width: '400px' }}
         >
            <div className='p-fluid'>
               <div className='field'>
                  <label htmlFor='columnName'>列名 (Column Name)</label>
                  <InputText id='columnName' value={newColumnName} onChange={e => setNewColumnName(e.target.value)} />
               </div>
               <div className='field'>
                  <label htmlFor='columnType'>列类型 (Column Type)</label>
                  <Dropdown id='columnType' value={newColumnType} options={columnTypeOptions} onChange={e => setNewColumnType(e.value)} />
               </div>
               <div className='field'>
                  <label htmlFor='dataType'>数据类型 (Data Type)</label>
                  <Dropdown
                     id='dataType'
                     value={newColumnDataType}
                     options={dataTypeOptions}
                     onChange={e => setNewColumnDataType(e.value)}
                  />
               </div>
               <div className='flex justify-content-end gap-2 mt-3'>
                  <Button
                     label='取消 (Cancel)'
                     icon='pi pi-times'
                     onClick={() => setShowAddColumnDialog(false)}
                     className='p-button-text'
                  />
                  <Button label='添加 (Add)' icon='pi pi-check' onClick={handleAddColumn} disabled={!newColumnName.trim()} />
               </div>
            </div>
         </Dialog>

         {/* Import Dialog */}
         <Dialog
            header='导入数据 (Import Data)'
            visible={showImportDialog}
            onHide={() => setShowImportDialog(false)}
            style={{ width: '600px' }}
         >
            <div className='p-fluid'>
               <div className='field'>
                  <label>上传文件 (Upload File)</label>
                  <FileUpload
                     mode='basic'
                     accept='.csv,.json'
                     maxFileSize={1000000}
                     customUpload
                     uploadHandler={handleFileUpload}
                     auto
                     chooseLabel='选择文件 (Choose File)'
                  />
               </div>
               <div className='field'>
                  <label htmlFor='importFormat'>格式 (Format)</label>
                  <Dropdown
                     id='importFormat'
                     value={importFormat}
                     options={[
                        { label: 'CSV', value: 'csv' },
                        { label: 'JSON', value: 'json' }
                     ]}
                     onChange={e => setImportFormat(e.value)}
                  />
               </div>
               <div className='field'>
                  <label htmlFor='importContent'>内容 (Content)</label>
                  <InputTextarea id='importContent' value={importContent} onChange={e => setImportContent(e.target.value)} rows={10} />
               </div>
               <div className='flex justify-content-end gap-2 mt-3'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowImportDialog(false)} className='p-button-text' />
                  <Button label='导入 (Import)' icon='pi pi-check' onClick={handleImport} disabled={!importContent.trim()} />
               </div>
            </div>
         </Dialog>
      </div>
   );
}

export default DecisionTableEditor;
