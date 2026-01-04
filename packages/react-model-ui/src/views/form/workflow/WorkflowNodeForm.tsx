/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

/**
 * 工作流程节点表单基础组件
 * Workflow node form base component
 * 需求 8.3: 提供结构化的表单编辑器
 */

import {
   AnyWorkflowNode,
   AutomationAction,
   isApiNode,
   isAutoNode,
   isConcurrentNode,
   isDecisionNode,
   isDecisionTableNode,
   isEndNode,
   isExceptionNode,
   isProcessNode,
   isReferenceNode,
   isSubprocessNode,
   NodeType,
   TestData,
   WorkflowNode
} from '@crossmodel/protocol';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import * as React from 'react';
import { FormSection } from '../../FormSection';
import { Form } from '../Form';
import { AutomationActionForm } from './AutomationActionForm';
import { TestDataForm } from './TestDataForm';

/**
 * 节点类型显示名称映射
 * Node type display name mapping
 */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
   [NodeType.BEGIN]: '开始节点 (Begin)',
   [NodeType.END]: '结束节点 (End)',
   [NodeType.EXCEPTION]: '异常节点 (Exception)',
   [NodeType.PROCESS]: '过程节点 (Process)',
   [NodeType.DECISION]: '分支节点 (Decision)',
   [NodeType.DECISION_TABLE]: '决策表节点 (Decision Table)',
   [NodeType.SUBPROCESS]: '子流程节点 (Subprocess)',
   [NodeType.CONCURRENT]: '并发节点 (Concurrent)',
   [NodeType.AUTO]: '自动化节点 (Auto)',
   [NodeType.API]: 'API节点 (API)'
};

/**
 * 节点类型图标映射
 * Node type icon mapping
 */
export const NODE_TYPE_ICONS: Record<NodeType, string> = {
   [NodeType.BEGIN]: 'codicon-debug-start',
   [NodeType.END]: 'codicon-debug-stop',
   [NodeType.EXCEPTION]: 'codicon-error',
   [NodeType.PROCESS]: 'codicon-symbol-method',
   [NodeType.DECISION]: 'codicon-git-branch',
   [NodeType.DECISION_TABLE]: 'codicon-table',
   [NodeType.SUBPROCESS]: 'codicon-symbol-namespace',
   [NodeType.CONCURRENT]: 'codicon-split-horizontal',
   [NodeType.AUTO]: 'codicon-robot',
   [NodeType.API]: 'codicon-cloud'
};

/**
 * 工作流程节点表单属性
 * Workflow node form props
 */
export interface WorkflowNodeFormProps {
   node: AnyWorkflowNode;
   onNodeChange: (node: AnyWorkflowNode) => void;
   onTestDataChange?: (testData: TestData[]) => void;
   onAutomationActionsChange?: (actions: AutomationAction[]) => void;
   availableEdges?: Array<{ id: string; name: string }>;
   readonly?: boolean;
}

/**
 * 工作流程节点表单组件
 * Workflow node form component
 */
export function WorkflowNodeForm({
   node,
   onNodeChange,
   onTestDataChange,
   onAutomationActionsChange,
   availableEdges = [],
   readonly = false
}: WorkflowNodeFormProps): React.ReactElement {
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
         onTestDataChange?.(testData);
      },
      [node, onNodeChange, onTestDataChange]
   );

   // Handle automation actions change
   const handleAutomationActionsChange = React.useCallback(
      (actions: AutomationAction[]) => {
         onNodeChange({ ...node, automationActions: actions });
         onAutomationActionsChange?.(actions);
      },
      [node, onNodeChange, onAutomationActionsChange]
   );

   // Check if node is a reference node
   const isReference = isReferenceNode(node);

   return (
      <Form id={node.id} name={node.name || NODE_TYPE_LABELS[node.type]} iconClass={NODE_TYPE_ICONS[node.type]}>
         {/* General section */}
         <FormSection label='基本信息 (General)'>
            <div className='p-field p-fluid'>
               <label htmlFor='node-name'>节点名称 (Name)</label>
               <InputText id='node-name' value={node.name || ''} onChange={handleNameChange} disabled={readonly} required />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-type'>节点类型 (Type)</label>
               <InputText id='node-type' value={NODE_TYPE_LABELS[node.type]} disabled />
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
                  disabled={readonly || isReference}
                  rows={3}
                  autoResize
               />
            </div>

            <div className='p-field p-fluid'>
               <label htmlFor='node-position'>位置 (Position)</label>
               <InputText id='node-position' value={`X: ${node.position.x}, Y: ${node.position.y}`} disabled />
            </div>
         </FormSection>

         {/* Type-specific section */}
         {renderTypeSpecificSection(node, onNodeChange, readonly)}

         {/* Test data section */}
         <FormSection label='测试数据 (Test Data)' defaultCollapsed>
            <TestDataForm
               testData={node.testData || []}
               onChange={handleTestDataChange}
               availableEdges={availableEdges}
               readonly={readonly || isReference}
            />
         </FormSection>

         {/* Automation actions section */}
         <FormSection label='自动化动作 (Automation Actions)' defaultCollapsed>
            <AutomationActionForm
               actions={node.automationActions || []}
               onChange={handleAutomationActionsChange}
               availableEdges={availableEdges}
               readonly={readonly || isReference}
            />
         </FormSection>
      </Form>
   );
}

/**
 * 渲染类型特定的表单部分
 * Render type-specific form section
 */
function renderTypeSpecificSection(
   node: WorkflowNode,
   onNodeChange: (node: AnyWorkflowNode) => void,
   readonly: boolean
): React.ReactElement | null {
   if (isEndNode(node) || isExceptionNode(node)) {
      return (
         <FormSection label='预期值 (Expected Value)'>
            <div className='p-field p-fluid'>
               <label htmlFor='expected-value'>预期值 (Expected Value)</label>
               <InputTextarea
                  id='expected-value'
                  value={typeof node.expectedValue === 'string' ? node.expectedValue : JSON.stringify(node.expectedValue || '')}
                  onChange={e => onNodeChange({ ...node, expectedValue: e.target.value })}
                  disabled={readonly}
                  rows={3}
                  autoResize
               />
            </div>
         </FormSection>
      );
   }

   if (isDecisionNode(node)) {
      return (
         <FormSection label='分支条件 (Branch Conditions)'>
            <div className='branches-list'>
               {node.branches.map((branch, index) => (
                  <div key={branch.id} className='p-field p-fluid' style={{ marginBottom: '8px' }}>
                     <label>分支 {index + 1}</label>
                     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <InputText
                           value={branch.value}
                           onChange={e => {
                              const newBranches = [...node.branches];
                              newBranches[index] = { ...branch, value: e.target.value };
                              onNodeChange({ ...node, branches: newBranches });
                           }}
                           disabled={readonly}
                           placeholder='条件值'
                           style={{ flex: 1 }}
                        />
                        {branch.isDefault && <span className='p-tag p-tag-info'>默认</span>}
                     </div>
                  </div>
               ))}
            </div>
         </FormSection>
      );
   }

   if (isSubprocessNode(node)) {
      return (
         <FormSection label='子流程配置 (Subprocess Configuration)'>
            <div className='p-field p-fluid'>
               <label htmlFor='reference-path'>引用路径 (Reference Path)</label>
               <InputText
                  id='reference-path'
                  value={node.referencePath || ''}
                  onChange={e => onNodeChange({ ...node, referencePath: e.target.value })}
                  disabled={readonly}
                  placeholder='输入子流程路径'
               />
            </div>
         </FormSection>
      );
   }

   if (isConcurrentNode(node)) {
      return (
         <FormSection label='并发分支 (Parallel Branches)'>
            <div className='p-field p-fluid'>
               <label>并行分支节点 (Parallel Branch Nodes)</label>
               <div className='parallel-branches-list'>
                  {node.parallelBranches.map((branchId, index) => (
                     <div key={branchId} style={{ marginBottom: '4px' }}>
                        <InputText value={branchId} disabled style={{ width: '100%' }} />
                     </div>
                  ))}
                  {node.parallelBranches.length === 0 && <p style={{ color: '#6b7280' }}>暂无并行分支 (No parallel branches)</p>}
               </div>
            </div>
         </FormSection>
      );
   }

   if (isAutoNode(node)) {
      return (
         <FormSection label='自动化配置 (Automation Configuration)'>
            <div className='p-field p-fluid'>
               <label htmlFor='automation-config'>配置 (Configuration)</label>
               <InputTextarea
                  id='automation-config'
                  value={JSON.stringify(node.automationConfig || {}, null, 2)}
                  onChange={e => {
                     try {
                        const config = JSON.parse(e.target.value);
                        onNodeChange({ ...node, automationConfig: config });
                     } catch {
                        // Invalid JSON, ignore
                     }
                  }}
                  disabled={readonly}
                  rows={5}
                  autoResize
               />
            </div>
         </FormSection>
      );
   }

   if (isApiNode(node)) {
      return (
         <FormSection label='API配置 (API Configuration)'>
            <div className='p-field p-fluid'>
               <label htmlFor='api-endpoint'>API端点 (Endpoint)</label>
               <InputText
                  id='api-endpoint'
                  value={node.apiEndpoint || ''}
                  onChange={e => onNodeChange({ ...node, apiEndpoint: e.target.value })}
                  disabled={readonly}
                  placeholder='https://api.example.com/endpoint'
               />
            </div>
            <div className='p-field p-fluid'>
               <label htmlFor='api-config'>API配置 (Configuration)</label>
               <InputTextarea
                  id='api-config'
                  value={JSON.stringify(node.apiConfig || {}, null, 2)}
                  onChange={e => {
                     try {
                        const config = JSON.parse(e.target.value);
                        onNodeChange({ ...node, apiConfig: config });
                     } catch {
                        // Invalid JSON, ignore
                     }
                  }}
                  disabled={readonly}
                  rows={5}
                  autoResize
               />
            </div>
         </FormSection>
      );
   }

   if (isProcessNode(node) || isDecisionTableNode(node)) {
      // Process and Decision Table nodes don't have additional type-specific fields
      // Decision Table has its own dedicated form
      return null;
   }

   return null;
}

export default WorkflowNodeForm;
