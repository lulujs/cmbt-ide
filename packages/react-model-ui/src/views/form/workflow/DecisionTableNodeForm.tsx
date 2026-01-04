/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 决策表节点表单组件
 * Decision table node form component
 * 需求 2.1-2.5: 决策表功能
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, DecisionTableData, DecisionTableNode, TestData } from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { DecisionTableEditor } from '../../common/DecisionTableEditor';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 决策表节点表单属性
 * Decision table node form props
 */
export interface DecisionTableNodeFormProps {
   node: DecisionTableNode;
   onNodeChange: (node: DecisionTableNode) => void;
   onEdgeValuesGenerated?: (edgeValues: string[]) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 决策表节点表单组件
 * Decision table node form component
 */
export function DecisionTableNodeForm({
   node,
   onNodeChange,
   onEdgeValuesGenerated,
   availableEdges = [],
   readonly = false
}: DecisionTableNodeFormProps): React.ReactElement {
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

   // Handle decision table data change
   const handleTableDataChange = React.useCallback(
      (tableData: DecisionTableData, generatedEdgeValues: string[]) => {
         onNodeChange({ ...node, tableData });
         onEdgeValuesGenerated?.(generatedEdgeValues);
      },
      [node, onNodeChange, onEdgeValuesGenerated]
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
      <Form id={node.id} name={node.name || '决策表节点 (Decision Table)'} iconClass='codicon-table'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='决策表节点 (Decision Table)' disabled />
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

         {/* Decision table section */}
         <FormSection label='决策表 (Decision Table)'>
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
                  <span style={{ fontSize: '20px' }}>ℹ️</span>
                  <span style={{ fontWeight: 'bold' }}>决策表使用说明 (Decision Table Instructions)</span>
               </div>
               <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '14px' }}>
                  <li>输入列 (Input): 决策的输入条件</li>
                  <li>决策列 (Decision): 决策逻辑，内容不能完全相同</li>
                  <li>输出列 (Output): 决策结果，用于生成输出边</li>
               </ul>
            </div>

            <DecisionTableEditor data={node.tableData} onChange={handleTableDataChange} readonly={readonly} />
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

export default DecisionTableNodeForm;
