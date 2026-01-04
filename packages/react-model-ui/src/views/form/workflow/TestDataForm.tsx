/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 测试数据表单组件
 * Test data form component
 * 需求 5.1-5.4: 测试数据和自动化动作
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { TestData, TestDataManager } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toolbar } from 'primereact/toolbar';
import * as React from 'react';

/**
 * 测试数据表单属性
 * Test data form props
 */
export interface TestDataFormProps {
   testData: TestData[];
   onChange: (testData: TestData[]) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 测试数据表单组件
 * Test data form component
 */
export function TestDataForm({ testData, onChange, availableEdges = [], readonly = false }: TestDataFormProps): React.ReactElement {
   const [showAddDialog, setShowAddDialog] = React.useState(false);
   const [showEditDialog, setShowEditDialog] = React.useState(false);
   const [editingTestData, setEditingTestData] = React.useState<TestData | null>(null);
   const [newTestData, setNewTestData] = React.useState<Partial<TestData>>({
      name: '',
      edgeBinding: '',
      inputData: {},
      expectedOutput: {}
   });
   const [inputDataStr, setInputDataStr] = React.useState('{}');
   const [expectedOutputStr, setExpectedOutputStr] = React.useState('{}');
   const [jsonError, setJsonError] = React.useState<string | null>(null);

   // Reset form
   const resetForm = React.useCallback(() => {
      setNewTestData({
         name: '',
         edgeBinding: availableEdges[0]?.id || '',
         inputData: {},
         expectedOutput: {}
      });
      setInputDataStr('{}');
      setExpectedOutputStr('{}');
      setJsonError(null);
   }, [availableEdges]);

   // Handle add test data
   const handleAdd = React.useCallback(() => {
      try {
         const inputData = JSON.parse(inputDataStr);
         const expectedOutput = JSON.parse(expectedOutputStr);

         if (!newTestData.name?.trim()) {
            setJsonError('名称不能为空 (Name is required)');
            return;
         }

         if (!newTestData.edgeBinding) {
            setJsonError('必须选择绑定的边 (Edge binding is required)');
            return;
         }

         const created = TestDataManager.createTestData(newTestData.name, newTestData.edgeBinding, inputData, expectedOutput);

         onChange([...testData, created]);
         setShowAddDialog(false);
         resetForm();
      } catch (e) {
         setJsonError('JSON格式无效 (Invalid JSON format)');
      }
   }, [newTestData, inputDataStr, expectedOutputStr, testData, onChange, resetForm]);

   // Handle edit test data
   const handleEdit = React.useCallback((td: TestData) => {
      setEditingTestData(td);
      setNewTestData({
         name: td.name,
         edgeBinding: td.edgeBinding,
         inputData: td.inputData,
         expectedOutput: td.expectedOutput
      });
      setInputDataStr(JSON.stringify(td.inputData, null, 2));
      setExpectedOutputStr(JSON.stringify(td.expectedOutput, null, 2));
      setJsonError(null);
      setShowEditDialog(true);
   }, []);

   // Handle save edit
   const handleSaveEdit = React.useCallback(() => {
      if (!editingTestData) return;

      try {
         const inputData = JSON.parse(inputDataStr);
         const expectedOutput = JSON.parse(expectedOutputStr);

         if (!newTestData.name?.trim()) {
            setJsonError('名称不能为空 (Name is required)');
            return;
         }

         const updated: TestData = {
            ...editingTestData,
            name: newTestData.name!,
            edgeBinding: newTestData.edgeBinding!,
            inputData,
            expectedOutput
         };

         onChange(testData.map(td => (td.id === editingTestData.id ? updated : td)));
         setShowEditDialog(false);
         setEditingTestData(null);
         resetForm();
      } catch (e) {
         setJsonError('JSON格式无效 (Invalid JSON format)');
      }
   }, [editingTestData, newTestData, inputDataStr, expectedOutputStr, testData, onChange, resetForm]);

   // Handle delete test data
   const handleDelete = React.useCallback(
      (td: TestData) => {
         confirmDialog({
            message: `确定要删除测试数据 "${td.name}" 吗？(Are you sure you want to delete "${td.name}"?)`,
            header: '确认删除 (Confirm Delete)',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
               onChange(testData.filter(t => t.id !== td.id));
            }
         });
      },
      [testData, onChange]
   );

   // Edge binding template
   const edgeBindingTemplate = React.useCallback(
      (rowData: TestData) => {
         const edge = availableEdges.find(e => e.id === rowData.edgeBinding);
         return edge ? edge.name : rowData.edgeBinding;
      },
      [availableEdges]
   );

   // Actions template
   const actionsTemplate = React.useCallback(
      (rowData: TestData) => (
         <div className='flex gap-2'>
            <Button
               icon='pi pi-pencil'
               className='p-button-rounded p-button-text p-button-sm'
               onClick={() => handleEdit(rowData)}
               disabled={readonly}
               tooltip='编辑 (Edit)'
            />
            <Button
               icon='pi pi-trash'
               className='p-button-rounded p-button-text p-button-danger p-button-sm'
               onClick={() => handleDelete(rowData)}
               disabled={readonly}
               tooltip='删除 (Delete)'
            />
         </div>
      ),
      [readonly, handleEdit, handleDelete]
   );

   // Toolbar left content
   const toolbarLeft = React.useMemo(
      () => (
         <Button
            label='添加测试数据 (Add Test Data)'
            icon='pi pi-plus'
            onClick={() => {
               resetForm();
               setShowAddDialog(true);
            }}
            disabled={readonly}
         />
      ),
      [readonly, resetForm]
   );

   // Edge options for dropdown
   const edgeOptions = React.useMemo(() => availableEdges.map(e => ({ label: e.name, value: e.id })), [availableEdges]);

   // Dialog content
   const dialogContent = (
      <div className='p-fluid'>
         <div className='field'>
            <label htmlFor='td-name'>名称 (Name)</label>
            <InputText
               id='td-name'
               value={newTestData.name || ''}
               onChange={e => setNewTestData({ ...newTestData, name: e.target.value })}
            />
         </div>

         <div className='field'>
            <label htmlFor='td-edge'>绑定边 (Edge Binding)</label>
            <Dropdown
               id='td-edge'
               value={newTestData.edgeBinding}
               options={edgeOptions}
               onChange={e => setNewTestData({ ...newTestData, edgeBinding: e.value })}
               placeholder='选择要绑定的边'
               emptyMessage='没有可用的边 (No available edges)'
            />
         </div>

         <div className='field'>
            <label htmlFor='td-input'>输入数据 (Input Data) - JSON</label>
            <InputTextarea id='td-input' value={inputDataStr} onChange={e => setInputDataStr(e.target.value)} rows={5} autoResize />
         </div>

         <div className='field'>
            <label htmlFor='td-output'>预期输出 (Expected Output) - JSON</label>
            <InputTextarea
               id='td-output'
               value={expectedOutputStr}
               onChange={e => setExpectedOutputStr(e.target.value)}
               rows={5}
               autoResize
            />
         </div>

         {jsonError && <small className='p-error'>{jsonError}</small>}
      </div>
   );

   return (
      <div className='test-data-form'>
         <ConfirmDialog />

         {/* Info banner */}
         <div
            style={{
               background: '#dbeafe',
               border: '1px solid #3b82f6',
               borderRadius: '8px',
               padding: '12px',
               marginBottom: '16px',
               display: 'flex',
               alignItems: 'center',
               gap: '8px'
            }}
         >
            <span style={{ fontSize: '20px' }}>🧪</span>
            <span>测试数据绑定到输出边，用于流程测试 (Test data is bound to output edges for process testing)</span>
         </div>

         <Toolbar left={toolbarLeft} className='mb-3' />

         <DataTable value={testData} dataKey='id' emptyMessage='暂无测试数据 (No test data)' className='p-datatable-sm'>
            <Column field='name' header='名称 (Name)' />
            <Column field='edgeBinding' header='绑定边 (Edge Binding)' body={edgeBindingTemplate} />
            <Column header='操作 (Actions)' body={actionsTemplate} style={{ width: '100px' }} />
         </DataTable>

         {/* Add Dialog */}
         <Dialog
            header='添加测试数据 (Add Test Data)'
            visible={showAddDialog}
            onHide={() => setShowAddDialog(false)}
            style={{ width: '500px' }}
            footer={
               <div className='flex justify-content-end gap-2'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowAddDialog(false)} className='p-button-text' />
                  <Button label='添加 (Add)' icon='pi pi-check' onClick={handleAdd} />
               </div>
            }
         >
            {dialogContent}
         </Dialog>

         {/* Edit Dialog */}
         <Dialog
            header='编辑测试数据 (Edit Test Data)'
            visible={showEditDialog}
            onHide={() => setShowEditDialog(false)}
            style={{ width: '500px' }}
            footer={
               <div className='flex justify-content-end gap-2'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowEditDialog(false)} className='p-button-text' />
                  <Button label='保存 (Save)' icon='pi pi-check' onClick={handleSaveEdit} />
               </div>
            }
         >
            {dialogContent}
         </Dialog>
      </div>
   );
}

export default TestDataForm;
