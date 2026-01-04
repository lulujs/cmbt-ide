/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 分支节点表单组件
 * Decision node form component
 * 需求 1.5: 分支节点默认两条输出边
 * 需求 1.6: 分支节点所有输出边的值不相同
 * 需求 8.3: 提供结构化的表单编辑器
 */

import { AutomationAction, BranchCondition, DecisionNode, TestData } from '@crossmodel/protocol';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 分支节点表单属性
 * Decision node form props
 */
export interface DecisionNodeFormProps {
   node: DecisionNode;
   onNodeChange: (node: DecisionNode) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 验证分支条件唯一性
 * Validate branch condition uniqueness
 */
function validateBranchUniqueness(branches: BranchCondition[]): { isValid: boolean; duplicates: string[] } {
   const values = branches.map(b => b.value);
   const duplicates: string[] = [];
   const seen = new Set<string>();

   for (const value of values) {
      if (value && seen.has(value)) {
         duplicates.push(value);
      }
      seen.add(value);
   }

   return {
      isValid: duplicates.length === 0,
      duplicates: [...new Set(duplicates)]
   };
}

/**
 * 分支节点表单组件
 * Decision node form component
 */
export function DecisionNodeForm({ node, onNodeChange, availableEdges = [], readonly = false }: DecisionNodeFormProps): React.ReactElement {
   // Validate branch uniqueness
   const branchValidation = React.useMemo(() => validateBranchUniqueness(node.branches), [node.branches]);

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

   // Handle branch value change
   const handleBranchValueChange = React.useCallback(
      (index: number, value: string) => {
         const newBranches = [...node.branches];
         newBranches[index] = { ...newBranches[index], value };
         onNodeChange({ ...node, branches: newBranches });
      },
      [node, onNodeChange]
   );

   // Handle branch default change
   const handleBranchDefaultChange = React.useCallback(
      (index: number, isDefault: boolean) => {
         const newBranches = node.branches.map((branch, i) => ({
            ...branch,
            isDefault: i === index ? isDefault : false // Only one default allowed
         }));
         onNodeChange({ ...node, branches: newBranches });
      },
      [node, onNodeChange]
   );

   // Add new branch
   const handleAddBranch = React.useCallback(() => {
      const newBranch: BranchCondition = {
         id: `branch_${Date.now()}`,
         value: '',
         isDefault: false
      };
      onNodeChange({ ...node, branches: [...node.branches, newBranch] });
   }, [node, onNodeChange]);

   // Remove branch
   const handleRemoveBranch = React.useCallback(
      (index: number) => {
         if (node.branches.length <= 2) {
            // Don't allow removing if only 2 branches left
            return;
         }
         const newBranches = node.branches.filter((_, i) => i !== index);
         onNodeChange({ ...node, branches: newBranches });
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
      <Form id={node.id} name={node.name || '分支节点 (Decision)'} iconClass='codicon-git-branch'>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value='分支节点 (Decision)' disabled />
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

         {/* Branch conditions section */}
         <FormSection label='分支条件 (Branch Conditions)'>
            {/* Validation message */}
            {!branchValidation.isValid && (
               <Message
                  severity='error'
                  text={`分支条件值不能重复: ${branchValidation.duplicates.join(', ')} (Branch values must be unique)`}
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
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
               }}
            >
               <span style={{ fontSize: '20px' }}>ℹ️</span>
               <span>分支节点至少需要两条分支，且所有分支值必须唯一 (Decision nodes require at least 2 branches with unique values)</span>
            </div>

            {/* Branch list */}
            <div className='branches-list'>
               {node.branches.map((branch, index) => (
                  <div
                     key={branch.id}
                     className='branch-item'
                     style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        background: branch.isDefault ? '#f0fdf4' : '#ffffff'
                     }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>分支 {index + 1}</span>
                        <Button
                           icon='pi pi-trash'
                           className='p-button-rounded p-button-text p-button-danger p-button-sm'
                           onClick={() => handleRemoveBranch(index)}
                           disabled={readonly || node.branches.length <= 2}
                           tooltip='删除分支 (Delete branch)'
                        />
                     </div>

                     <div className='p-field p-fluid' style={{ marginBottom: '8px' }}>
                        <label htmlFor={`branch-value-${index}`}>条件值 (Condition Value)</label>
                        <InputText
                           id={`branch-value-${index}`}
                           value={branch.value}
                           onChange={e => handleBranchValueChange(index, e.target.value)}
                           disabled={readonly}
                           placeholder='输入条件值'
                           className={branchValidation.duplicates.includes(branch.value) ? 'p-invalid' : ''}
                        />
                     </div>

                     <div className='p-field-checkbox'>
                        <Checkbox
                           inputId={`branch-default-${index}`}
                           checked={branch.isDefault || false}
                           onChange={e => handleBranchDefaultChange(index, e.checked || false)}
                           disabled={readonly}
                        />
                        <label htmlFor={`branch-default-${index}`} style={{ marginLeft: '8px' }}>
                           默认分支 (Default Branch)
                        </label>
                     </div>
                  </div>
               ))}
            </div>

            {/* Add branch button */}
            <Button
               label='添加分支 (Add Branch)'
               icon='pi pi-plus'
               onClick={handleAddBranch}
               disabled={readonly}
               className='p-button-outlined'
            />
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

export default DecisionNodeForm;
