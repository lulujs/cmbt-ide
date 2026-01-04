/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 引用节点管理表单组件
 * Reference node manager form component
 * 需求 4.1-4.5: 节点引用功能
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { ReferenceNode, WorkflowNode } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { NODE_TYPE_ICONS, NODE_TYPE_LABELS } from './WorkflowNodeForm';

/**
 * 引用节点管理表单属性
 * Reference node manager form props
 */
export interface ReferenceNodeManagerFormProps {
   referenceNodes: ReferenceNode[];
   sourceNodes: WorkflowNode[];
   onCreateReference: (sourceNodeIds: string[]) => void;
   onDeleteReference: (referenceNodeId: string) => void;
   onSelectReference?: (referenceNode: ReferenceNode) => void;
   readonly?: boolean;
}

/**
 * 可引用的节点类型
 * Referenceable node types
 */
const REFERENCEABLE_TYPES = ['begin', 'end', 'process', 'decision', 'decision_table', 'auto', 'exception'];

/**
 * 引用节点管理表单组件
 * Reference node manager form component
 */
export function ReferenceNodeManagerForm({
   referenceNodes,
   sourceNodes,
   onCreateReference,
   onDeleteReference,
   onSelectReference,
   readonly = false
}: ReferenceNodeManagerFormProps): React.ReactElement {
   const [showCreateDialog, setShowCreateDialog] = React.useState(false);
   const [selectedSourceNodes, setSelectedSourceNodes] = React.useState<WorkflowNode[]>([]);

   // Filter referenceable nodes
   const referenceableNodes = React.useMemo(() => sourceNodes.filter(node => REFERENCEABLE_TYPES.includes(node.type)), [sourceNodes]);

   // Handle create references
   const handleCreateReferences = React.useCallback(() => {
      if (selectedSourceNodes.length === 0) {
         return;
      }

      onCreateReference(selectedSourceNodes.map(n => n.id));
      setShowCreateDialog(false);
      setSelectedSourceNodes([]);
   }, [selectedSourceNodes, onCreateReference]);

   // Handle delete reference
   const handleDeleteReference = React.useCallback(
      (refNode: ReferenceNode) => {
         confirmDialog({
            message: `确定要删除引用节点 "${refNode.name}" 吗？(Are you sure you want to delete reference "${refNode.name}"?)`,
            header: '确认删除 (Confirm Delete)',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
               onDeleteReference(refNode.id);
            }
         });
      },
      [onDeleteReference]
   );

   // Get source node name
   const getSourceNodeName = React.useCallback(
      (sourceNodeId: string) => {
         const sourceNode = sourceNodes.find(n => n.id === sourceNodeId);
         return sourceNode?.name || sourceNodeId;
      },
      [sourceNodes]
   );

   // Source node template
   const sourceNodeTemplate = React.useCallback(
      (rowData: ReferenceNode) => {
         return <span>{getSourceNodeName(rowData.sourceNodeId)}</span>;
      },
      [getSourceNodeName]
   );

   // Type template
   const typeTemplate = React.useCallback((rowData: WorkflowNode) => {
      return (
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={NODE_TYPE_ICONS[rowData.type]} />
            <span>{NODE_TYPE_LABELS[rowData.type]}</span>
         </div>
      );
   }, []);

   // Actions template for reference nodes
   const actionsTemplate = React.useCallback(
      (rowData: ReferenceNode) => (
         <div className='flex gap-2'>
            {onSelectReference && (
               <Button
                  icon='pi pi-eye'
                  className='p-button-rounded p-button-text p-button-sm'
                  onClick={() => onSelectReference(rowData)}
                  tooltip='查看 (View)'
               />
            )}
            <Button
               icon='pi pi-trash'
               className='p-button-rounded p-button-text p-button-danger p-button-sm'
               onClick={() => handleDeleteReference(rowData)}
               disabled={readonly}
               tooltip='删除 (Delete)'
            />
         </div>
      ),
      [readonly, onSelectReference, handleDeleteReference]
   );

   // Toolbar left content
   const toolbarLeft = React.useMemo(
      () => (
         <Button
            label='创建引用 (Create Reference)'
            icon='pi pi-plus'
            onClick={() => {
               setSelectedSourceNodes([]);
               setShowCreateDialog(true);
            }}
            disabled={readonly || referenceableNodes.length === 0}
         />
      ),
      [readonly, referenceableNodes.length]
   );

   // Selection change handler
   const handleSelectionChange = React.useCallback((e: DataTableSelectionMultipleChangeEvent<WorkflowNode[]>) => {
      setSelectedSourceNodes(e.value);
   }, []);

   return (
      <Form id='reference-manager' name='引用节点管理 (Reference Node Manager)' iconClass='codicon-references'>
         <ConfirmDialog />

         {/* Info banner */}
         <div
            style={{
               background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
               color: 'white',
               borderRadius: '8px',
               padding: '16px',
               marginBottom: '16px'
            }}
         >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <span style={{ fontSize: '20px' }}>🔗</span>
               <span style={{ fontWeight: 'bold' }}>引用节点功能说明 (Reference Node Features)</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '14px' }}>
               <li>引用节点是源节点的克隆，保持与源节点的数据同步</li>
               <li>引用节点只允许修改名称和步骤显示按钮</li>
               <li>支持的节点类型：开始、结束、过程、分支、决策表、自动化、异常</li>
               <li>可以单个或批量创建引用</li>
            </ul>
         </div>

         {/* Reference nodes list */}
         <FormSection label='引用节点列表 (Reference Nodes)'>
            <Toolbar left={toolbarLeft} className='mb-3' />

            <DataTable value={referenceNodes} dataKey='id' emptyMessage='暂无引用节点 (No reference nodes)' className='p-datatable-sm'>
               <Column field='name' header='名称 (Name)' />
               <Column field='type' header='类型 (Type)' body={typeTemplate} />
               <Column field='sourceNodeId' header='源节点 (Source Node)' body={sourceNodeTemplate} />
               <Column header='操作 (Actions)' body={actionsTemplate} style={{ width: '100px' }} />
            </DataTable>
         </FormSection>

         {/* Statistics */}
         <FormSection label='统计信息 (Statistics)' defaultCollapsed>
            <div
               style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
               }}
            >
               <div
                  style={{
                     background: '#dbeafe',
                     borderRadius: '8px',
                     padding: '16px',
                     textAlign: 'center'
                  }}
               >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{referenceNodes.length}</div>
                  <div style={{ color: '#6b7280' }}>引用节点 (References)</div>
               </div>

               <div
                  style={{
                     background: '#dcfce7',
                     borderRadius: '8px',
                     padding: '16px',
                     textAlign: 'center'
                  }}
               >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{referenceableNodes.length}</div>
                  <div style={{ color: '#6b7280' }}>可引用节点 (Referenceable)</div>
               </div>
            </div>
         </FormSection>

         {/* Create Reference Dialog */}
         <Dialog
            header='创建引用节点 (Create Reference Nodes)'
            visible={showCreateDialog}
            onHide={() => setShowCreateDialog(false)}
            style={{ width: '600px' }}
            footer={
               <div className='flex justify-content-end gap-2'>
                  <Button label='取消 (Cancel)' icon='pi pi-times' onClick={() => setShowCreateDialog(false)} className='p-button-text' />
                  <Button
                     label={`创建 ${selectedSourceNodes.length} 个引用 (Create ${selectedSourceNodes.length} References)`}
                     icon='pi pi-check'
                     onClick={handleCreateReferences}
                     disabled={selectedSourceNodes.length === 0}
                  />
               </div>
            }
         >
            <div className='p-fluid'>
               <p style={{ marginBottom: '16px' }}>选择要创建引用的源节点 (Select source nodes to create references):</p>

               <DataTable
                  value={referenceableNodes}
                  dataKey='id'
                  selection={selectedSourceNodes}
                  onSelectionChange={handleSelectionChange}
                  selectionMode='checkbox'
                  emptyMessage='没有可引用的节点 (No referenceable nodes)'
                  className='p-datatable-sm'
                  scrollable
                  scrollHeight='300px'
               >
                  <Column selectionMode='multiple' headerStyle={{ width: '3rem' }} />
                  <Column field='name' header='名称 (Name)' />
                  <Column field='type' header='类型 (Type)' body={typeTemplate} />
               </DataTable>

               {selectedSourceNodes.length > 0 && (
                  <div
                     style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #86efac'
                     }}
                  >
                     <strong>已选择 {selectedSourceNodes.length} 个节点:</strong>
                     <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {selectedSourceNodes.map(node => (
                           <li key={node.id}>{node.name}</li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         </Dialog>
      </Form>
   );
}

export default ReferenceNodeManagerForm;
