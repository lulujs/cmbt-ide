/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import { WorkflowEdge } from '../../src/workflow/edge';
import { WorkflowModel, addEdgeToModel, addNodeToModel, createEmptyWorkflowModel } from '../../src/workflow/model';
import { ProcessNode, WorkflowNode } from '../../src/workflow/node';
import { TestDataManager } from '../../src/workflow/test-data-manager';
import { NodeType, TestData } from '../../src/workflow/types';

/**
 * 创建测试用的过程节点
 * Create test process node
 */
function createTestProcessNode(id: string, name: string): ProcessNode {
   return {
      id,
      type: NodeType.PROCESS,
      name,
      position: { x: 0, y: 0 },
      properties: {}
   };
}

/**
 * 创建测试用的边
 * Create test edge
 */
function createTestEdge(id: string, source: string, target: string): WorkflowEdge {
   return {
      id,
      source,
      target
   };
}

describe('TestDataManager', () => {
   describe('createTestData', () => {
      test('should create test data with all properties - 需求 5.1', () => {
         const testData = TestDataManager.createTestData('Test Case 1', 'edge_1', { input: 'value' }, { output: 'expected' });

         expect(testData).toBeDefined();
         expect(testData.id).toBeDefined();
         expect(testData.name).toBe('Test Case 1');
         expect(testData.edgeBinding).toBe('edge_1');
         expect(testData.inputData).toEqual({ input: 'value' });
         expect(testData.expectedOutput).toEqual({ output: 'expected' });
      });

      test('should create test data with default empty objects', () => {
         const testData = TestDataManager.createTestData('Test Case', 'edge_1');

         expect(testData.inputData).toEqual({});
         expect(testData.expectedOutput).toEqual({});
      });

      test('should generate unique IDs for each test data', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1');
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_1');

         expect(testData1.id).not.toBe(testData2.id);
      });
   });

   describe('addTestDataToNode', () => {
      test('should add test data to node - 需求 5.1', () => {
         const node = createTestProcessNode('process_1', 'Process');
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         const updatedNode = TestDataManager.addTestDataToNode(node, testData);

         expect(updatedNode.testData).toBeDefined();
         expect(updatedNode.testData).toHaveLength(1);
         expect(updatedNode.testData![0]).toEqual(testData);
      });

      test('should append test data to existing test data', () => {
         const existingTestData = TestDataManager.createTestData('Existing', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [existingTestData]
         };
         const newTestData = TestDataManager.createTestData('New', 'edge_2');

         const updatedNode = TestDataManager.addTestDataToNode(node, newTestData);

         expect(updatedNode.testData).toHaveLength(2);
      });
   });

   describe('removeTestDataFromNode', () => {
      test('should remove test data from node', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData]
         };

         const updatedNode = TestDataManager.removeTestDataFromNode(node, testData.id);

         expect(updatedNode.testData).toHaveLength(0);
      });

      test('should return unchanged node if test data not found', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData]
         };

         const updatedNode = TestDataManager.removeTestDataFromNode(node, 'non_existent_id');

         expect(updatedNode.testData).toHaveLength(1);
      });

      test('should return unchanged node if no test data exists', () => {
         const node = createTestProcessNode('process_1', 'Process');

         const updatedNode = TestDataManager.removeTestDataFromNode(node, 'any_id');

         expect(updatedNode).toEqual(node);
      });
   });

   describe('updateTestDataInNode', () => {
      test('should update test data in node', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData]
         };

         const updatedNode = TestDataManager.updateTestDataInNode(node, testData.id, {
            name: 'Updated Test',
            inputData: { newInput: 'value' }
         });

         expect(updatedNode.testData![0].name).toBe('Updated Test');
         expect(updatedNode.testData![0].inputData).toEqual({ newInput: 'value' });
      });
   });

   describe('getTestDataForNode', () => {
      test('should return all test data for node', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1');
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_2');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData1, testData2]
         };

         const result = TestDataManager.getTestDataForNode(node);

         expect(result).toHaveLength(2);
      });

      test('should return empty array if no test data', () => {
         const node = createTestProcessNode('process_1', 'Process');

         const result = TestDataManager.getTestDataForNode(node);

         expect(result).toEqual([]);
      });
   });

   describe('getTestDataForEdge', () => {
      test('should return test data bound to specific edge - 属性 14', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1');
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_2');
         const testData3 = TestDataManager.createTestData('Test 3', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData1, testData2, testData3]
         };

         const result = TestDataManager.getTestDataForEdge(node, 'edge_1');

         expect(result).toHaveLength(2);
         expect(result.every(td => td.edgeBinding === 'edge_1')).toBe(true);
      });

      test('should return empty array if no test data for edge', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData]
         };

         const result = TestDataManager.getTestDataForEdge(node, 'edge_2');

         expect(result).toEqual([]);
      });
   });

   describe('addTestDataToEdge', () => {
      test('should add test data to edge with correct binding', () => {
         const edge = createTestEdge('edge_1', 'node_1', 'node_2');
         const testData = TestDataManager.createTestData('Test', 'other_edge');

         const updatedEdge = TestDataManager.addTestDataToEdge(edge, testData);

         expect(updatedEdge.testData).toHaveLength(1);
         expect(updatedEdge.testData![0].edgeBinding).toBe('edge_1');
      });
   });

   describe('removeTestDataFromEdge', () => {
      test('should remove test data from edge', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');
         const edge: WorkflowEdge = {
            ...createTestEdge('edge_1', 'node_1', 'node_2'),
            testData: [testData]
         };

         const updatedEdge = TestDataManager.removeTestDataFromEdge(edge, testData.id);

         expect(updatedEdge.testData).toHaveLength(0);
      });
   });

   describe('validateTestData', () => {
      test('should validate valid test data', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         const result = TestDataManager.validateTestData(testData);

         expect(result.valid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should fail validation for missing name', () => {
         const testData: TestData = {
            id: 'td_1',
            name: '',
            edgeBinding: 'edge_1',
            inputData: {},
            expectedOutput: {}
         };

         const result = TestDataManager.validateTestData(testData);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('name'))).toBe(true);
      });

      test('should fail validation for missing edge binding', () => {
         const testData: TestData = {
            id: 'td_1',
            name: 'Test',
            edgeBinding: '',
            inputData: {},
            expectedOutput: {}
         };

         const result = TestDataManager.validateTestData(testData);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('Edge binding'))).toBe(true);
      });
   });

   describe('validateEdgeBinding', () => {
      let model: WorkflowModel;

      beforeEach(() => {
         model = createEmptyWorkflowModel('model_1', 'Test Model');
         const node1 = createTestProcessNode('process_1', 'Process 1');
         const node2 = createTestProcessNode('process_2', 'Process 2');
         const edge = createTestEdge('edge_1', 'process_1', 'process_2');

         model = addNodeToModel(model, node1);
         model = addNodeToModel(model, node2);
         model = addEdgeToModel(model, edge);
      });

      test('should validate correct edge binding - 属性 14', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         const result = TestDataManager.validateEdgeBinding(model, 'process_1', testData);

         expect(result.valid).toBe(true);
      });

      test('should fail validation for non-existent node', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         const result = TestDataManager.validateEdgeBinding(model, 'non_existent', testData);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('not found'))).toBe(true);
      });

      test('should fail validation for non-outgoing edge', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         // process_2 has edge_1 as incoming, not outgoing
         const result = TestDataManager.validateEdgeBinding(model, 'process_2', testData);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('not an outgoing edge'))).toBe(true);
      });
   });

   describe('executeTestData', () => {
      test('should execute test data successfully - 需求 5.3', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1', { value: 10 }, { value: 10 });

         const result = TestDataManager.executeTestData(testData);

         expect(result.success).toBe(true);
         expect(result.testDataId).toBe(testData.id);
         expect(result.executionTime).toBeDefined();
      });

      test('should execute test data with custom executor', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1', { value: 5 }, { result: 10 });

         const executor = (input: Record<string, unknown>) => ({
            result: (input.value as number) * 2
         });

         const result = TestDataManager.executeTestData(testData, executor);

         expect(result.success).toBe(true);
         expect(result.actualOutput).toEqual({ result: 10 });
      });

      test('should fail when actual output does not match expected', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1', { value: 5 }, { result: 20 });

         const executor = (input: Record<string, unknown>) => ({
            result: (input.value as number) * 2
         });

         const result = TestDataManager.executeTestData(testData, executor);

         expect(result.success).toBe(false);
      });

      test('should handle executor errors', () => {
         const testData = TestDataManager.createTestData('Test', 'edge_1');

         const executor = () => {
            throw new Error('Execution failed');
         };

         const result = TestDataManager.executeTestData(testData, executor);

         expect(result.success).toBe(false);
         expect(result.errors).toContain('Execution failed');
      });
   });

   describe('executeAllTestDataForNode', () => {
      test('should execute all test data for node', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1', { a: 1 }, { a: 1 });
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_2', { b: 2 }, { b: 2 });
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData1, testData2]
         };

         const results = TestDataManager.executeAllTestDataForNode(node);

         expect(results).toHaveLength(2);
         expect(results.every(r => r.success)).toBe(true);
      });
   });

   describe('executeTestDataForEdge', () => {
      test('should execute test data for specific edge - 需求 5.3', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1', { a: 1 }, { a: 1 });
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_2', { b: 2 }, { b: 2 });
         const testData3 = TestDataManager.createTestData('Test 3', 'edge_1', { c: 3 }, { c: 3 });
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            testData: [testData1, testData2, testData3]
         };

         const results = TestDataManager.executeTestDataForEdge(node, 'edge_1');

         expect(results).toHaveLength(2);
      });
   });

   describe('cloneTestData', () => {
      test('should clone test data with new ID', () => {
         const original = TestDataManager.createTestData('Test', 'edge_1', { a: 1 }, { b: 2 });

         const cloned = TestDataManager.cloneTestData(original);

         expect(cloned.id).not.toBe(original.id);
         expect(cloned.name).toBe(original.name);
         expect(cloned.edgeBinding).toBe(original.edgeBinding);
         expect(cloned.inputData).toEqual(original.inputData);
         expect(cloned.expectedOutput).toEqual(original.expectedOutput);
      });

      test('should clone test data with new edge binding', () => {
         const original = TestDataManager.createTestData('Test', 'edge_1');

         const cloned = TestDataManager.cloneTestData(original, 'edge_2');

         expect(cloned.edgeBinding).toBe('edge_2');
      });
   });

   describe('batchBindTestDataToEdge', () => {
      test('should bind multiple test data to edge', () => {
         const testData1 = TestDataManager.createTestData('Test 1', 'edge_1');
         const testData2 = TestDataManager.createTestData('Test 2', 'edge_2');

         const bound = TestDataManager.batchBindTestDataToEdge([testData1, testData2], 'edge_3');

         expect(bound.every(td => td.edgeBinding === 'edge_3')).toBe(true);
      });
   });
});
