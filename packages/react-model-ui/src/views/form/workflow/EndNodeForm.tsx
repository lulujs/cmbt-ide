/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 结束节点表单组件
 * End node form component
 * 需求 1.2: 结束节点带有预期值
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, EndNode, TestData } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 结束节点表单属性
 * End node form props
 */
export interface EndNodeFormProps {
   node: EndNode;
   onNodeChange: (node: EndNode) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 结束节点表单组件
 * End node form component
 */
export function EndNodeForm({ node, onNodeChange, availableEdges = [], readonly = false }: EndNodeFormProps): React.ReactElement {
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

   // Handle expected value change
   const handleExpectedValueChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
         const value = event.target.value;
         // Try to parse as JSON, otherwise keep as string
         try {
            const parsed = JSON.parse(value);
            onNodeChange({ ...node, expectedValue: parsed });
         } catch {
            onNodeChange({ ...node, expectedValue: value });
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

   // Format expected value for display
   const expectedValueDisplay = React.useMemo(() => {
      if (node.expectedValue === undefined || node.expectedValue === null) {
         return '';
      }
      if (typeof node.expectedValue === 'string') {
         return node.expectedValue;
      }
      return JSON.stringify(node.expectedValue, null, 2);
   }, [node.expectedValue]);

   return (
      <Form id={node.id} name={node.name || '结束节点 (End)'} iconClass='codicon-debug-stop'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='结束节点 (End)' disabled />
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

         {/* Expected value section - required for end nodes */}
         <FormSection label='预期值 (Expected Value)'>
            <div
               style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
               }}
            >
               <span style={{ fontSize: '20px' }}>⚠️</span>
               <span>结束节点必须设置预期值 (End nodes must have an expected value)</span>
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='expected-value'>预期值 (Expected Value)</label>
               <InputTextarea
                  id='expected-value'
                  value={expectedValueDisplay}
                  onChange={handleExpectedValueChange}
                  disabled={readonly}
                  rows={5}
                  autoResize
                  placeholder='输入预期值，可以是字符串或JSON格式'
               />
               <small className='p-d-block p-mt-1' style={{ color: '#6b7280' }}>
                  支持字符串或JSON格式 (Supports string or JSON format)
               </small>
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

export default EndNodeForm;
