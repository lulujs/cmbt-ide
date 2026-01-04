/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowEdge } from './edge';
import { WorkflowModel, getOutgoingEdges } from './model';
import { WorkflowNode } from './node';
import { TestData } from './types';

/**
 * 测试数据验证结果接口
 * Test data validation result interface
 */
export interface TestDataValidationResult {
   valid: boolean;
   errors: string[];
}

/**
 * 测试数据执行结果接口
 * Test data execution result interface
 */
export interface TestDataExecutionResult {
   testDataId: string;
   success: boolean;
   actualOutput?: Record<string, unknown>;
   expectedOutput: Record<string, unknown>;
   errors?: string[];
   executionTime?: number;
}

/**
 * 生成唯一ID
 * Generate unique ID
 */
function generateId(): string {
   return `td_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 测试数据管理器类
 * Test data manager class
 */
export class TestDataManager {
   /**
    * 创建新的测试数据
    * Create new test data
    */
   static createTestData(
      name: string,
      edgeBinding: string,
      inputData: Record<string, unknown> = {},
      expectedOutput: Record<string, unknown> = {}
   ): TestData {
      return {
         id: generateId(),
         name,
         inputData,
         expectedOutput,
         edgeBinding
      };
   }

   /**
    * 为节点添加测试数据
    * Add test data to node
    */
   static addTestDataToNode(node: WorkflowNode, testData: TestData): WorkflowNode {
      const existingTestData = node.testData || [];
      return {
         ...node,
         testData: [...existingTestData, testData]
      };
   }

   /**
    * 从节点移除测试数据
    * Remove test data from node
    */
   static removeTestDataFromNode(node: WorkflowNode, testDataId: string): WorkflowNode {
      if (!node.testData) {
         return node;
      }
      return {
         ...node,
         testData: node.testData.filter(td => td.id !== testDataId)
      };
   }

   /**
    * 更新节点的测试数据
    * Update test data in node
    */
   static updateTestDataInNode(node: WorkflowNode, testDataId: string, updates: Partial<Omit<TestData, 'id'>>): WorkflowNode {
      if (!node.testData) {
         return node;
      }
      return {
         ...node,
         testData: node.testData.map(td => (td.id === testDataId ? { ...td, ...updates } : td))
      };
   }

   /**
    * 获取节点的所有测试数据
    * Get all test data for a node
    */
   static getTestDataForNode(node: WorkflowNode): TestData[] {
      return node.testData || [];
   }

   /**
    * 获取绑定到特定边的测试数据
    * Get test data bound to a specific edge
    */
   static getTestDataForEdge(node: WorkflowNode, edgeId: string): TestData[] {
      if (!node.testData) {
         return [];
      }
      return node.testData.filter(td => td.edgeBinding === edgeId);
   }

   /**
    * 为边添加测试数据
    * Add test data to edge
    */
   static addTestDataToEdge(edge: WorkflowEdge, testData: TestData): WorkflowEdge {
      const existingTestData = edge.testData || [];
      return {
         ...edge,
         testData: [...existingTestData, { ...testData, edgeBinding: edge.id }]
      };
   }

   /**
    * 从边移除测试数据
    * Remove test data from edge
    */
   static removeTestDataFromEdge(edge: WorkflowEdge, testDataId: string): WorkflowEdge {
      if (!edge.testData) {
         return edge;
      }
      return {
         ...edge,
         testData: edge.testData.filter(td => td.id !== testDataId)
      };
   }

   /**
    * 验证测试数据
    * Validate test data
    */
   static validateTestData(testData: TestData): TestDataValidationResult {
      const errors: string[] = [];

      if (!testData.id || testData.id.trim() === '') {
         errors.push('Test data ID is required');
      }

      if (!testData.name || testData.name.trim() === '') {
         errors.push('Test data name is required');
      }

      if (!testData.edgeBinding || testData.edgeBinding.trim() === '') {
         errors.push('Edge binding is required');
      }

      return {
         valid: errors.length === 0,
         errors
      };
   }

   /**
    * 验证测试数据与边的绑定
    * Validate test data binding to edge
    */
   static validateEdgeBinding(model: WorkflowModel, nodeId: string, testData: TestData): TestDataValidationResult {
      const errors: string[] = [];

      // 检查节点是否存在
      const node = model.nodes.get(nodeId);
      if (!node) {
         errors.push(`Node with ID '${nodeId}' not found`);
         return { valid: false, errors };
      }

      // 获取节点的出边
      const outgoingEdges = getOutgoingEdges(model, nodeId);

      // 检查边是否存在
      const boundEdge = outgoingEdges.find(edge => edge.id === testData.edgeBinding);
      if (!boundEdge) {
         errors.push(`Edge with ID '${testData.edgeBinding}' is not an outgoing edge of node '${nodeId}'`);
      }

      return {
         valid: errors.length === 0,
         errors
      };
   }

   /**
    * 执行测试数据（模拟执行）
    * Execute test data (simulated execution)
    */
   static executeTestData(
      testData: TestData,
      executor?: (inputData: Record<string, unknown>) => Record<string, unknown>
   ): TestDataExecutionResult {
      const startTime = Date.now();

      try {
         // 如果提供了执行器，使用它来执行
         const actualOutput = executor ? executor(testData.inputData) : testData.inputData;

         // 比较实际输出和预期输出
         const success = this.compareOutputs(actualOutput, testData.expectedOutput);

         return {
            testDataId: testData.id,
            success,
            actualOutput,
            expectedOutput: testData.expectedOutput,
            executionTime: Date.now() - startTime
         };
      } catch (error) {
         return {
            testDataId: testData.id,
            success: false,
            expectedOutput: testData.expectedOutput,
            errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
            executionTime: Date.now() - startTime
         };
      }
   }

   /**
    * 批量执行节点的所有测试数据
    * Execute all test data for a node
    */
   static executeAllTestDataForNode(
      node: WorkflowNode,
      executor?: (inputData: Record<string, unknown>) => Record<string, unknown>
   ): TestDataExecutionResult[] {
      const testDataList = this.getTestDataForNode(node);
      return testDataList.map(td => this.executeTestData(td, executor));
   }

   /**
    * 执行绑定到特定边的测试数据
    * Execute test data bound to a specific edge
    */
   static executeTestDataForEdge(
      node: WorkflowNode,
      edgeId: string,
      executor?: (inputData: Record<string, unknown>) => Record<string, unknown>
   ): TestDataExecutionResult[] {
      const testDataList = this.getTestDataForEdge(node, edgeId);
      return testDataList.map(td => this.executeTestData(td, executor));
   }

   /**
    * 比较两个输出对象
    * Compare two output objects
    */
   private static compareOutputs(actual: Record<string, unknown>, expected: Record<string, unknown>): boolean {
      return JSON.stringify(actual) === JSON.stringify(expected);
   }

   /**
    * 克隆测试数据（生成新ID）
    * Clone test data (with new ID)
    */
   static cloneTestData(testData: TestData, newEdgeBinding?: string): TestData {
      return {
         ...testData,
         id: generateId(),
         edgeBinding: newEdgeBinding || testData.edgeBinding
      };
   }

   /**
    * 批量绑定测试数据到边
    * Batch bind test data to edges
    */
   static batchBindTestDataToEdge(testDataList: TestData[], edgeId: string): TestData[] {
      return testDataList.map(td => ({
         ...td,
         edgeBinding: edgeId
      }));
   }
}
