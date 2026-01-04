/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import * as React from 'react';
import { Header } from './Header';

/**
 * 引用节点属性接口
 * Reference node properties interface
 */
export interface ReferenceNodeProperties {
   id: string;
   name: string;
   type: string;
   sourceNodeId: string;
   sourceNodeName?: string;
   isReference: true;
   stepDisplay?: boolean;
   description?: string;
   position?: { x: number; y: number };
}

/**
 * 引用节点表单属性
 * Reference node form props
 */
export interface ReferenceNodeFormProps {
   node: ReferenceNodeProperties;
   onNameChange?: (name: string) => void;
   onStepDisplayChange?: (stepDisplay: boolean) => void;
   readOnly?: boolean;
}

/**
 * 可编辑属性列表
 * List of editable properties
 * 需求 4.4: 引用节点只允许修改节点名称和步骤显示按钮
 *
 * Note: This constant documents the editable properties for reference nodes.
 * The actual enforcement is done in the ReferenceManager class.
 */
export const REFERENCE_EDITABLE_PROPERTIES = ['name', 'stepDisplay'] as const;

/**
 * 引用节点表单组件
 * Reference node form component
 * 需求 4.4-4.5: 实现引用节点的特殊编辑界面
 */
export function ReferenceNodeForm({
   node,
   onNameChange,
   onStepDisplayChange,
   readOnly = false
}: ReferenceNodeFormProps): React.ReactElement {
   const [name, setName] = React.useState(node.name);
   const [stepDisplay, setStepDisplay] = React.useState(node.stepDisplay ?? false);

   // Handle name change
   const handleNameChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         const newName = event.target.value;
         setName(newName);
         onNameChange?.(newName);
      },
      [onNameChange]
   );

   // Handle step display change
   const handleStepDisplayChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         const newValue = event.target.checked;
         setStepDisplay(newValue);
         onStepDisplayChange?.(newValue);
      },
      [onStepDisplayChange]
   );

   return (
      <>
         <Header name={`引用节点: ${node.name}`} id={node.id} iconClass='codicon-references' />
         <div className='reference-node-form' style={{ margin: '3px 24px 0px 24px' }}>
            {/* Reference indicator banner */}
            <div
               className='reference-banner'
               style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
               }}
            >
               <span className='reference-icon' style={{ fontSize: '20px' }}>
                  🔗
               </span>
               <span className='reference-text'>
                  此节点是 <strong>{node.sourceNodeName || node.sourceNodeId}</strong> 的引用
               </span>
            </div>

            {/* Editable properties section */}
            <fieldset
               className='editable-section'
               style={{
                  border: '2px solid #6366f1',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
               }}
            >
               <legend style={{ color: '#6366f1', fontWeight: 'bold' }}>可编辑属性 (Editable Properties)</legend>

               {/* Name field - editable */}
               <div className='form-field' style={{ marginBottom: '12px' }}>
                  <label htmlFor='node-name' style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                     节点名称 (Name)
                     <span
                        className='editable-badge'
                        style={{
                           background: '#dcfce7',
                           color: '#166534',
                           padding: '2px 6px',
                           borderRadius: '4px',
                           fontSize: '12px',
                           marginLeft: '8px'
                        }}
                     >
                        ✏️ 可编辑
                     </span>
                  </label>
                  <input
                     id='node-name'
                     type='text'
                     value={name}
                     onChange={handleNameChange}
                     disabled={readOnly}
                     className='form-input'
                     style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                     }}
                  />
               </div>

               {/* Step display field - editable */}
               <div className='form-field checkbox-field' style={{ marginBottom: '12px' }}>
                  <label htmlFor='step-display' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <input
                        id='step-display'
                        type='checkbox'
                        checked={stepDisplay}
                        onChange={handleStepDisplayChange}
                        disabled={readOnly}
                     />
                     显示步骤按钮 (Step Display)
                     <span
                        className='editable-badge'
                        style={{
                           background: '#dcfce7',
                           color: '#166534',
                           padding: '2px 6px',
                           borderRadius: '4px',
                           fontSize: '12px',
                           marginLeft: '8px'
                        }}
                     >
                        ✏️ 可编辑
                     </span>
                  </label>
               </div>
            </fieldset>

            {/* Read-only properties section */}
            <fieldset
               className='readonly-section'
               style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  background: '#f9fafb'
               }}
            >
               <legend style={{ color: '#6b7280' }}>只读属性 (Read-only Properties)</legend>

               {/* ID field - read-only */}
               <div className='form-field readonly' style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                     节点 ID (Node ID)
                     <span className='readonly-badge' style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                        🔒 只读
                     </span>
                  </label>
                  <input
                     type='text'
                     value={node.id}
                     disabled
                     className='form-input readonly'
                     style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: '#f3f4f6',
                        color: '#6b7280'
                     }}
                  />
               </div>

               {/* Type field - read-only */}
               <div className='form-field readonly' style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                     节点类型 (Node Type)
                     <span className='readonly-badge' style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                        🔒 只读
                     </span>
                  </label>
                  <input
                     type='text'
                     value={node.type}
                     disabled
                     className='form-input readonly'
                     style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: '#f3f4f6',
                        color: '#6b7280'
                     }}
                  />
               </div>

               {/* Source node field - read-only */}
               <div className='form-field readonly' style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                     源节点 (Source Node)
                     <span className='readonly-badge' style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                        🔒 只读
                     </span>
                  </label>
                  <input
                     type='text'
                     value={node.sourceNodeName || node.sourceNodeId}
                     disabled
                     className='form-input readonly'
                     style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        background: '#f3f4f6',
                        color: '#6b7280'
                     }}
                  />
               </div>

               {/* Description field - read-only (inherited from source) */}
               {node.description && (
                  <div className='form-field readonly' style={{ marginBottom: '12px' }}>
                     <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                        描述 (Description)
                        <span className='readonly-badge' style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                           🔒 继承自源节点
                        </span>
                     </label>
                     <textarea
                        value={node.description}
                        disabled
                        className='form-textarea readonly'
                        style={{
                           width: '100%',
                           padding: '8px 12px',
                           border: '1px solid #d1d5db',
                           borderRadius: '4px',
                           background: '#f3f4f6',
                           color: '#6b7280',
                           minHeight: '60px'
                        }}
                     />
                  </div>
               )}

               {/* Position field - read-only */}
               {node.position && (
                  <div className='form-field readonly' style={{ marginBottom: '12px' }}>
                     <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                        位置 (Position)
                        <span className='readonly-badge' style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                           🔒 只读
                        </span>
                     </label>
                     <input
                        type='text'
                        value={`X: ${node.position.x}, Y: ${node.position.y}`}
                        disabled
                        className='form-input readonly'
                        style={{
                           width: '100%',
                           padding: '8px 12px',
                           border: '1px solid #d1d5db',
                           borderRadius: '4px',
                           background: '#f3f4f6',
                           color: '#6b7280'
                        }}
                     />
                  </div>
               )}
            </fieldset>

            {/* Help text */}
            <div
               className='help-text'
               style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px'
               }}
            >
               <p style={{ margin: '0 0 8px 0' }}>
                  <strong>提示:</strong> 引用节点只允许修改名称和步骤显示按钮。 其他属性将自动与源节点保持同步。
               </p>
               <p style={{ margin: 0 }}>
                  <strong>Tip:</strong> Reference nodes only allow editing name and step display. Other properties are automatically synced
                  with the source node.
               </p>
            </div>
         </div>
      </>
   );
}

export default ReferenceNodeForm;
