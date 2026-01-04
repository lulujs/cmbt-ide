/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Property-Based Tests: Node Creation Constraints
 * 属性测试: 节点创建约束
 *
 * **Feature: business-process-modeling, Properties 1-3: Node Creation Constraints**
 * **Validates: Requirements 1.1-1.3**
 *
 * This test file verifies the correctness properties for node creation:
 * - Property 1: Begin nodes have no expected value
 * - Property 2: End nodes have expected value
 * - Property 3: Exception nodes are special end nodes with expected value
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import * as fc from 'fast-check';
import { BeginNode, EndNode, ExceptionNode } from '../../src/workflow/node';
import { BeginNodeManager, EndNodeManager, ExceptionNodeManager, NodeFactory } from '../../src/workflow/node-manager';
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
 * Arbitrary for generating expected values (various types)
 * Note: undefined is converted to null by the implementation, so we exclude it
 * from the arbitrary to test the exact value matching
 */
const expectedValueArb = fc.oneof(
   fc.string(),
   fc.integer(),
   fc.boolean(),
   fc.constant(null),
   fc.record({ status: fc.string(), code: fc.integer() })
);

/**
 * Arbitrary for generating node properties
 */
const nodePropertiesArb = fc.record({
   description: fc.option(fc.string(), { nil: undefined }),
   stepDisplay: fc.option(fc.boolean(), { nil: undefined })
});

describe('Node Creation Property Tests', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   /**
    * **Feature: business-process-modeling, Property 1: 开始节点无预期值约束**
    * **Validates: Requirements 1.1**
    *
    * Property: For any begin node creation request, the created node should not
    * contain an expectedValue property.
    *
    * 属性: 对于任何开始节点的创建请求，创建的节点应该不包含预期值属性
    */
   test('Property 1: Begin nodes have no expected value constraint', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
            // Create a begin node with the generated parameters
            const manager = new BeginNodeManager({
               id: NodeFactory.generateNodeId('begin'),
               name,
               position,
               properties
            });

            const node = manager.getNode();

            // Property 1: Begin node should NOT have expectedValue property
            expect('expectedValue' in node).toBe(false);

            // Additional invariants:
            // - Node type should be BEGIN
            expect(node.type).toBe(NodeType.BEGIN);

            // - Node should have the correct name
            expect(node.name).toBe(name);

            // - Node should have the correct position
            expect(node.position).toEqual(position);

            // - Validation should pass (no errors about expectedValue)
            const validation = manager.validate();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 2: 结束节点预期值约束**
    * **Validates: Requirements 1.2**
    *
    * Property: For any end node creation request, the created node should
    * contain an expectedValue property.
    *
    * 属性: 对于任何结束节点的创建请求，创建的节点应该包含预期值属性
    */
   test('Property 2: End nodes have expected value constraint', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, expectedValueArb, nodePropertiesArb, (name, position, expectedValue, properties) => {
            // Create an end node with the generated parameters
            const manager = new EndNodeManager({
               id: NodeFactory.generateNodeId('end'),
               name,
               position,
               properties,
               expectedValue
            });

            const node = manager.getNode();

            // Property 2: End node MUST have expectedValue property
            expect('expectedValue' in node).toBe(true);

            // The expectedValue should match what was provided
            expect(node.expectedValue).toEqual(expectedValue);

            // Additional invariants:
            // - Node type should be END
            expect(node.type).toBe(NodeType.END);

            // - Node should have the correct name
            expect(node.name).toBe(name);

            // - Node should have the correct position
            expect(node.position).toEqual(position);

            // - Validation should pass
            const validation = manager.validate();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 2.1: End nodes default to null expected value**
    * **Validates: Requirements 1.2**
    *
    * Property: When creating an end node without specifying expectedValue,
    * it should default to null (not undefined).
    */
   test('Property 2.1: End nodes default to null expected value when not specified', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
            // Create an end node WITHOUT specifying expectedValue
            const manager = new EndNodeManager({
               id: NodeFactory.generateNodeId('end'),
               name,
               position,
               properties
               // Note: expectedValue is not provided
            });

            const node = manager.getNode();

            // Property: End node should have expectedValue property set to null
            expect('expectedValue' in node).toBe(true);
            expect(node.expectedValue).toBeNull();

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 3: 异常节点特殊结束约束**
    * **Validates: Requirements 1.3**
    *
    * Property: For any exception node creation request, the created node should
    * be a special end node type with an expectedValue property.
    *
    * 属性: 对于任何异常节点的创建请求，创建的节点应该是结束节点的特殊类型且包含预期值属性
    */
   test('Property 3: Exception nodes are special end nodes with expected value', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, expectedValueArb, nodePropertiesArb, (name, position, expectedValue, properties) => {
            // Create an exception node with the generated parameters
            const manager = new ExceptionNodeManager({
               id: NodeFactory.generateNodeId('exception'),
               name,
               position,
               properties,
               expectedValue
            });

            const node = manager.getNode();

            // Property 3.1: Exception node MUST have expectedValue property
            expect('expectedValue' in node).toBe(true);

            // The expectedValue should match what was provided
            expect(node.expectedValue).toEqual(expectedValue);

            // Property 3.2: Exception node type should be EXCEPTION (special end type)
            expect(node.type).toBe(NodeType.EXCEPTION);

            // Additional invariants:
            // - Node should have the correct name
            expect(node.name).toBe(name);

            // - Node should have the correct position
            expect(node.position).toEqual(position);

            // - Validation should pass
            const validation = manager.validate();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * **Feature: business-process-modeling, Property 3.1: Exception nodes default to null expected value**
    * **Validates: Requirements 1.3**
    *
    * Property: When creating an exception node without specifying expectedValue,
    * it should default to null (not undefined).
    */
   test('Property 3.1: Exception nodes default to null expected value when not specified', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
            // Create an exception node WITHOUT specifying expectedValue
            const manager = new ExceptionNodeManager({
               id: NodeFactory.generateNodeId('exception'),
               name,
               position,
               properties
               // Note: expectedValue is not provided
            });

            const node = manager.getNode();

            // Property: Exception node should have expectedValue property set to null
            expect('expectedValue' in node).toBe(true);
            expect(node.expectedValue).toBeNull();

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Combined property test: Node type determines expectedValue presence
    *
    * This test verifies the relationship between node type and expectedValue:
    * - BEGIN nodes: no expectedValue
    * - END nodes: has expectedValue
    * - EXCEPTION nodes: has expectedValue
    */
   test('Combined: Node type determines expectedValue presence', () => {
      fc.assert(
         fc.property(
            fc.constantFrom(NodeType.BEGIN, NodeType.END, NodeType.EXCEPTION),
            nodeNameArb,
            positionArb,
            expectedValueArb,
            (nodeType, name, position, expectedValue) => {
               let node: BeginNode | EndNode | ExceptionNode;

               switch (nodeType) {
                  case NodeType.BEGIN: {
                     const manager = new BeginNodeManager({
                        id: NodeFactory.generateNodeId('begin'),
                        name,
                        position
                     });
                     node = manager.getNode();
                     // BEGIN nodes should NOT have expectedValue
                     expect('expectedValue' in node).toBe(false);
                     break;
                  }
                  case NodeType.END: {
                     const manager = new EndNodeManager({
                        id: NodeFactory.generateNodeId('end'),
                        name,
                        position,
                        expectedValue
                     });
                     node = manager.getNode();
                     // END nodes MUST have expectedValue
                     expect('expectedValue' in node).toBe(true);
                     break;
                  }
                  case NodeType.EXCEPTION: {
                     const manager = new ExceptionNodeManager({
                        id: NodeFactory.generateNodeId('exception'),
                        name,
                        position,
                        expectedValue
                     });
                     node = manager.getNode();
                     // EXCEPTION nodes MUST have expectedValue
                     expect('expectedValue' in node).toBe(true);
                     break;
                  }
               }

               // All nodes should have correct type
               expect(node!.type).toBe(nodeType);

               return true;
            }
         ),
         { numRuns: 100 }
      );
   });

   /**
    * Factory method property test: NodeFactory creates nodes with correct constraints
    */
   test('NodeFactory creates nodes with correct expectedValue constraints', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, expectedValueArb, (name, position, expectedValue) => {
            // Test BeginNode via factory
            const beginManager = NodeFactory.createBeginNode(name, position);
            const beginNode = beginManager.getNode();
            expect('expectedValue' in beginNode).toBe(false);
            expect(beginNode.type).toBe(NodeType.BEGIN);

            // Test EndNode via factory
            const endManager = NodeFactory.createEndNode(name, position, expectedValue);
            const endNode = endManager.getNode();
            expect('expectedValue' in endNode).toBe(true);
            expect(endNode.expectedValue).toEqual(expectedValue);
            expect(endNode.type).toBe(NodeType.END);

            // Test ExceptionNode via factory
            const exceptionManager = NodeFactory.createExceptionNode(name, position, expectedValue);
            const exceptionNode = exceptionManager.getNode();
            expect('expectedValue' in exceptionNode).toBe(true);
            expect(exceptionNode.expectedValue).toEqual(expectedValue);
            expect(exceptionNode.type).toBe(NodeType.EXCEPTION);

            return true;
         }),
         { numRuns: 100 }
      );
   });
});
