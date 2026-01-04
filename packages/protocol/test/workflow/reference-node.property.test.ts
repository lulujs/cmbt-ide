/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Property-Based Tests: Reference Node Properties
 * 属性测试: 引用节点属性
 *
 * **Feature: business-process-modeling, Properties 12-13: Reference Node Constraints**
 * **Validates: Requirements 4.2-4.3**
 *
 * This test file verifies the correctness properties for reference nodes:
 * - Property 12: Reference nodes clone properties from source nodes
 * - Property 13: Reference nodes only allow editing name and stepDisplay
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import * as fc from 'fast-check';
import { addNodeToModel, createEmptyWorkflowModel } from '../../src/workflow/model';
import {
   AnyWorkflowNode,
   AutoNode,
   BeginNode,
   DecisionNode,
   EndNode,
   ExceptionNode,
   ProcessNode,
   supportsReference
} from '../../src/workflow/node';
import { NodeFactory, ReferenceNodeManager } from '../../src/workflow/node-manager';
import {
   ReferenceEditableProperty,
   ReferenceManager,
   createReferenceNode,
   validateReferenceClone,
   validateReferenceEditRestriction
} from '../../src/workflow/reference-manager';
import { NodeType, Position } from '../../src/workflow/types';

/**
 * Arbitrary for generating valid node names (alphanumeric with underscores)
 */
const nodeNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{0,19}$/);

/**
 * Arbitrary for generating valid positions
 */
const positionArb: fc.Arbitrary<Position> = fc.record({
   x: fc.integer({ min: 0, max: 10000 }),
   y: fc.integer({ min: 0, max: 10000 })
});

/**
 * Arbitrary for generating node properties
 */
const nodePropertiesArb = fc.record({
   description: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
   stepDisplay: fc.option(fc.boolean(), { nil: undefined })
});

/**
 * Arbitrary for generating expected values
 */
const expectedValueArb = fc.oneof(
   fc.string(),
   fc.integer(),
   fc.boolean(),
   fc.constant(null),
   fc.record({ status: fc.string(), code: fc.integer() })
);

/**
 * Arbitrary for generating branch conditions
 */
const branchConditionArb = fc.record({
   id: fc.stringMatching(/^branch_[0-9]+$/),
   value: fc.string({ minLength: 1, maxLength: 20 }),
   isDefault: fc.option(fc.boolean(), { nil: undefined })
});

/**
 * Arbitrary for generating unique branch arrays (at least 2 branches with unique values)
 */
const uniqueBranchesArb = fc
   .array(branchConditionArb, { minLength: 2, maxLength: 5 })
   .map(branches => {
      // Ensure unique values
      const seen = new Set<string>();
      return branches.filter(b => {
         if (seen.has(b.value)) return false;
         seen.add(b.value);
         return true;
      });
   })
   .filter(branches => branches.length >= 2);

/**
 * Arbitrary for generating referenceable node types
 */
const referenceableNodeTypeArb = fc.constantFrom(
   NodeType.BEGIN,
   NodeType.END,
   NodeType.PROCESS,
   NodeType.DECISION,
   NodeType.AUTO,
   NodeType.EXCEPTION
);

/**
 * Arbitrary for generating a source node based on type
 */
function createSourceNodeArb(nodeType: NodeType): fc.Arbitrary<AnyWorkflowNode> {
   const baseArb = fc.record({
      id: fc.stringMatching(/^[a-z]+_[0-9]+$/),
      name: nodeNameArb,
      position: positionArb,
      properties: nodePropertiesArb
   });

   switch (nodeType) {
      case NodeType.BEGIN:
         return baseArb.map(
            base =>
               ({
                  ...base,
                  type: NodeType.BEGIN
               }) as BeginNode
         );

      case NodeType.END:
         return fc.tuple(baseArb, expectedValueArb).map(
            ([base, expectedValue]) =>
               ({
                  ...base,
                  type: NodeType.END,
                  expectedValue
               }) as EndNode
         );

      case NodeType.EXCEPTION:
         return fc.tuple(baseArb, expectedValueArb).map(
            ([base, expectedValue]) =>
               ({
                  ...base,
                  type: NodeType.EXCEPTION,
                  expectedValue
               }) as ExceptionNode
         );

      case NodeType.PROCESS:
         return baseArb.map(
            base =>
               ({
                  ...base,
                  type: NodeType.PROCESS
               }) as ProcessNode
         );

      case NodeType.DECISION:
         return fc.tuple(baseArb, uniqueBranchesArb).map(
            ([base, branches]) =>
               ({
                  ...base,
                  type: NodeType.DECISION,
                  branches
               }) as DecisionNode
         );

      case NodeType.AUTO:
         return fc.tuple(baseArb, fc.option(fc.record({ script: fc.string() }), { nil: undefined })).map(
            ([base, automationConfig]) =>
               ({
                  ...base,
                  type: NodeType.AUTO,
                  automationConfig
               }) as AutoNode
         );

      default:
         return baseArb.map(
            base =>
               ({
                  ...base,
                  type: NodeType.PROCESS
               }) as ProcessNode
         );
   }
}

/**
 * Arbitrary for generating any referenceable source node
 */
const anyReferenceableNodeArb: fc.Arbitrary<AnyWorkflowNode> = referenceableNodeTypeArb.chain(nodeType => createSourceNodeArb(nodeType));

/**
 * Arbitrary for generating property names (both editable and non-editable)
 */
const editablePropertyArb = fc.constantFrom<ReferenceEditableProperty>('name', 'stepDisplay');
const nonEditablePropertyArb = fc.constantFrom(
   'description',
   'position',
   'type',
   'id',
   'sourceNodeId',
   'isReference',
   'expectedValue',
   'branches',
   'automationConfig'
);
const anyPropertyArb = fc.oneof(editablePropertyArb, nonEditablePropertyArb);

describe('Reference Node Property Tests', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   /**
    * **Feature: business-process-modeling, Property 12: 引用节点克隆属性**
    * **Validates: Requirements 4.2**
    *
    * Property: For any reference node creation operation, the created reference node
    * should contain the same core properties as the source node.
    *
    * 属性: 对于任何引用节点创建操作，创建的引用节点应该包含与源节点相同的核心属性
    */
   test('Property 12: Reference nodes clone properties from source nodes', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, fc.stringMatching(/^ref_[0-9]+$/), (sourceNode, refId) => {
            // Create a reference node from the source
            const refNode = createReferenceNode(sourceNode, refId);

            // Property 12.1: Reference node must have isReference set to true
            expect(refNode.isReference).toBe(true);

            // Property 12.2: Reference node must have correct sourceNodeId
            expect(refNode.sourceNodeId).toBe(sourceNode.id);

            // Property 12.3: Reference node must have same type as source
            expect(refNode.type).toBe(sourceNode.type);

            // Property 12.4: Reference node must have same position as source
            expect(refNode.position).toEqual(sourceNode.position);

            // Property 12.5: Reference node must have editableProperties correctly set
            expect(refNode.editableProperties).toContain('name');
            expect(refNode.editableProperties).toContain('stepDisplay');
            expect(refNode.editableProperties.length).toBe(2);

            // Property 12.6: Validate using the validation function
            const validation = validateReferenceClone(sourceNode, refNode);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 12.1: Reference node name contains source name**
    * **Validates: Requirements 4.2**
    *
    * Property: The reference node name should be derived from the source node name.
    */
   test('Property 12.1: Reference node name is derived from source node name', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, sourceNode => {
            const refNode = createReferenceNode(sourceNode);

            // Reference node name should contain the source node name
            expect(refNode.name).toContain(sourceNode.name);
            // Reference node name should indicate it's a reference
            expect(refNode.name).toContain('Reference');

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 12.2: Reference node preserves type-specific properties**
    * **Validates: Requirements 4.2**
    *
    * Property: Type-specific properties (like expectedValue for EndNode) should be preserved.
    */
   test('Property 12.2: Reference node preserves type-specific properties', () => {
      fc.assert(
         fc.property(
            fc.constantFrom(NodeType.END, NodeType.EXCEPTION),
            nodeNameArb,
            positionArb,
            expectedValueArb,
            (nodeType, name, position, expectedValue) => {
               let sourceNode: EndNode | ExceptionNode;

               if (nodeType === NodeType.END) {
                  sourceNode = {
                     id: 'end_1',
                     type: NodeType.END,
                     name,
                     position,
                     properties: {},
                     expectedValue
                  };
               } else {
                  sourceNode = {
                     id: 'exception_1',
                     type: NodeType.EXCEPTION,
                     name,
                     position,
                     properties: {},
                     expectedValue
                  };
               }

               const refNode = createReferenceNode(sourceNode as AnyWorkflowNode);

               // Type-specific property (expectedValue) should be preserved
               expect('expectedValue' in refNode).toBe(true);
               expect((refNode as any).expectedValue).toEqual(expectedValue);

               return true;
            }
         ),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 13: 引用节点编辑限制**
    * **Validates: Requirements 4.3**
    *
    * Property: For any reference node edit operation, only name and stepDisplay
    * properties should be allowed to be modified.
    *
    * 属性: 对于任何引用节点的编辑操作，只有节点名称和步骤显示按钮属性应该允许修改
    */
   test('Property 13: Reference nodes only allow editing name and stepDisplay', () => {
      fc.assert(
         fc.property(anyPropertyArb, propertyName => {
            const isEditable = propertyName === 'name' || propertyName === 'stepDisplay';

            // Validate using the validation function
            const validation = validateReferenceEditRestriction(propertyName, isEditable);
            expect(validation.isValid).toBe(true);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 13.1: Editable properties can be modified**
    * **Validates: Requirements 4.4**
    *
    * Property: name and stepDisplay properties should be successfully editable.
    */
   test('Property 13.1: Editable properties can be modified on reference nodes', () => {
      fc.assert(
         fc.property(
            anyReferenceableNodeArb,
            editablePropertyArb,
            fc.oneof(fc.string(), fc.boolean()),
            (sourceNode, propertyName, newValue) => {
               // Create a workflow model with the source node
               let model = createEmptyWorkflowModel('test', 'Test');
               model = addNodeToModel(model, sourceNode);

               const manager = new ReferenceManager(model);
               const createResult = manager.createReference(sourceNode.id);

               expect(createResult.success).toBe(true);

               // Edit the editable property
               const editResult = manager.editReferenceNode(
                  createResult.referenceNode!.id,
                  propertyName,
                  propertyName === 'name' ? String(newValue) : Boolean(newValue)
               );

               // Should succeed
               expect(editResult.success).toBe(true);

               return true;
            }
         ),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 13.2: Non-editable properties cannot be modified**
    * **Validates: Requirements 4.5**
    *
    * Property: Properties other than name and stepDisplay should be rejected.
    */
   test('Property 13.2: Non-editable properties cannot be modified on reference nodes', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, nonEditablePropertyArb, fc.string(), (sourceNode, propertyName, newValue) => {
            // Create a workflow model with the source node
            let model = createEmptyWorkflowModel('test', 'Test');
            model = addNodeToModel(model, sourceNode);

            const manager = new ReferenceManager(model);
            const createResult = manager.createReference(sourceNode.id);

            expect(createResult.success).toBe(true);

            // Try to edit the non-editable property
            const editResult = manager.editReferenceNode(createResult.referenceNode!.id, propertyName, newValue);

            // Should fail
            expect(editResult.success).toBe(false);
            expect(editResult.error).toBeDefined();
            expect(editResult.error).toContain('不允许');

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 13.3: ReferenceNodeManager enforces edit restrictions**
    * **Validates: Requirements 4.4-4.5**
    *
    * Property: The ReferenceNodeManager should correctly identify editable properties.
    */
   test('Property 13.3: ReferenceNodeManager correctly identifies editable properties', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, anyPropertyArb, (sourceNode, propertyName) => {
            const manager = new ReferenceNodeManager(sourceNode, 'ref_1');

            const isEditable = manager.isPropertyEditable(propertyName);
            const expectedEditable = propertyName === 'name' || propertyName === 'stepDisplay';

            expect(isEditable).toBe(expectedEditable);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Combined property test: Reference creation and edit restriction
    *
    * This test verifies the complete workflow of creating a reference and
    * attempting to edit various properties.
    */
   test('Combined: Reference creation and edit restriction workflow', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, nodeNameArb, fc.boolean(), (sourceNode, newName, newStepDisplay) => {
            // Create a workflow model with the source node
            let model = createEmptyWorkflowModel('test', 'Test');
            model = addNodeToModel(model, sourceNode);

            const manager = new ReferenceManager(model);

            // Step 1: Create reference
            const createResult = manager.createReference(sourceNode.id);
            expect(createResult.success).toBe(true);
            expect(createResult.referenceNode).toBeDefined();

            const refNode = createResult.referenceNode!;

            // Step 2: Verify clone properties (Property 12)
            expect(refNode.type).toBe(sourceNode.type);
            expect(refNode.sourceNodeId).toBe(sourceNode.id);
            expect(refNode.isReference).toBe(true);

            // Step 3: Edit name (should succeed - Property 13)
            const nameEditResult = manager.editReferenceNode(refNode.id, 'name', newName);
            expect(nameEditResult.success).toBe(true);

            // Step 4: Edit stepDisplay (should succeed - Property 13)
            const stepEditResult = manager.editReferenceNode(refNode.id, 'stepDisplay', newStepDisplay);
            expect(stepEditResult.success).toBe(true);

            // Step 5: Try to edit description (should fail - Property 13)
            const descEditResult = manager.editReferenceNode(refNode.id, 'description', 'test');
            expect(descEditResult.success).toBe(false);

            // Step 6: Verify the edits were applied correctly
            const updatedModel = manager.getModel();
            const updatedRefNode = updatedModel.nodes.get(refNode.id);
            expect(updatedRefNode?.name).toBe(newName);
            expect(updatedRefNode?.properties.stepDisplay).toBe(newStepDisplay);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Property test: Only referenceable node types can be referenced
    *
    * This test verifies that only specific node types support reference creation.
    */
   test('Only referenceable node types support reference creation', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, sourceNode => {
            // All nodes generated by anyReferenceableNodeArb should support references
            expect(supportsReference(sourceNode)).toBe(true);

            // Create a workflow model with the source node
            let model = createEmptyWorkflowModel('test', 'Test');
            model = addNodeToModel(model, sourceNode);

            const manager = new ReferenceManager(model);

            // Should be able to create reference
            expect(manager.canCreateReference(sourceNode.id)).toBe(true);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Property test: Reference nodes cannot be referenced again
    *
    * This test verifies that you cannot create a reference of a reference.
    */
   test('Reference nodes cannot be referenced again', () => {
      fc.assert(
         fc.property(anyReferenceableNodeArb, sourceNode => {
            // Create a workflow model with the source node
            let model = createEmptyWorkflowModel('test', 'Test');
            model = addNodeToModel(model, sourceNode);

            const manager = new ReferenceManager(model);

            // Create first reference
            const firstRef = manager.createReference(sourceNode.id);
            expect(firstRef.success).toBe(true);

            // Try to create reference of the reference
            expect(manager.canCreateReference(firstRef.referenceNode!.id)).toBe(false);

            return true;
         }),
         { numRuns: 100 }
      );
   });
});
