/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * API节点表单组件
 * API node form component
 * 需求 1.11: API节点用于绑定统一自动化平台单接口实例
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { ApiNode, AutomationAction, TestData } from '@crossmodel/protocol';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * API节点表单属性
 * API node form props
 */
export interface ApiNodeFormProps {
   node: ApiNode;
   onNodeChange: (node: ApiNode) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * HTTP方法选项
 * HTTP method options
 */
const httpMethodOptions = [
   { label: 'GET', value: 'GET' },
   { label: 'POST', value: 'POST' },
   { label: 'PUT', value: 'PUT' },
   { label: 'DELETE', value: 'DELETE' },
   { label: 'PATCH', value: 'PATCH' }
];

/**
 * API节点表单组件
 * API node form component
 */
export function ApiNodeForm({ node, onNodeChange, availableEdges = [], readonly = false }: ApiNodeFormProps): React.ReactElement {
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

   // Handle API endpoint change
   const handleEndpointChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         onNodeChange({ ...node, apiEndpoint: event.target.value });
      },
      [node, onNodeChange]
   );

   // Handle API config change
   const handleApiConfigChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
         const value = event.target.value;
         try {
            const config = JSON.parse(value);
            onNodeChange({ ...node, apiConfig: config });
            setConfigError(null);
         } catch (e) {
            setConfigError('无效的JSON格式 (Invalid JSON format)');
         }
      },
      [node, onNodeChange]
   );

   // Handle HTTP method change
   const handleMethodChange = React.useCallback(
      (method: string) => {
         const currentConfig = node.apiConfig || {};
         onNodeChange({ ...node, apiConfig: { ...currentConfig, method } });
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

   // Format API config for display
   const apiConfigDisplay = React.useMemo(() => {
      if (!node.apiConfig) {
         return '{}';
      }
      return JSON.stringify(node.apiConfig, null, 2);
   }, [node.apiConfig]);

   // Get current HTTP method
   const currentMethod = React.useMemo(() => {
      return (node.apiConfig as Record<string, unknown>)?.method || 'GET';
   }, [node.apiConfig]);

   return (
      <Form id={node.id} name={node.name || 'API节点 (API)'} iconClass='codicon-cloud'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='API节点 (API)' disabled />
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

         {/* API configuration section */}
         <FormSection label='API配置 (API Configuration)'>
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
               <span style={{ fontSize: '20px' }}>☁️</span>
               <span>API节点用于绑定统一自动化平台单接口实例 (API nodes bind to unified automation platform interface instances)</span>
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='api-endpoint'>API端点 (Endpoint)</label>
               <InputText
                  id='api-endpoint'
                  value={node.apiEndpoint || ''}
                  onChange={handleEndpointChange}
                  disabled={readonly}
                  placeholder='https://api.example.com/endpoint'
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='http-method'>HTTP方法 (Method)</label>
               <Dropdown
                  id='http-method'
                  value={currentMethod}
                  options={httpMethodOptions}
                  onChange={e => handleMethodChange(e.value)}
                  disabled={readonly}
                  placeholder='选择HTTP方法'
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='api-config'>详细配置 (Detailed Configuration)</label>
               <InputTextarea
                  id='api-config'
                  value={apiConfigDisplay}
                  onChange={handleApiConfigChange}
                  disabled={readonly}
                  rows={10}
                  autoResize
                  className={configError ? 'p-invalid' : ''}
                  placeholder='输入JSON格式的API配置'
               />
               {configError && <small className='p-error'>{configError}</small>}
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
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{token}}"
  },
  "body": {
    "key": "value"
  },
  "timeout": 30000,
  "retryCount": 3,
  "authentication": {
    "type": "bearer | basic | apiKey",
    "credentials": {}
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

export default ApiNodeForm;
