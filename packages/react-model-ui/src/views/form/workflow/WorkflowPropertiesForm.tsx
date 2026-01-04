/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程属性表单组件
 * Workflow properties form component
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { WorkflowModel } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';

/**
 * 工作流程属性表单属性
 * Workflow properties form props
 */
export interface WorkflowPropertiesFormProps {
   workflow: WorkflowModel;
   onWorkflowChange: (workflow: WorkflowModel) => void;
   validationErrors?: string[];
   readonly?: boolean;
}

/**
 * 工作流程属性表单组件
 * Workflow properties form component
 */
export function WorkflowPropertiesForm({
   workflow,
   onWorkflowChange,
   validationErrors = [],
   readonly = false
}: WorkflowPropertiesFormProps): React.ReactElement {
   // Handle name change
   const handleNameChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onWorkflowChange({ ...workflow, name: event.target.value });
      },
      [workflow, onWorkflowChange]
   );

   // Handle description change
   const handleDescriptionChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
         onWorkflowChange({
            ...workflow,
            metadata: { ...workflow.metadata, description: event.target.value }
         });
      },
      [workflow, onWorkflowChange]
   );

   // Handle version change
   const handleVersionChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onWorkflowChange({
            ...workflow,
            metadata: { ...workflow.metadata, version: event.target.value }
         });
      },
      [workflow, onWorkflowChange]
   );

   // Handle author change
   const handleAuthorChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onWorkflowChange({
            ...workflow,
            metadata: { ...workflow.metadata, author: event.target.value }
         });
      },
      [workflow, onWorkflowChange]
   );

   // Calculate statistics
   const stats = React.useMemo(() => {
      return {
         nodeCount: workflow.nodes.size,
         edgeCount: workflow.edges.size,
         swimlaneCount: workflow.swimlanes.size
      };
   }, [workflow]);

   return (
      <Form id={workflow.name} name={workflow.name || '工作流程 (Workflow)'} iconClass='codicon-workflow'>
         {/* Validation errors */}
         {validationErrors.length > 0 && (
            <div className='mb-3'>
               {validationErrors.map((error, index) => (
                  <Message key={index} severity='error' text={error} className='w-full mb-1' />
               ))}
            </div>
         )}

         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='workflow-name'>工作流程名称 (Name)</label>
               <InputText id='workflow-name' value={workflow.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='workflow-description'>描述 (Description)</label>
               <InputTextarea
                  id='workflow-description'
                  value={workflow.metadata?.description || ''}
                  onChange={handleDescriptionChange}
                  disabled={readonly}
                  rows={4}
                  autoResize
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='workflow-version'>版本 (Version)</label>
               <InputText
                  id='workflow-version'
                  value={workflow.metadata?.version || '1.0.0'}
                  onChange={handleVersionChange}
                  disabled={readonly}
                  placeholder='1.0.0'
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='workflow-author'>作者 (Author)</label>
               <InputText
                  id='workflow-author'
                  value={workflow.metadata?.author || ''}
                  onChange={handleAuthorChange}
                  disabled={readonly}
                  placeholder='输入作者名称'
               />
            </div>
         </FormSection>

         {/* Statistics section */}
         <FormSection label='统计信息 (Statistics)'>
            <div
               style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
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
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{stats.nodeCount}</div>
                  <div style={{ color: '#6b7280' }}>节点 (Nodes)</div>
               </div>

               <div
                  style={{
                     background: '#dcfce7',
                     borderRadius: '8px',
                     padding: '16px',
                     textAlign: 'center'
                  }}
               >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.edgeCount}</div>
                  <div style={{ color: '#6b7280' }}>边 (Edges)</div>
               </div>

               <div
                  style={{
                     background: '#fef3c7',
                     borderRadius: '8px',
                     padding: '16px',
                     textAlign: 'center'
                  }}
               >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>{stats.swimlaneCount}</div>
                  <div style={{ color: '#6b7280' }}>泳道 (Swimlanes)</div>
               </div>
            </div>
         </FormSection>

         {/* Metadata section */}
         <FormSection label='元数据 (Metadata)' defaultCollapsed>
            <div className='p-field p-fluid'>
               <label htmlFor='workflow-created'>创建时间 (Created)</label>
               <InputText id='workflow-created' value={workflow.metadata?.createdAt || '-'} disabled />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='workflow-modified'>修改时间 (Modified)</label>
               <InputText id='workflow-modified' value={workflow.metadata?.updatedAt || '-'} disabled />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='workflow-tags'>标签 (Tags)</label>
               <InputText
                  id='workflow-tags'
                  value={workflow.metadata?.tags?.join(', ') || ''}
                  onChange={e => {
                     const tags = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t);
                     onWorkflowChange({
                        ...workflow,
                        metadata: { ...workflow.metadata, tags }
                     });
                  }}
                  disabled={readonly}
                  placeholder='用逗号分隔标签'
               />
               <small className='p-d-block p-mt-1' style={{ color: '#6b7280' }}>
                  使用逗号分隔多个标签 (Separate tags with commas)
               </small>
            </div>
         </FormSection>
      </Form>
   );
}

export default WorkflowPropertiesForm;
