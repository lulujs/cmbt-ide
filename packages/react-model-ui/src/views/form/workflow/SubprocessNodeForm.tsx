/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 子流程节点表单组件
 * Subprocess node form component
 * 需求 1.8: 子流程节点允许嵌套指定页生成的路径
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, SubprocessNode, TestData } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 子流程节点表单属性
 * Subprocess node form props
 */
export interface SubprocessNodeFormProps {
   node: SubprocessNode;
   onNodeChange: (node: SubprocessNode) => void;
   availableSubprocesses?: Array<{ path: string; name: string }>;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 子流程节点表单组件
 * Subprocess node form component
 */
export function SubprocessNodeForm({
   node,
   onNodeChange,
   availableSubprocesses = [],
   availableEdges = [],
   readonly = false
}: SubprocessNodeFormProps): React.ReactElement {
   // Handle name change
   const handleNameChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onNodeChange({ ...node, name: event.target.value });
      },
      [node, onNodeChange]
   );

   // Handle description change
   const handleDescriptionChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
         onNodeChange({
            ...node,
            properties: { ...node.properties, description: event.target.value }
         });
      },
      [node, onNodeChange]
   );

   // Handle reference path change
   const handleReferencePathChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onNodeChange({ ...node, referencePath: event.target.value });
      },
      [node, onNodeChange]
   );

   // Handle test data change
   const handleTestDataChange = React.useCallback(
      (testData: TestData[]) => {
         onNodeChange({ ...node, testData });
      },
      [node, onNodeChange]
   );

   // Handle automation actions change
   const handleAutomationActionsChange = React.useCallback(
      (actions: AutomationAction[]) => {
         onNodeChange({ ...node, automationActions: actions });
      },
      [node, onNodeChange]
   );

   return (
      <Form id={node.id} name={node.name || '子流程节点 (Subprocess)'} iconClass='codicon-symbol-namespace'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='子流程节点 (Subprocess)' disabled />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-id'>节点ID (ID)</label>
               <InputText id='node-id' value={node.id} disabled />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-description'>描述 (Description)</label>
               <InputTextarea
                  id='node-description'
                  value={node.properties.description || ''}
                  onChange={handleDescriptionChange}
                  disabled={readonly}
                  rows={3}
                  autoResize
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-position'>位置 (Position)</label>
               <InputText id='node-position' value={`X: ${node.position.x}, Y: ${node.position.y}`} disabled />
            </div>
         </FormSection>

         {/* Subprocess configuration section */}
         <FormSection label='子流程配置 (Subprocess Configuration)'>
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
               <span style={{ fontSize: '20px' }}>ℹ️</span>
               <span>子流程节点允许嵌套引用其他工作流程 (Subprocess nodes can reference other workflows)</span>
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='reference-path'>引用路径 (Reference Path)</label>
               <InputText
                  id='reference-path'
                  value={node.referencePath || ''}
                  onChange={handleReferencePathChange}
                  disabled={readonly}
                  placeholder='输入子流程路径，如: /workflows/subprocess1'
               />
               <small className='p-d-block p-mt-1' style={{ color: '#6b7280' }}>
                  输入要引用的子流程文件路径 (Enter the path to the subprocess file)
               </small>
            </div>

            {/* Available subprocesses list */}
            {availableSubprocesses.length > 0 && (
               <div className='p-field p-fluid'>
                  <label>可用子流程 (Available Subprocesses)</label>
                  <div
                     style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflow: 'auto'
                     }}
                  >
                     {availableSubprocesses.map(subprocess => (
                        <div
                           key={subprocess.path}
                           style={{
                              padding: '8px 12px',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: readonly ? 'default' : 'pointer',
                              background: node.referencePath === subprocess.path ? '#dbeafe' : 'transparent'
                           }}
                           onClick={() => !readonly && onNodeChange({ ...node, referencePath: subprocess.path })}
                        >
                           <div style={{ fontWeight: 500 }}>{subprocess.name}</div>
                           <div style={{ fontSize: '12px', color: '#6b7280' }}>{subprocess.path}</div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </FormSection>

         {/* Test data section */}
         <FormSection label='测试数据 (Test Data)' defaultCollapsed>
            <TestDataForm
               testData={node.testData || []}
               onChange={handleTestDataChange}
               availableEdges={availableEdges}
               readonly={readonly}
            />
         </FormSection>

         {/* Automation actions section */}
         <FormSection label='自动化动作 (Automation Actions)' defaultCollapsed>
            <AutomationActionForm
               actions={node.automationActions || []}
               onChange={handleAutomationActionsChange}
               availableEdges={availableEdges}
               readonly={readonly}
            />
         </FormSection>
      </Form>
   );
}

export default SubprocessNodeForm;
