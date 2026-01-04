/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 并发节点表单组件
 * Concurrent node form component
 * 需求 1.9: 并发节点支持并行处理
 * 需求 6.1-6.4: 并发流程功能
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, ConcurrentNode, TestData } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 并发节点表单属性
 * Concurrent node form props
 */
export interface ConcurrentNodeFormProps {
   node: ConcurrentNode;
   onNodeChange: (node: ConcurrentNode) => void;
   availableNodes?: Array<{ id: string; name: string }>;
   availableEdges?: Array<{ id: string; name: string }>;
   hasLoop?: boolean;
   readonly?: boolean;
}

/**
 * 并发节点表单组件
 * Concurrent node form component
 */
export function ConcurrentNodeForm({
   node,
   onNodeChange,
   availableNodes = [],
   availableEdges = [],
   hasLoop = false,
   readonly = false
}: ConcurrentNodeFormProps): React.ReactElement {
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

   // Add parallel branch
   const handleAddBranch = React.useCallback(
      (nodeId: string) => {
         if (!node.parallelBranches.includes(nodeId)) {
            onNodeChange({ ...node, parallelBranches: [...node.parallelBranches, nodeId] });
         }
      },
      [node, onNodeChange]
   );

   // Remove parallel branch
   const handleRemoveBranch = React.useCallback(
      (nodeId: string) => {
         onNodeChange({ ...node, parallelBranches: node.parallelBranches.filter(id => id !== nodeId) });
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

   // Get available nodes that are not already in parallel branches
   const availableForBranch = React.useMemo(
      () => availableNodes.filter(n => !node.parallelBranches.includes(n.id)),
      [availableNodes, node.parallelBranches]
   );

   return (
      <Form id={node.id} name={node.name || '并发节点 (Concurrent)'} iconClass='codicon-split-horizontal'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='并发节点 (Concurrent)' disabled />
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

         {/* Parallel branches section */}
         <FormSection label='并行分支 (Parallel Branches)'>
            {/* Loop warning */}
            {hasLoop && (
               <Message
                  severity='error'
                  text='并发流程包含环路，无法保存 (Concurrent process contains a loop and cannot be saved)'
                  className='w-full mb-3'
               />
            )}

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
                  <span style={{ fontWeight: 'bold' }}>并发流程约束 (Concurrent Process Constraints)</span>
               </div>
               <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '14px' }}>
                  <li>内部节点必须从并发开始流向并发结束</li>
                  <li>不能包含环路</li>
                  <li>不能包含开始或结束节点</li>
               </ul>
            </div>

            {/* Current parallel branches */}
            <div className='p-field p-fluid'>
               <label>当前并行分支 (Current Parallel Branches)</label>
               <div
                  style={{
                     border: '1px solid #e5e7eb',
                     borderRadius: '8px',
                     minHeight: '100px',
                     padding: '8px'
                  }}
               >
                  {node.parallelBranches.length === 0 ? (
                     <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>暂无并行分支 (No parallel branches)</div>
                  ) : (
                     node.parallelBranches.map(branchId => {
                        const branchNode = availableNodes.find(n => n.id === branchId);
                        return (
                           <div
                              key={branchId}
                              style={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 padding: '8px 12px',
                                 borderBottom: '1px solid #e5e7eb',
                                 background: '#f9fafb'
                              }}
                           >
                              <div>
                                 <div style={{ fontWeight: 500 }}>{branchNode?.name || branchId}</div>
                                 <div style={{ fontSize: '12px', color: '#6b7280' }}>{branchId}</div>
                              </div>
                              <Button
                                 icon='pi pi-times'
                                 className='p-button-rounded p-button-text p-button-danger p-button-sm'
                                 onClick={() => handleRemoveBranch(branchId)}
                                 disabled={readonly}
                                 tooltip='移除分支 (Remove branch)'
                              />
                           </div>
                        );
                     })
                  )}
               </div>
            </div>

            {/* Add branch */}
            {availableForBranch.length > 0 && !readonly && (
               <div className='p-field p-fluid'>
                  <label>添加并行分支 (Add Parallel Branch)</label>
                  <div
                     style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflow: 'auto'
                     }}
                  >
                     {availableForBranch.map(availableNode => (
                        <div
                           key={availableNode.id}
                           style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer'
                           }}
                           onClick={() => handleAddBranch(availableNode.id)}
                        >
                           <div>
                              <div style={{ fontWeight: 500 }}>{availableNode.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{availableNode.id}</div>
                           </div>
                           <Button icon='pi pi-plus' className='p-button-rounded p-button-text p-button-success p-button-sm' />
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

export default ConcurrentNodeForm;
