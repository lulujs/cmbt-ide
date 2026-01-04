/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 泳道表单组件
 * Swimlane form component
 * 需求 3.1-3.4: 泳道功能
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { Swimlane, SwimlaneManager, SwimlaneProperties } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { ColorPicker } from 'primereact/colorpicker';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toolbar } from 'primereact/toolbar';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';

/**
 * 泳道表单属性
 * Swimlane form props
 */
export interface SwimlaneFormProps {
   swimlanes: Swimlane[];
   onSwimlanesChange: (swimlanes: Swimlane[]) => void;
   availableNodes?: Array<{ id: string; name: string }>;
   onDeleteSwimlane?: (swimlaneId: string, deleteNodes: boolean) => void;
   readonly?: boolean;
}

/**
 * 方向选项
 * Orientation options
 */
const orientationOptions = [
   { label: '水平 (Horizontal)', value: 'horizontal' },
   { label: '垂直 (Vertical)', value: 'vertical' }
];

/**
 * 泳道表单组件
 * Swimlane form component
 */
export function SwimlaneForm({
   swimlanes,
   onSwimlanesChange,
   availableNodes = [],
   onDeleteSwimlane,
   readonly = false
}: SwimlaneFormProps): React.ReactElement {
   const [showAddDialog, setShowAddDialog] = React.useState(false);
   const [showEditDialog, setShowEditDialog] = React.useState(false);
   const [editingSwimlane, setEditingSwimlane] = React.useState<Swimlane | null>(null);
   const [newSwimlane, setNewSwimlane] = React.useState<Partial<Swimlane>>({
      name: '',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      properties: { orientation: 'horizontal' },
      containedNodes: []
   });

   // Reset form
   const resetForm = React.useCallback(() => {
      setNewSwimlane({
         name: '',
         position: { x: 0, y: 0 },
         size: { width: 400, height: 300 },
         properties: { orientation: 'horizontal' },
         containedNodes: []
      });
   }, []);

   // Handle add swimlane
   const handleAdd = React.useCallback(() => {
      if (!newSwimlane.name?.trim()) {
         return;
      }

      const manager = new SwimlaneManager({
         name: newSwimlane.name,
         position: newSwimlane.position,
         size: newSwimlane.size,
         properties: newSwimlane.properties as SwimlaneProperties
      });

      onSwimlanesChange([...swimlanes, manager.getSwimlane()]);
      setShowAddDialog(false);
      resetForm();
   }, [newSwimlane, swimlanes, onSwimlanesChange, resetForm]);

   // Handle edit swimlane
   const handleEdit = React.useCallback((swimlane: Swimlane) => {
      setEditingSwimlane(swimlane);
      setNewSwimlane({
         name: swimlane.name,
         position: { ...swimlane.position },
         size: { ...swimlane.size },
         properties: { ...swimlane.properties },
         containedNodes: [...swimlane.containedNodes]
      });
      setShowEditDialog(true);
   }, []);

   // Handle save edit
   const handleSaveEdit = React.useCallback(() => {
      if (!editingSwimlane || !newSwimlane.name?.trim()) {
         return;
      }

      const updated: Swimlane = {
         ...editingSwimlane,
         name: newSwimlane.name!,
         position: newSwimlane.position!,
         size: newSwimlane.size!,
         properties: newSwimlane.properties as SwimlaneProperties,
         containedNodes: newSwimlane.containedNodes || []
      };

      onSwimlanesChange(swimlanes.map(s => (s.id === editingSwimlane.id ? updated : s)));
      setShowEditDialog(false);
      setEditingSwimlane(null);
      resetForm();
   }, [editingSwimlane, newSwimlane, swimlanes, onSwimlanesChange, resetForm]);

   // Handle delete swimlane
   const handleDelete = React.useCallback(
      (swimlane: Swimlane) => {
         const hasNodes = swimlane.containedNodes.length > 0;

         if (hasNodes) {
            confirmDialog({
               message: `泳道 "${swimlane.name}" 包含 ${swimlane.containedNodes.length} 个节点。是否同时删除这些节点？`,
               header: '删除泳道 (Delete Swimlane)',
               icon: 'pi pi-exclamation-triangle',
               acceptLabel: '删除泳道和节点 (Delete All)',
               rejectLabel: '仅删除泳道 (Swimlane Only)',
               accept: () => {
                  if (onDeleteSwimlane) {
                     onDeleteSwimlane(swimlane.id, true);
                  } else {
                     onSwimlanesChange(swimlanes.filter(s => s.id !== swimlane.id));
                  }
               },
               reject: () => {
                  if (onDeleteSwimlane) {
                     onDeleteSwimlane(swimlane.id, false);
                  } else {
                     onSwimlanesChange(swimlanes.filter(s => s.id !== swimlane.id));
                  }
               }
            });
         } else {
            confirmDialog({
               message: `确定要删除泳道 "${swimlane.name}" 吗？`,
               header: '确认删除 (Confirm Delete)',
               icon: 'pi pi-exclamation-triangle',
               accept: () => {
                  if (onDeleteSwimlane) {
                     onDeleteSwimlane(swimlane.id, false);
                  } else {
                     onSwimlanesChange(swimlanes.filter(s => s.id !== swimlane.id));
                  }
               }
            });
         }
      },
      [swimlanes, onSwimlanesChange, onDeleteSwimlane]
   );

   // Node count template
   const nodeCountTemplate = React.useCallback((rowData: Swimlane) => {
      return <span>{rowData.containedNodes.length}</span>;
   }, []);

   // Size template
   const sizeTemplate = React.useCallback((rowData: Swimlane) => {
      return <span>{`${rowData.size.width} x ${rowData.size.height}`}</span>;
   }, []);

   // Actions template
   const actionsTemplate = React.useCallback(
      (rowData: Swimlane) => (
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
            label='添加泳道 (Add Swimlane)'
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

   // Dialog content
   const dialogContent = (
      <div className='p-fluid'>
         <div className='field'>
            <label htmlFor='swimlane-name'>名称 (Name)</label>
            <InputText
               id='swimlane-name'
               value={newSwimlane.name || ''}
               onChange={e => setNewSwimlane({ ...newSwimlane, name: e.target.value })}
            />
         </div>

         <div className='field'>
            <label htmlFor='swimlane-description'>描述 (Description)</label>
            <InputTextarea
               id='swimlane-description'
               value={newSwimlane.properties?.description || ''}
               onChange={e =>
                  setNewSwimlane({
                     ...newSwimlane,
                     properties: { ...newSwimlane.properties, description: e.target.value }
                  })
               }
               rows={3}
               autoResize
            />
         </div>

         <div className='field'>
            <label htmlFor='swimlane-orientation'>方向 (Orientation)</label>
            <Dropdown
               id='swimlane-orientation'
               value={newSwimlane.properties?.orientation || 'horizontal'}
               options={orientationOptions}
               onChange={e =>
                  setNewSwimlane({
                     ...newSwimlane,
                     properties: { ...newSwimlane.properties, orientation: e.value }
                  })
               }
            />
         </div>

         <div className='field'>
            <label>颜色 (Color)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <ColorPicker
                  value={newSwimlane.properties?.color || '#3b82f6'}
                  onChange={e =>
                     setNewSwimlane({
                        ...newSwimlane,
                        properties: { ...newSwimlane.properties, color: `#${e.value}` }
                     })
                  }
               />
               <InputText
                  value={newSwimlane.properties?.color || '#3b82f6'}
                  onChange={e =>
                     setNewSwimlane({
                        ...newSwimlane,
                        properties: { ...newSwimlane.properties, color: e.target.value }
                     })
                  }
                  style={{ width: '100px' }}
               />
            </div>
         </div>

         <div className='grid'>
            <div className='col-6'>
               <div className='field'>
                  <label htmlFor='swimlane-width'>宽度 (Width)</label>
                  <InputNumber
                     id='swimlane-width'
                     value={newSwimlane.size?.width || 400}
                     onValueChange={e =>
                        setNewSwimlane({
                           ...newSwimlane,
                           size: { ...newSwimlane.size!, width: e.value || 400 }
                        })
                     }
                     min={100}
                  />
               </div>
            </div>
            <div className='col-6'>
               <div className='field'>
                  <label htmlFor='swimlane-height'>高度 (Height)</label>
                  <InputNumber
                     id='swimlane-height'
                     value={newSwimlane.size?.height || 300}
                     onValueChange={e =>
                        setNewSwimlane({
                           ...newSwimlane,
                           size: { ...newSwimlane.size!, height: e.value || 300 }
                        })
                     }
                     min={100}
                  />
               </div>
            </div>
         </div>

         <div className='grid'>
            <div className='col-6'>
               <div className='field'>
                  <label htmlFor='swimlane-x'>X位置 (X Position)</label>
                  <InputNumber
                     id='swimlane-x'
                     value={newSwimlane.position?.x || 0}
                     onValueChange={e =>
                        setNewSwimlane({
                           ...newSwimlane,
                           position: { ...newSwimlane.position!, x: e.value || 0 }
                        })
                     }
                  />
               </div>
            </div>
            <div className='col-6'>
               <div className='field'>
                  <label htmlFor='swimlane-y'>Y位置 (Y Position)</label>
                  <InputNumber
                     id='swimlane-y'
                     value={newSwimlane.position?.y || 0}
                     onValueChange={e =>
                        setNewSwimlane({
                           ...newSwimlane,
                           position: { ...newSwimlane.position!, y: e.value || 0 }
                        })
                     }
                  />
               </div>
            </div>
         </div>
      </div>
   );

   return (
      <Form id='swimlane-manager' name='泳道管理 (Swimlane Manager)' iconClass='codicon-layout'>
         <ConfirmDialog />

         {/* Info banner */}
         <div
            style={{
               background: '#dbeafe',
               border: '1px solid #3b82f6',
               borderRadius: '8px',
               padding: '12px',
               marginBottom: '16px'
            }}
         >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <span style={{ fontSize: '20px' }}>📋</span>
               <span style={{ fontWeight: 'bold' }}>泳道功能说明 (Swimlane Features)</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '14px' }}>
               <li>泳道是可容纳节点的容器</li>
               <li>将节点拖入泳道可将其归属到该泳道</li>
               <li>移动泳道会同时移动其中的所有节点</li>
               <li>删除泳道时可选择是否同时删除节点</li>
            </ul>
         </div>

         <FormSection label='泳道列表 (Swimlane List)'>
            <Toolbar left={toolbarLeft} className='mb-3' />

            <DataTable value={swimlanes} dataKey='id' emptyMessage='暂无泳道 (No swimlanes)' className='p-datatable-sm'>
               <Column field='name' header='名称 (Name)' />
               <Column header='节点数 (Nodes)' body={nodeCountTemplate} style={{ width: '100px' }} />
               <Column header='尺寸 (Size)' body={sizeTemplate} style={{ width: '120px' }} />
               <Column header='操作 (Actions)' body={actionsTemplate} style={{ width: '100px' }} />
            </DataTable>
         </FormSection>

         {/* Add Dialog */}
         <Dialog
            header='添加泳道 (Add Swimlane)'
            visible={showAddDialog}
            onHide={() => setShowAddDialog(false)}
            style={{ width: '500px' }}
            footer={
               <div className='flex justify-content-end gap-2'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowAddDialog(false)} className='p-button-text' />
                  <Button label='添加 (Add)' icon='pi pi-check' onClick={handleAdd} disabled={!newSwimlane.name?.trim()} />
               </div>
            }
         >
            {dialogContent}
         </Dialog>

         {/* Edit Dialog */}
         <Dialog
            header='编辑泳道 (Edit Swimlane)'
            visible={showEditDialog}
            onHide={() => setShowEditDialog(false)}
            style={{ width: '500px' }}
            footer={
               <div className='flex justify-content-end gap-2'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowEditDialog(false)} className='p-button-text' />
                  <Button label='保存 (Save)' icon='pi pi-check' onClick={handleSaveEdit} disabled={!newSwimlane.name?.trim()} />
               </div>
            }
         >
            {dialogContent}
         </Dialog>
      </Form>
   );
}

export default SwimlaneForm;
