/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Property-Based Tests: Node Constraints
 * 属性测试: 节点约束
 *
 * **Feature: business-process-modeling, Properties 4-6: Node Constraints**
 * **Validates: Requirements 1.4-1.6**
 *
 * This test file verifies the correctness properties for node constraints:
 * - Property 4: Process nodes allow only one outgoing edge
 * - Property 5: Decision nodes default to two output branches
 * - Property 6: Decision node branch values must be unique
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import * as fc from 'fast-check';
import { BranchCondition } from '../../src/workflow/node';
import { DecisionNodeManager, NodeFactory, ProcessNodeManager } from '../../src/workflow/node-manager';
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
   description: fc.option(fc.string(), { nil: undefined }),
   stepDisplay: fc.option(fc.boolean(), { nil: undefined })
});

/**
 * Arbitrary for generating unique branch values
 */
const branchValueArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{0,9}$/);

/**
 * Arbitrary for generating a list of unique branch values
 */
const uniqueBranchValuesArb = fc.array(branchValueArb, { minLength: 2, maxLength: 10 }).filter(values => {
   const uniqueSet = new Set(values);
   return uniqueSet.size === values.length;
});

describe('Node Constraints Property Tests', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   // ============================================================================
   // Property 4: Process Node Outgoing Edge Limit
   // 属性 4: 过程节点出边限制
   // ============================================================================

   describe('Property 4: Process Node Outgoing Edge Limit', () => {
      /**
       * **Feature: business-process-modeling, Property 4: 过程节点出边限制**
       * **Validates: Requirements 1.4**
       *
       * Property: For any process node, the number of outgoing edges should not exceed one.
       *
       * 属性: 对于任何过程节点，其输出边的数量应该不超过一条
       */
      test('Property 4: Process nodes with more than one outgoing edge fail validation', () => {
         fc.assert(
            fc.property(
               nodeNameArb,
               positionArb,
               nodePropertiesArb,
               fc.integer({ min: 2, max: 10 }), // More than 1 outgoing edge
               (name, position, properties, outgoingEdgeCount) => {
                  // Create a process node
                  const manager = new ProcessNodeManager({
                     id: NodeFactory.generateNodeId('process'),
                     name,
                     position,
                     properties
                  });

                  const node = manager.getNode();

                  // Verify node type is PROCESS
                  expect(node.type).toBe(NodeType.PROCESS);

                  // Validate with more than 1 outgoing edge - should fail
                  const validation = manager.validate(outgoingEdgeCount);

                  // Property 4: Process node with more than 1 outgoing edge should fail validation
                  expect(validation.isValid).toBe(false);
                  expect(validation.errors.length).toBeGreaterThan(0);
                  expect(validation.errors.some(e => e.includes('过程节点') || e.includes('Process node'))).toBe(true);

                  return true;
               }
            ),
            { numRuns: 100 }
         );
      });

      /**
       * Property 4.1: Process nodes with exactly one outgoing edge pass validation
       */
      test('Property 4.1: Process nodes with exactly one outgoing edge pass validation', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a process node
               const manager = new ProcessNodeManager({
                  id: NodeFactory.generateNodeId('process'),
                  name,
                  position,
                  properties
               });

               const node = manager.getNode();

               // Verify node type is PROCESS
               expect(node.type).toBe(NodeType.PROCESS);

               // Validate with exactly 1 outgoing edge - should pass
               const validation = manager.validate(1);

               // Property 4.1: Process node with exactly 1 outgoing edge should pass validation
               expect(validation.isValid).toBe(true);
               expect(validation.errors).toHaveLength(0);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 4.2: Process nodes with zero outgoing edges pass validation
       */
      test('Property 4.2: Process nodes with zero outgoing edges pass validation', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a process node
               const manager = new ProcessNodeManager({
                  id: NodeFactory.generateNodeId('process'),
                  name,
                  position,
                  properties
               });

               const node = manager.getNode();

               // Verify node type is PROCESS
               expect(node.type).toBe(NodeType.PROCESS);

               // Validate with 0 outgoing edges - should pass (no constraint violation)
               const validation = manager.validate(0);

               // Property 4.2: Process node with 0 outgoing edges should pass validation
               expect(validation.isValid).toBe(true);
               expect(validation.errors).toHaveLength(0);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 4.3: NodeFactory creates valid process nodes
       */
      test('Property 4.3: NodeFactory creates valid process nodes', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a process node via factory
               const manager = NodeFactory.createProcessNode(name, position, properties);
               const node = manager.getNode();

               // Verify node type is PROCESS
               expect(node.type).toBe(NodeType.PROCESS);

               // Verify node has correct properties
               expect(node.name).toBe(name);
               expect(node.position).toEqual(position);

               // Validate with 1 outgoing edge - should pass
               const validation = manager.validate(1);
               expect(validation.isValid).toBe(true);

               return true;
            }),
            { numRuns: 100 }
         );
      });
   });

   // ============================================================================
   // Property 5: Decision Node Default Output Branches
   // 属性 5: 分支节点默认输出边
   // ============================================================================

   describe('Property 5: Decision Node Default Output Branches', () => {
      /**
       * **Feature: business-process-modeling, Property 5: 分支节点默认输出边**
       * **Validates: Requirements 1.5**
       *
       * Property: For any newly created decision node, it should default to two output branches.
       *
       * 属性: 对于任何新创建的分支节点，应该默认包含两条输出边
       */
      test('Property 5: Decision nodes default to two output branches', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a decision node WITHOUT specifying branches
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties
                  // Note: branches is not provided, should default to 2
               });

               const node = manager.getNode();

               // Property 5: Decision node should have exactly 2 default branches
               expect(node.type).toBe(NodeType.DECISION);
               expect(node.branches).toBeDefined();
               expect(node.branches).toHaveLength(2);

               // Verify default branch values are 'true' and 'false'
               const branchValues = node.branches.map(b => b.value);
               expect(branchValues).toContain('true');
               expect(branchValues).toContain('false');

               // Verify one branch is marked as default
               const defaultBranches = node.branches.filter(b => b.isDefault);
               expect(defaultBranches).toHaveLength(1);

               // Validation should pass
               const validation = manager.validate();
               expect(validation.isValid).toBe(true);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 5.1: NodeFactory creates decision nodes with default branches
       */
      test('Property 5.1: NodeFactory creates decision nodes with default branches', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a decision node via factory WITHOUT specifying branches
               const manager = NodeFactory.createDecisionNode(name, position, undefined, properties);
               const node = manager.getNode();

               // Property 5.1: Decision node should have exactly 2 default branches
               expect(node.type).toBe(NodeType.DECISION);
               expect(node.branches).toHaveLength(2);

               // Verify default branch values
               const branchValues = node.branches.map(b => b.value);
               expect(branchValues).toContain('true');
               expect(branchValues).toContain('false');

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 5.2: Decision nodes with custom branches preserve branch count
       */
      test('Property 5.2: Decision nodes with custom branches preserve branch count', () => {
         fc.assert(
            fc.property(
               nodeNameArb,
               positionArb,
               nodePropertiesArb,
               fc.integer({ min: 2, max: 10 }),
               (name, position, properties, branchCount) => {
                  // Generate unique branch values
                  const branches: BranchCondition[] = [];
                  for (let i = 0; i < branchCount; i++) {
                     branches.push({
                        id: `branch_${i + 1}`,
                        value: `value_${i + 1}`,
                        isDefault: i === branchCount - 1
                     });
                  }

                  // Create a decision node WITH custom branches
                  const manager = new DecisionNodeManager({
                     id: NodeFactory.generateNodeId('decision'),
                     name,
                     position,
                     properties,
                     branches
                  });

                  const node = manager.getNode();

                  // Property 5.2: Decision node should preserve custom branch count
                  expect(node.branches).toHaveLength(branchCount);

                  return true;
               }
            ),
            { numRuns: 100 }
         );
      });
   });

   // ============================================================================
   // Property 6: Decision Node Branch Value Uniqueness
   // 属性 6: 分支节点输出边值唯一性
   // ============================================================================

   describe('Property 6: Decision Node Branch Value Uniqueness', () => {
      /**
       * **Feature: business-process-modeling, Property 6: 分支节点输出边值唯一性**
       * **Validates: Requirements 1.6**
       *
       * Property: For any decision node, all output branch values should be unique.
       *
       * 属性: 对于任何分支节点，其所有输出边的值应该互不相同
       */
      test('Property 6: Decision nodes with duplicate branch values fail validation', () => {
         fc.assert(
            fc.property(
               nodeNameArb,
               positionArb,
               nodePropertiesArb,
               branchValueArb,
               fc.integer({ min: 2, max: 5 }),
               (name, position, properties, duplicateValue, duplicateCount) => {
                  // Create branches with duplicate values
                  const branches: BranchCondition[] = [];
                  for (let i = 0; i < duplicateCount; i++) {
                     branches.push({
                        id: `branch_${i + 1}`,
                        value: duplicateValue, // Same value for all branches
                        isDefault: i === duplicateCount - 1
                     });
                  }

                  // Create a decision node with duplicate branch values
                  const manager = new DecisionNodeManager({
                     id: NodeFactory.generateNodeId('decision'),
                     name,
                     position,
                     properties,
                     branches
                  });

                  const node = manager.getNode();

                  // Verify node type is DECISION
                  expect(node.type).toBe(NodeType.DECISION);

                  // Property 6: Decision node with duplicate branch values should fail validation
                  const validation = manager.validate();
                  expect(validation.isValid).toBe(false);
                  expect(validation.errors.length).toBeGreaterThan(0);
                  expect(validation.errors.some(e => e.includes('唯一') || e.includes('unique'))).toBe(true);

                  return true;
               }
            ),
            { numRuns: 100 }
         );
      });

      /**
       * Property 6.1: Decision nodes with unique branch values pass validation
       */
      test('Property 6.1: Decision nodes with unique branch values pass validation', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, uniqueBranchValuesArb, (name, position, properties, uniqueValues) => {
               // Create branches with unique values
               const branches: BranchCondition[] = uniqueValues.map((value, index) => ({
                  id: `branch_${index + 1}`,
                  value,
                  isDefault: index === uniqueValues.length - 1
               }));

               // Create a decision node with unique branch values
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties,
                  branches
               });

               const node = manager.getNode();

               // Verify node type is DECISION
               expect(node.type).toBe(NodeType.DECISION);

               // Property 6.1: Decision node with unique branch values should pass validation
               const validation = manager.validate();
               expect(validation.isValid).toBe(true);
               expect(validation.errors).toHaveLength(0);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 6.2: Adding a branch with duplicate value fails
       */
      test('Property 6.2: Adding a branch with duplicate value fails', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, branchValueArb, (name, position, properties, newValue) => {
               // Create a decision node with default branches
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties
               });

               // Get existing branch values
               const existingValues = manager.getBranches().map(b => b.value);

               // Try to add a branch with an existing value
               const duplicateValue = existingValues[0]; // Use first existing value
               const result = manager.addBranch({
                  id: 'new_branch',
                  value: duplicateValue,
                  isDefault: false
               });

               // Property 6.2: Adding a branch with duplicate value should fail
               expect(result.isValid).toBe(false);
               expect(result.errors.length).toBeGreaterThan(0);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 6.3: Adding a branch with unique value succeeds
       */
      test('Property 6.3: Adding a branch with unique value succeeds', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a decision node with default branches
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties
               });

               // Get existing branch values
               const existingValues = manager.getBranches().map(b => b.value);

               // Generate a unique value that doesn't exist
               let uniqueValue = 'unique_value_' + Date.now();
               while (existingValues.includes(uniqueValue)) {
                  uniqueValue = 'unique_value_' + Date.now() + '_' + Math.random();
               }

               // Add a branch with unique value
               const result = manager.addBranch({
                  id: 'new_branch',
                  value: uniqueValue,
                  isDefault: false
               });

               // Property 6.3: Adding a branch with unique value should succeed
               expect(result.isValid).toBe(true);
               expect(result.errors).toHaveLength(0);

               // Verify branch was added
               expect(manager.getBranches().length).toBe(3);
               expect(manager.getBranches().some(b => b.value === uniqueValue)).toBe(true);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 6.4: Updating a branch value to a duplicate fails
       */
      test('Property 6.4: Updating a branch value to a duplicate fails', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a decision node with default branches
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties
               });

               const branches = manager.getBranches();
               expect(branches.length).toBeGreaterThanOrEqual(2);

               // Try to update first branch to have the same value as second branch
               const result = manager.updateBranchValue(branches[0].id, branches[1].value);

               // Property 6.4: Updating a branch value to a duplicate should fail
               expect(result.isValid).toBe(false);
               expect(result.errors.length).toBeGreaterThan(0);

               return true;
            }),
            { numRuns: 100 }
         );
      });

      /**
       * Property 6.5: Updating a branch value to a unique value succeeds
       */
      test('Property 6.5: Updating a branch value to a unique value succeeds', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Create a decision node with default branches
               const manager = new DecisionNodeManager({
                  id: NodeFactory.generateNodeId('decision'),
                  name,
                  position,
                  properties
               });

               const branches = manager.getBranches();
               expect(branches.length).toBeGreaterThanOrEqual(2);

               // Generate a unique value
               const uniqueValue = 'new_unique_value_' + Date.now();

               // Update first branch to have a unique value
               const result = manager.updateBranchValue(branches[0].id, uniqueValue);

               // Property 6.5: Updating a branch value to a unique value should succeed
               expect(result.isValid).toBe(true);
               expect(result.errors).toHaveLength(0);

               // Verify branch was updated
               const updatedBranch = manager.getBranches().find(b => b.id === branches[0].id);
               expect(updatedBranch?.value).toBe(uniqueValue);

               return true;
            }),
            { numRuns: 100 }
         );
      });
   });

   // ============================================================================
   // Combined Property Tests
   // ============================================================================

   describe('Combined Property Tests', () => {
      /**
       * Combined test: All node constraint properties hold together
       */
      test('Combined: All node constraint properties hold for valid configurations', () => {
         fc.assert(
            fc.property(nodeNameArb, positionArb, nodePropertiesArb, (name, position, properties) => {
               // Test Process Node (Property 4)
               const processManager = NodeFactory.createProcessNode(name, position, properties);
               const processNode = processManager.getNode();
               expect(processNode.type).toBe(NodeType.PROCESS);
               expect(processManager.validate(1).isValid).toBe(true);
               expect(processManager.validate(2).isValid).toBe(false);

               // Test Decision Node (Properties 5 & 6)
               const decisionManager = NodeFactory.createDecisionNode(name, position, undefined, properties);
               const decisionNode = decisionManager.getNode();
               expect(decisionNode.type).toBe(NodeType.DECISION);
               expect(decisionNode.branches).toHaveLength(2);
               expect(decisionManager.validate().isValid).toBe(true);

               return true;
            }),
            { numRuns: 100 }
         );
      });
   });
});
