/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 自动化动作表单组件
 * Automation action form component
 * 需求 5.1-5.4: 测试数据和自动化动作
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, AutomationActionManager, AutomationActionType } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import * as React from 'react';

/**
 * 自动化动作表单属性
 * Automation action form props
 */
export interface AutomationActionFormProps {
   actions: AutomationAction[];
   onChange: (actions: AutomationAction[]) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 动作类型选项
 * Action type options
 */
const actionTypeOptions: Array<{ label: string; value: AutomationActionType }> = [
   { label: 'API调用 (API Call)', value: 'api_call' },
   { label: '脚本 (Script)', value: 'script' },
   { label: 'Webhook', value: 'webhook' }
];

/**
 * 动作类型标签颜色
 * Action type tag colors
 */
const actionTypeColors: Record<AutomationActionType, 'success' | 'info' | 'warning'> = {
   api_call: 'success',
   script: 'info',
   webhook: 'warning'
};

/**
 * 自动化动作表单组件
 * Automation action form component
 */
export function AutomationActionForm({
   actions,
   onChange,
   availableEdges = [],
   readonly = false
}: AutomationActionFormProps): React.ReactElement {
   const [showAddDialog, setShowAddDialog] = React.useState(false);
   const [showEditDialog, setShowEditDialog] = React.useState(false);
   const [editingAction, setEditingAction] = React.useState<AutomationAction | null>(null);
   const [newAction, setNewAction] = React.useState<Partial<AutomationAction>>({
      name: '',
      actionType: 'api_call',
      edgeBinding: '',
      configuration: {}
   });
   const [configStr, setConfigStr] = React.useState('{}');
   const [error, setError] = React.useState<string | null>(null);

   // Reset form
   const resetForm = React.useCallback(() => {
      setNewAction({
         name: '',
         actionType: 'api_call',
         edgeBinding: availableEdges[0]?.id || '',
         configuration: {}
      });
      setConfigStr('{}');
      setError(null);
   }, [availableEdges]);

   // Get default config template based on action type
   const getConfigTemplate = React.useCallback((actionType: AutomationActionType): string => {
      switch (actionType) {
         case 'api_call':
            return JSON.stringify(
               {
                  url: 'https://api.example.com/endpoint',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: {}
               },
               null,
               2
            );
         case 'script':
            return JSON.stringify(
               {
                  language: 'javascript',
                  code: '// Your script here',
                  timeout: 30000
               },
               null,
               2
            );
         case 'webhook':
            return JSON.stringify(
               {
                  url: 'https://webhook.example.com/hook',
                  method: 'POST',
                  payload: {}
               },
               null,
               2
            );
         default:
            return '{}';
      }
   }, []);

   // Handle action type change
   const handleActionTypeChange = React.useCallback(
      (actionType: AutomationActionType) => {
         setNewAction({ ...newAction, actionType });
         setConfigStr(getConfigTemplate(actionType));
      },
      [newAction, getConfigTemplate]
   );

   // Handle add action
   const handleAdd = React.useCallback(() => {
      try {
         const configuration = JSON.parse(configStr);

         if (!newAction.name?.trim()) {
            setError('名称不能为空 (Name is required)');
            return;
         }

         if (!newAction.edgeBinding) {
            setError('必须选择绑定的边 (Edge binding is required)');
            return;
         }

         const created = AutomationActionManager.createAutomationAction(
            newAction.name,
            newAction.actionType!,
            newAction.edgeBinding,
            configuration
         );

         onChange([...actions, created]);
         setShowAddDialog(false);
         resetForm();
      } catch (e) {
         setError('JSON格式无效 (Invalid JSON format)');
      }
   }, [newAction, configStr, actions, onChange, resetForm]);

   // Handle edit action
   const handleEdit = React.useCallback((action: AutomationAction) => {
      setEditingAction(action);
      setNewAction({
         name: action.name,
         actionType: action.actionType,
         edgeBinding: action.edgeBinding,
         configuration: action.configuration
      });
      setConfigStr(JSON.stringify(action.configuration, null, 2));
      setError(null);
      setShowEditDialog(true);
   }, []);

   // Handle save edit
   const handleSaveEdit = React.useCallback(() => {
      if (!editingAction) return;

      try {
         const configuration = JSON.parse(configStr);

         if (!newAction.name?.trim()) {
            setError('名称不能为空 (Name is required)');
            return;
         }

         const updated: AutomationAction = {
            ...editingAction,
            name: newAction.name!,
            actionType: newAction.actionType!,
            edgeBinding: newAction.edgeBinding!,
            configuration
         };

         onChange(actions.map(a => (a.id === editingAction.id ? updated : a)));
         setShowEditDialog(false);
         setEditingAction(null);
         resetForm();
      } catch (e) {
         setError('JSON格式无效 (Invalid JSON format)');
      }
   }, [editingAction, newAction, configStr, actions, onChange, resetForm]);

   // Handle delete action
   const handleDelete = React.useCallback(
      (action: AutomationAction) => {
         confirmDialog({
            message: `确定要删除自动化动作 "${action.name}" 吗？(Are you sure you want to delete "${action.name}"?)`,
            header: '确认删除 (Confirm Delete)',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
               onChange(actions.filter(a => a.id !== action.id));
            }
         });
      },
      [actions, onChange]
   );

   // Action type template
   const actionTypeTemplate = React.useCallback((rowData: AutomationAction) => {
      const option = actionTypeOptions.find(o => o.value === rowData.actionType);
      return <Tag value={option?.label || rowData.actionType} severity={actionTypeColors[rowData.actionType]} />;
   }, []);

   // Edge binding template
   const edgeBindingTemplate = React.useCallback(
      (rowData: AutomationAction) => {
         const edge = availableEdges.find(e => e.id === rowData.edgeBinding);
         return edge ? edge.name : rowData.edgeBinding;
      },
      [availableEdges]
   );

   // Actions template
   const actionsTemplate = React.useCallback(
      (rowData: AutomationAction) => (
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
            label='添加自动化动作 (Add Action)'
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
            <label htmlFor='action-name'>名称 (Name)</label>
            <InputText id='action-name' value={newAction.name || ''} onChange={e => setNewAction({ ...newAction, name: e.target.value })} />
         </div>

         <div className='field'>
            <label htmlFor='action-type'>类型 (Type)</label>
            <Dropdown
               id='action-type'
               value={newAction.actionType}
               options={actionTypeOptions}
               onChange={e => handleActionTypeChange(e.value)}
               placeholder='选择动作类型'
            />
         </div>

         <div className='field'>
            <label htmlFor='action-edge'>绑定边 (Edge Binding)</label>
            <Dropdown
               id='action-edge'
               value={newAction.edgeBinding}
               options={edgeOptions}
               onChange={e => setNewAction({ ...newAction, edgeBinding: e.value })}
               placeholder='选择要绑定的边'
               emptyMessage='没有可用的边 (No available edges)'
            />
         </div>

         <div className='field'>
            <label htmlFor='action-config'>配置 (Configuration) - JSON</label>
            <InputTextarea id='action-config' value={configStr} onChange={e => setConfigStr(e.target.value)} rows={10} autoResize />
         </div>

         {error && <small className='p-error'>{error}</small>}
      </div>
   );

   return (
      <div className='automation-action-form'>
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
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span>自动化动作绑定到输出边，用于流程自动化执行 (Automation actions are bound to output edges for automated execution)</span>
         </div>

         <Toolbar left={toolbarLeft} className='mb-3' />

         <DataTable value={actions} dataKey='id' emptyMessage='暂无自动化动作 (No automation actions)' className='p-datatable-sm'>
            <Column field='name' header='名称 (Name)' />
            <Column field='actionType' header='类型 (Type)' body={actionTypeTemplate} />
            <Column field='edgeBinding' header='绑定边 (Edge Binding)' body={edgeBindingTemplate} />
            <Column header='操作 (Actions)' body={actionsTemplate} style={{ width: '100px' }} />
         </DataTable>

         {/* Add Dialog */}
         <Dialog
            header='添加自动化动作 (Add Automation Action)'
            visible={showAddDialog}
            onHide={() => setShowAddDialog(false)}
            style={{ width: '600px' }}
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
            header='编辑自动化动作 (Edit Automation Action)'
            visible={showEditDialog}
            onHide={() => setShowEditDialog(false)}
            style={{ width: '600px' }}
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

export default AutomationActionForm;
