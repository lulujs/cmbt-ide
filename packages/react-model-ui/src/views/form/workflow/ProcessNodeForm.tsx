/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 过程节点表单组件
 * Process node form component
 * 需求 1.4: 过程节点只允许一条出边
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, ProcessNode, TestData } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 过程节点表单属性
 * Process node form props
 */
export interface ProcessNodeFormProps {
   node: ProcessNode;
   onNodeChange: (node: ProcessNode) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 过程节点表单组件
 * Process node form component
 */
export function ProcessNodeForm({ node, onNodeChange, availableEdges = [], readonly = false }: ProcessNodeFormProps): React.ReactElement {
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
      <Form id={node.id} name={node.name || '过程节点 (Process)'} iconClass='codicon-symbol-method'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='过程节点 (Process)' disabled />
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

         {/* Constraint info */}
         <div
            style={{
               background: '#dbeafe',
               border: '1px solid #3b82f6',
               borderRadius: '8px',
               padding: '12px',
               margin: '16px 0',
               display: 'flex',
               alignItems: 'center',
               gap: '8px'
            }}
         >
            <span style={{ fontSize: '20px' }}>ℹ️</span>
            <span>过程节点只允许一条出边 (Process nodes allow only one outgoing edge)</span>
         </div>

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

export default ProcessNodeForm;
