/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
    AnyWorkflowNode,
    DecisionTableData,
    NodeType,
    Position,
    WorkflowEdge,
    WorkflowModel
} from '@crossmodel/protocol';
import { WorkflowLanguageServer } from '../../../src/language-server/workflow/workflow-language-server';

/**
 * 创建测试用的工作流程语言服务器
 * Create workflow language server for testing
 */
export function createTestWorkflowServer(
   modelId: string = 'test-workflow',
   modelName: string = 'Test Workflow'
): WorkflowLanguageServer {
   return new WorkflowLanguageServer(modelId, modelName);
}

/**
 * 创建测试用的位置
 * Create test position
 */
export function createTestPosition(x: number = 0, y: number = 0): Position {
   return { x, y };
}

/**
 * 创建测试用的决策表数据
 * Create test decision table data
 */
export function createTestDecisionTableData(
   inputCount: number = 1,
   outputCount: number = 1,
   rowCount: number = 2
): DecisionTableData {
   const inputColumns = Array.from({ length: inputCount }, (_, i) => ({
      id: `input_${i + 1}`,
      name: `Input ${i + 1}`,
      dataType: 'string'
   }));

   const outputColumns = Array.from({ length: outputCount }, (_, i) => ({
      id: `output_${i + 1}`,
      name: `Output ${i + 1}`,
      dataType: 'string'
   }));

   const decisionColumns = [
      { id: 'decision_1', name: 'Decision 1', dataType: 'string' }
   ];

   const rows = Array.from({ length: rowCount }, (_, i) => {
      const values: Record<string, unknown> = {};
      inputColumns.forEach(col => {
         values[col.id] = `input_value_${i + 1}`;
      });
      outputColumns.forEach(col => {
         values[col.id] = `output_value_${i + 1}`;
      });
      decisionColumns.forEach(col => {
         values[col.id] = `decision_value_${i + 1}`;
      });
      return { id: `row_${i + 1}`, values };
   });

   return {
      inputColumns,
      outputColumns,
      decisionColumns,
      rows
   };
}

/**
 * 创建简单的工作流程模型（开始 -> 过程 -> 结束）
 * Create simple workflow model (begin -> process -> end)
 */
export function createSimpleWorkflowModel(server: WorkflowLanguageServer): {
   beginNode: AnyWorkflowNode;
   processNode: AnyWorkflowNode;
   endNode: AnyWorkflowNode;
   edges: WorkflowEdge[];
} {
   const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition(100, 100));
   const processNode = server.createNode(NodeType.PROCESS, 'Process', createTestPosition(300, 100));
   const endNode = server.createNode(NodeType.END, 'End', createTestPosition(500, 100));

   const edge1 = server.createEdge({ source: beginNode.id, target: processNode.id });
   const edge2 = server.createEdge({ source: processNode.id, target: endNode.id });

   return {
      beginNode,
      processNode,
      endNode,
      edges: [edge1, edge2]
   };
}

/**
 * 创建带分支的工作流程模型
 * Create workflow model with decision branch
 */
export function createBranchWorkflowModel(server: WorkflowLanguageServer): {
   beginNode: AnyWorkflowNode;
   decisionNode: AnyWorkflowNode;
   processNode1: AnyWorkflowNode;
   processNode2: AnyWorkflowNode;
   endNode: AnyWorkflowNode;
   edges: WorkflowEdge[];
} {
   const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition(100, 200));
   const decisionNode = server.createNode(NodeType.DECISION, 'Decision', createTestPosition(300, 200));
   const processNode1 = server.createNode(NodeType.PROCESS, 'Process 1', createTestPosition(500, 100));
   const processNode2 = server.createNode(NodeType.PROCESS, 'Process 2', createTestPosition(500, 300));
   const endNode = server.createNode(NodeType.END, 'End', createTestPosition(700, 200));

   const edge1 = server.createEdge({ source: beginNode.id, target: decisionNode.id });
   const edge2 = server.createEdge({
      source: decisionNode.id,
      target: processNode1.id,
      properties: { value: 'true' }
   });
   const edge3 = server.createEdge({
      source: decisionNode.id,
      target: processNode2.id,
      properties: { value: 'false' }
   });
   const edge4 = server.createEdge({ source: processNode1.id, target: endNode.id });
   const edge5 = server.createEdge({ source: processNode2.id, target: endNode.id });

   return {
      beginNode,
      decisionNode,
      processNode1,
      processNode2,
      endNode,
      edges: [edge1, edge2, edge3, edge4, edge5]
   };
}

/**
 * 获取模型中的所有节点
 * Get all nodes from model
 */
export function getAllNodesFromModel(model: WorkflowModel): AnyWorkflowNode[] {
   return Array.from(model.nodes.values()) as AnyWorkflowNode[];
}

/**
 * 获取模型中的所有边
 * Get all edges from model
 */
export function getAllEdgesFromModel(model: WorkflowModel): WorkflowEdge[] {
   return Array.from(model.edges.values());
}
