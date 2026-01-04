/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import { addNodeToModel, createEmptyWorkflowModel, WorkflowModel } from '../../src/workflow/model';
import { AutoNode, BeginNode, DecisionNode, EndNode, ExceptionNode, ProcessNode } from '../../src/workflow/node';
import { NodeFactory } from '../../src/workflow/node-manager';
import {
   createReferenceNode,
   ReferenceManager,
   validateReferenceClone,
   validateReferenceEditRestriction
} from '../../src/workflow/reference-manager';
import { NodeType, Position } from '../../src/workflow/types';

/**
 * Create test position
 */
function createTestPosition(x: number = 0, y: number = 0): Position {
   return { x, y };
}

/**
 * Create a test workflow model with some nodes
 */
function createTestModel(): WorkflowModel {
   let model = createEmptyWorkflowModel('test_workflow', 'Test Workflow');

   const beginNode: BeginNode = {
      id: 'begin_1',
      type: NodeType.BEGIN,
      name: 'Start',
      position: createTestPosition(0, 0),
      properties: {}
   };

   const processNode: ProcessNode = {
      id: 'process_1',
      type: NodeType.PROCESS,
      name: 'Process Step',
      position: createTestPosition(100, 0),
      properties: { description: 'A process step' }
   };

   const decisionNode: DecisionNode = {
      id: 'decision_1',
      type: NodeType.DECISION,
      name: 'Decision',
      position: createTestPosition(200, 0),
      properties: {},
      branches: [
         { id: 'branch_1', value: 'yes' },
         { id: 'branch_2', value: 'no' }
      ]
   };

   const endNode: EndNode = {
      id: 'end_1',
      type: NodeType.END,
      name: 'End',
      position: createTestPosition(300, 0),
      properties: {},
      expectedValue: 'success'
   };

   const autoNode: AutoNode = {
      id: 'auto_1',
      type: NodeType.AUTO,
      name: 'Auto Step',
      position: createTestPosition(400, 0),
      properties: {},
      automationConfig: { script: 'test.js' }
   };

   const exceptionNode: ExceptionNode = {
      id: 'exception_1',
      type: NodeType.EXCEPTION,
      name: 'Exception',
      position: createTestPosition(500, 0),
      properties: {},
      expectedValue: 'error'
   };

   model = addNodeToModel(model, beginNode);
   model = addNodeToModel(model, processNode);
   model = addNodeToModel(model, decisionNode);
   model = addNodeToModel(model, endNode);
   model = addNodeToModel(model, autoNode);
   model = addNodeToModel(model, exceptionNode);

   return model;
}

describe('ReferenceManager', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   describe('canCreateReference', () => {
      test('should return true for referenceable node types - 需求 4.1', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         // These types should support references
         expect(manager.canCreateReference('begin_1')).toBe(true);
         expect(manager.canCreateReference('end_1')).toBe(true);
         expect(manager.canCreateReference('process_1')).toBe(true);
         expect(manager.canCreateReference('decision_1')).toBe(true);
         expect(manager.canCreateReference('auto_1')).toBe(true);
         expect(manager.canCreateReference('exception_1')).toBe(true);
      });

      test('should return false for non-existent nodes', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         expect(manager.canCreateReference('non_existent')).toBe(false);
      });

      test('should return false for reference nodes (cannot reference a reference)', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         // Create a reference first
         const result = manager.createReference('process_1');
         expect(result.success).toBe(true);

         // Try to create a reference of the reference
         expect(manager.canCreateReference(result.referenceNode!.id)).toBe(false);
      });
   });

   describe('createReference', () => {
      test('should create a reference node from source node - 需求 4.2, 属性 12', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createReference('process_1');

         expect(result.success).toBe(true);
         expect(result.referenceNode).toBeDefined();
         expect(result.referenceNode!.sourceNodeId).toBe('process_1');
         expect(result.referenceNode!.isReference).toBe(true);
         expect(result.referenceNode!.type).toBe(NodeType.PROCESS);
         expect(result.referenceNode!.name).toContain('Process Step');
         expect(result.referenceNode!.name).toContain('Reference');
      });

      test('should fail when source node does not exist', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createReference('non_existent');

         expect(result.success).toBe(false);
         expect(result.error).toContain('不存在');
      });

      test('should add reference node to model', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createReference('process_1');
         expect(result.success).toBe(true);

         const updatedModel = manager.getModel();
         expect(updatedModel.nodes.has(result.referenceNode!.id)).toBe(true);
      });

      test('should clone properties from source node - 属性 12', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createReference('process_1');
         expect(result.success).toBe(true);

         const refNode = result.referenceNode!;
         const sourceNode = model.nodes.get('process_1') as ProcessNode;

         // Type should match
         expect(refNode.type).toBe(sourceNode.type);
         // Position should be cloned
         expect(refNode.position).toEqual(sourceNode.position);
      });
   });

   describe('createBatchReferences', () => {
      test('should create multiple reference nodes - 需求 4.3', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createBatchReferences(['process_1', 'decision_1', 'auto_1']);

         expect(result.success).toBe(true);
         expect(result.totalRequested).toBe(3);
         expect(result.totalCreated).toBe(3);
         expect(result.referenceNodes).toHaveLength(3);
         expect(result.errors).toHaveLength(0);
      });

      test('should handle partial failures in batch creation', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const result = manager.createBatchReferences(['process_1', 'non_existent', 'auto_1']);

         expect(result.success).toBe(false);
         expect(result.totalRequested).toBe(3);
         expect(result.totalCreated).toBe(2);
         expect(result.referenceNodes).toHaveLength(2);
         expect(result.errors).toHaveLength(1);
         expect(result.errors[0].nodeId).toBe('non_existent');
      });
   });

   describe('isPropertyEditable', () => {
      test('should return true for name and stepDisplay - 需求 4.4, 属性 13', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         expect(manager.isPropertyEditable('name')).toBe(true);
         expect(manager.isPropertyEditable('stepDisplay')).toBe(true);
      });

      test('should return false for other properties - 需求 4.5', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         expect(manager.isPropertyEditable('description')).toBe(false);
         expect(manager.isPropertyEditable('position')).toBe(false);
         expect(manager.isPropertyEditable('type')).toBe(false);
         expect(manager.isPropertyEditable('id')).toBe(false);
         expect(manager.isPropertyEditable('sourceNodeId')).toBe(false);
      });
   });

   describe('editReferenceNode', () => {
      test('should allow editing name - 需求 4.4', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const editResult = manager.editReferenceNode(createResult.referenceNode!.id, 'name', 'New Reference Name');

         expect(editResult.success).toBe(true);

         const updatedModel = manager.getModel();
         const refNode = updatedModel.nodes.get(createResult.referenceNode!.id);
         expect(refNode?.name).toBe('New Reference Name');
      });

      test('should allow editing stepDisplay - 需求 4.4', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const editResult = manager.editReferenceNode(createResult.referenceNode!.id, 'stepDisplay', true);

         expect(editResult.success).toBe(true);

         const updatedModel = manager.getModel();
         const refNode = updatedModel.nodes.get(createResult.referenceNode!.id);
         expect(refNode?.properties.stepDisplay).toBe(true);
      });

      test('should reject editing non-editable properties - 需求 4.5, 属性 13', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const editResult = manager.editReferenceNode(createResult.referenceNode!.id, 'description', 'New description');

         expect(editResult.success).toBe(false);
         expect(editResult.error).toContain('不允许');
      });

      test('should fail for non-existent reference node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const editResult = manager.editReferenceNode('non_existent', 'name', 'New Name');

         expect(editResult.success).toBe(false);
         expect(editResult.error).toContain('不存在');
      });

      test('should fail for non-reference nodes', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const editResult = manager.editReferenceNode('process_1', 'name', 'New Name');

         expect(editResult.success).toBe(false);
         expect(editResult.error).toContain('不是引用节点');
      });
   });

   describe('getReferencesForNode', () => {
      test('should return all references for a source node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         // Create multiple references for the same source
         manager.createReference('process_1');
         manager.createReference('process_1');
         manager.createReference('process_1');

         const references = manager.getReferencesForNode('process_1');
         expect(references).toHaveLength(3);
         references.forEach(ref => {
            expect(ref.sourceNodeId).toBe('process_1');
         });
      });

      test('should return empty array for node with no references', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const references = manager.getReferencesForNode('process_1');
         expect(references).toHaveLength(0);
      });
   });

   describe('getSourceNode', () => {
      test('should return source node for a reference', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const sourceNode = manager.getSourceNode(createResult.referenceNode!.id);
         expect(sourceNode).toBeDefined();
         expect(sourceNode!.id).toBe('process_1');
      });

      test('should return undefined for non-reference node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const sourceNode = manager.getSourceNode('process_1');
         expect(sourceNode).toBeUndefined();
      });
   });

   describe('deleteReference', () => {
      test('should delete a reference node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const deleted = manager.deleteReference(createResult.referenceNode!.id);
         expect(deleted).toBe(true);

         const updatedModel = manager.getModel();
         expect(updatedModel.nodes.has(createResult.referenceNode!.id)).toBe(false);
      });

      test('should return false for non-reference node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const deleted = manager.deleteReference('process_1');
         expect(deleted).toBe(false);
      });
   });

   describe('validateReferenceNode', () => {
      test('should validate a valid reference node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         const validation = manager.validateReferenceNode(createResult.referenceNode!.id);
         expect(validation.isValid).toBe(true);
         expect(validation.errors).toHaveLength(0);
      });

      test('should fail validation for non-existent node', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const validation = manager.validateReferenceNode('non_existent');
         expect(validation.isValid).toBe(false);
         expect(validation.errors.some(e => e.includes('不存在'))).toBe(true);
      });
   });

   describe('syncReferenceWithSource', () => {
      test('should sync reference with source while preserving editable properties', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         const createResult = manager.createReference('process_1');
         expect(createResult.success).toBe(true);

         // Edit the reference name
         manager.editReferenceNode(createResult.referenceNode!.id, 'name', 'Custom Name');
         manager.editReferenceNode(createResult.referenceNode!.id, 'stepDisplay', true);

         // Sync with source
         const syncResult = manager.syncReferenceWithSource(createResult.referenceNode!.id);
         expect(syncResult.success).toBe(true);

         // Check that editable properties are preserved
         const updatedModel = manager.getModel();
         const refNode = updatedModel.nodes.get(createResult.referenceNode!.id);
         expect(refNode?.name).toBe('Custom Name');
         expect(refNode?.properties.stepDisplay).toBe(true);
      });
   });

   describe('getReferenceStatistics', () => {
      test('should return correct statistics', () => {
         const model = createTestModel();
         const manager = new ReferenceManager(model);

         manager.createReference('process_1');
         manager.createReference('process_1');
         manager.createReference('decision_1');

         const stats = manager.getReferenceStatistics();
         expect(stats.totalReferences).toBe(3);
         expect(stats.referencedNodes).toBe(2);
         expect(stats.referencesByType.get(NodeType.PROCESS)).toBe(2);
         expect(stats.referencesByType.get(NodeType.DECISION)).toBe(1);
      });
   });

   describe('getReferenceableNodeTypes', () => {
      test('should return correct list of referenceable types', () => {
         const types = ReferenceManager.getReferenceableNodeTypes();

         expect(types).toContain(NodeType.BEGIN);
         expect(types).toContain(NodeType.END);
         expect(types).toContain(NodeType.PROCESS);
         expect(types).toContain(NodeType.DECISION);
         expect(types).toContain(NodeType.DECISION_TABLE);
         expect(types).toContain(NodeType.AUTO);
         expect(types).toContain(NodeType.EXCEPTION);

         // These should NOT be in the list
         expect(types).not.toContain(NodeType.SUBPROCESS);
         expect(types).not.toContain(NodeType.CONCURRENT);
         expect(types).not.toContain(NodeType.API);
      });
   });
});

describe('Helper Functions', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   describe('createReferenceNode', () => {
      test('should create a reference node from source', () => {
         const sourceNode: ProcessNode = {
            id: 'process_1',
            type: NodeType.PROCESS,
            name: 'Source Process',
            position: createTestPosition(),
            properties: { description: 'Test' }
         };

         const refNode = createReferenceNode(sourceNode, 'ref_1');

         expect(refNode.id).toBe('ref_1');
         expect(refNode.sourceNodeId).toBe('process_1');
         expect(refNode.isReference).toBe(true);
         expect(refNode.type).toBe(NodeType.PROCESS);
      });
   });

   describe('validateReferenceClone', () => {
      test('should validate correct clone - 属性 12', () => {
         const sourceNode: ProcessNode = {
            id: 'process_1',
            type: NodeType.PROCESS,
            name: 'Source Process',
            position: createTestPosition(),
            properties: {}
         };

         const refNode = createReferenceNode(sourceNode, 'ref_1');
         const validation = validateReferenceClone(sourceNode, refNode);

         expect(validation.isValid).toBe(true);
         expect(validation.errors).toHaveLength(0);
      });

      test('should fail validation for mismatched type', () => {
         const sourceNode: ProcessNode = {
            id: 'process_1',
            type: NodeType.PROCESS,
            name: 'Source Process',
            position: createTestPosition(),
            properties: {}
         };

         const refNode = createReferenceNode(sourceNode, 'ref_1');
         // Manually corrupt the type
         (refNode as any).type = NodeType.BEGIN;

         const validation = validateReferenceClone(sourceNode, refNode);
         expect(validation.isValid).toBe(false);
         expect(validation.errors.some(e => e.includes('类型'))).toBe(true);
      });
   });

   describe('validateReferenceEditRestriction', () => {
      test('should validate editable properties - 属性 13', () => {
         // name should be editable
         expect(validateReferenceEditRestriction('name', true).isValid).toBe(true);
         // stepDisplay should be editable
         expect(validateReferenceEditRestriction('stepDisplay', true).isValid).toBe(true);
         // description should NOT be editable
         expect(validateReferenceEditRestriction('description', false).isValid).toBe(true);
         // position should NOT be editable
         expect(validateReferenceEditRestriction('position', false).isValid).toBe(true);
      });

      test('should fail when expectation is wrong', () => {
         // name should be editable, but we expect it not to be
         expect(validateReferenceEditRestriction('name', false).isValid).toBe(false);
         // description should NOT be editable, but we expect it to be
         expect(validateReferenceEditRestriction('description', true).isValid).toBe(false);
      });
   });
});
