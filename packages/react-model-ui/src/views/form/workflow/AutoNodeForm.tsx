/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * Auto节点表单组件
 * Auto node form component
 * 需求 1.10: Auto节点用于自动化对接
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, AutoNode, TestData } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * Auto节点表单属性
 * Auto node form props
 */
export interface AutoNodeFormProps {
   node: AutoNode;
   onNodeChange: (node: AutoNode) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * Auto节点表单组件
 * Auto node form component
 */
export function AutoNodeForm({ node, onNodeChange, availableEdges = [], readonly = false }: AutoNodeFormProps): React.ReactElement {
   const [configError, setConfigError] = React.useState<string | null>(null);

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

   // Handle automation config change
   const handleAutomationConfigChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
         const value = event.target.value;
         try {
            const config = JSON.parse(value);
            onNodeChange({ ...node, automationConfig: config });
            setConfigError(null);
         } catch (e) {
            setConfigError('无效的JSON格式 (Invalid JSON format)');
         }
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

   // Format automation config for display
   const automationConfigDisplay = React.useMemo(() => {
      if (!node.automationConfig) {
         return '{}';
      }
      return JSON.stringify(node.automationConfig, null, 2);
   }, [node.automationConfig]);

   return (
      <Form id={node.id} name={node.name || '自动化节点 (Auto)'} iconClass='codicon-robot'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='自动化节点 (Auto)' disabled />
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

         {/* Automation configuration section */}
         <FormSection label='自动化配置 (Automation Configuration)'>
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
               <span style={{ fontSize: '20px' }}>🤖</span>
               <span>Auto节点用于自动化对接，配置自动化执行参数 (Auto nodes are used for automation integration)</span>
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='automation-config'>配置 (Configuration)</label>
               <InputTextarea
                  id='automation-config'
                  value={automationConfigDisplay}
                  onChange={handleAutomationConfigChange}
                  disabled={readonly}
                  rows={10}
                  autoResize
                  className={configError ? 'p-invalid' : ''}
                  placeholder='输入JSON格式的自动化配置'
               />
               {configError && <small className='p-error'>{configError}</small>}
               <small className='p-d-block p-mt-1' style={{ color: '#6b7280' }}>
                  使用JSON格式配置自动化参数 (Use JSON format for automation parameters)
               </small>
            </div>

            {/* Configuration template */}
            <div className='p-field p-fluid'>
               <label>配置模板 (Configuration Template)</label>
               <div
                  style={{
                     background: '#f3f4f6',
                     border: '1px solid #e5e7eb',
                     borderRadius: '8px',
                     padding: '12px',
                     fontFamily: 'monospace',
                     fontSize: '12px',
                     whiteSpace: 'pre-wrap'
                  }}
               >
                  {`{
  "trigger": "manual | scheduled | event",
  "schedule": "0 0 * * *",
  "retryCount": 3,
  "timeout": 30000,
  "parameters": {
    "key": "value"
  }
}`}
               </div>
            </div>
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

export default AutoNodeForm;
