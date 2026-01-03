/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { NodeType, isBeginNode, isDecisionNode, isEndNode, isExceptionNode, isProcessNode } from '@crossmodel/protocol';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { WorkflowLanguageServer } from '../../../src/language-server/workflow/workflow-language-server';
import {
   createBranchWorkflowModel,
   createSimpleWorkflowModel,
   createTestDecisionTableData,
   createTestPosition,
   createTestWorkflowServer
} from './workflow-test-utils';

describe('WorkflowLanguageServer', () => {
   let server: WorkflowLanguageServer;

   beforeEach(() => {
      server = createTestWorkflowServer();
   });

   describe('Node Management', () => {
      test('should create begin node without expected value', () => {
         const node = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.BEGIN);
         expect(node.name).toBe('Start');
         expect(isBeginNode(node)).toBe(true);
         // Begin nodes should not have expectedValue property
         expect('expectedValue' in node).toBe(false);
      });

      test('should create end node with expected value', () => {
         const node = server.createNode(NodeType.END, 'End', createTestPosition());

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.END);
         expect(isEndNode(node)).toBe(true);
         // End nodes should have expectedValue property
         expect('expectedValue' in node).toBe(true);
      });

      test('should create exception node with expected value', () => {
         const node = server.createNode(NodeType.EXCEPTION, 'Exception', createTestPosition());

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.EXCEPTION);
         expect(isExceptionNode(node)).toBe(true);
         // Exception nodes should have expectedValue property
         expect('expectedValue' in node).toBe(true);
      });

      test('should create process node', () => {
         const node = server.createNode(NodeType.PROCESS, 'Process', createTestPosition());

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.PROCESS);
         expect(isProcessNode(node)).toBe(true);
      });

      test('should create decision node with default two branches', () => {
         const node = server.createNode(NodeType.DECISION, 'Decision', createTestPosition());

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.DECISION);
         expect(isDecisionNode(node)).toBe(true);
         if (isDecisionNode(node)) {
            expect(node.branches).toHaveLength(2);
         }
      });

      test('should update node properties', () => {
         const node = server.createNode(NodeType.PROCESS, 'Process', createTestPosition());
         server.updateNode(node.id, { description: 'Updated description' });

         const updatedNode = server.getNode(node.id);
         expect(updatedNode?.properties.description).toBe('Updated description');
      });

      test('should delete node and related edges', () => {
         const { beginNode, processNode, endNode } = createSimpleWorkflowModel(server);

         server.deleteNode(processNode.id);

         expect(server.getNode(processNode.id)).toBeUndefined();
         // Related edges should also be deleted
         const model = server.getModel();
         const edges = Array.from(model.edges.values());
         expect(edges.some(e => e.source === processNode.id || e.target === processNode.id)).toBe(false);
      });
   });

   describe('Edge Management', () => {
      test('should create edge between nodes', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const endNode = server.createNode(NodeType.END, 'End', createTestPosition(200, 0));

         const edge = server.createEdge({ source: beginNode.id, target: endNode.id });

         expect(edge).toBeDefined();
         expect(edge.source).toBe(beginNode.id);
         expect(edge.target).toBe(endNode.id);
      });

      test('should create edge with condition', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const endNode = server.createNode(NodeType.END, 'End', createTestPosition(200, 0));

         const edge = server.createEdge({
            source: beginNode.id,
            target: endNode.id,
            properties: { condition: 'x > 0', value: 'positive' }
         });

         expect(edge.condition).toBe('x > 0');
         expect(edge.value).toBe('positive');
      });

      test('should update edge properties', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const endNode = server.createNode(NodeType.END, 'End', createTestPosition(200, 0));
         const edge = server.createEdge({ source: beginNode.id, target: endNode.id });

         server.updateEdge(edge.id, { properties: { condition: 'updated condition' } });

         const updatedEdge = server.getEdge(edge.id);
         expect(updatedEdge?.condition).toBe('updated condition');
      });

      test('should delete edge', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const endNode = server.createNode(NodeType.END, 'End', createTestPosition(200, 0));
         const edge = server.createEdge({ source: beginNode.id, target: endNode.id });

         server.deleteEdge(edge.id);

         expect(server.getEdge(edge.id)).toBeUndefined();
      });
   });

   describe('Decision Table Management', () => {
      test('should create decision table node with default data', () => {
         const node = server.createDecisionTable('dt-1');

         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.DECISION_TABLE);
         expect(node.tableData).toBeDefined();
         expect(node.tableData.inputColumns.length).toBeGreaterThan(0);
         expect(node.tableData.outputColumns.length).toBeGreaterThan(0);
         expect(node.tableData.decisionColumns.length).toBeGreaterThan(0);
      });

      test('should update decision table data', () => {
         const node = server.createDecisionTable('dt-1');
         const newData = createTestDecisionTableData(2, 2, 3);

         server.updateDecisionTable(node.id, newData);

         const updatedNode = server.getNode(node.id);
         expect(updatedNode).toBeDefined();
         if (updatedNode && updatedNode.type === NodeType.DECISION_TABLE) {
            expect((updatedNode as any).tableData.inputColumns).toHaveLength(2);
            expect((updatedNode as any).tableData.outputColumns).toHaveLength(2);
            expect((updatedNode as any).tableData.rows).toHaveLength(3);
         }
      });

      test('should validate decision table with duplicate decision columns', () => {
         const data = createTestDecisionTableData(1, 1, 2);
         // Make decision values identical
         data.rows[0].values['decision_1'] = 'same_value';
         data.rows[1].values['decision_1'] = 'same_value';

         const result = server.validateDecisionTable(data);

         expect(result.isValid).toBe(false);
         expect(result.errors.length).toBeGreaterThan(0);
      });

      test('should validate decision table without output columns', () => {
         const data = createTestDecisionTableData(1, 1, 1);
         data.outputColumns = [];

         const result = server.validateDecisionTable(data);

         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('输出列'))).toBe(true);
      });
   });

   describe('Swimlane Management', () => {
      test('should create swimlane', () => {
         const swimlane = server.createSwimlane({ name: 'Test Swimlane' });

         expect(swimlane).toBeDefined();
         expect(swimlane.name).toBe('Test Swimlane');
         expect(swimlane.containedNodes).toEqual([]);
      });

      test('should add node to swimlane', () => {
         const swimlane = server.createSwimlane({ name: 'Test Swimlane' });
         const node = server.createNode(NodeType.PROCESS, 'Process', createTestPosition());

         server.addNodeToSwimlane(node.id, swimlane.id);

         const model = server.getModel();
         const updatedSwimlane = model.swimlanes.get(swimlane.id);
         expect(updatedSwimlane?.containedNodes).toContain(node.id);
      });

      test('should remove node from swimlane', () => {
         const swimlane = server.createSwimlane({ name: 'Test Swimlane' });
         const node = server.createNode(NodeType.PROCESS, 'Process', createTestPosition());
         server.addNodeToSwimlane(node.id, swimlane.id);

         server.removeNodeFromSwimlane(node.id);

         const model = server.getModel();
         const updatedSwimlane = model.swimlanes.get(swimlane.id);
         expect(updatedSwimlane?.containedNodes).not.toContain(node.id);
      });

      test('should delete swimlane', () => {
         const swimlane = server.createSwimlane({ name: 'Test Swimlane' });

         server.deleteSwimlane(swimlane.id);

         const model = server.getModel();
         expect(model.swimlanes.has(swimlane.id)).toBe(false);
      });
   });

   describe('Reference Node Management', () => {
      test('should create reference node from source node', () => {
         const sourceNode = server.createNode(NodeType.PROCESS, 'Source Process', createTestPosition());

         const referenceNode = server.createReference(sourceNode.id);

         expect(referenceNode).toBeDefined();
         expect(referenceNode.sourceNodeId).toBe(sourceNode.id);
         expect(referenceNode.isReference).toBe(true);
         expect(referenceNode.editableProperties).toEqual(['name', 'stepDisplay']);
      });

      test('should batch create reference nodes', () => {
         const node1 = server.createNode(NodeType.PROCESS, 'Process 1', createTestPosition());
         const node2 = server.createNode(NodeType.PROCESS, 'Process 2', createTestPosition(100, 0));

         const references = server.batchCreateReferences([node1.id, node2.id]);

         expect(references).toHaveLength(2);
         expect(references[0].sourceNodeId).toBe(node1.id);
         expect(references[1].sourceNodeId).toBe(node2.id);
      });

      test('should throw error when creating reference from non-existent node', () => {
         expect(() => server.createReference('non-existent-id')).toThrow();
      });
   });

   describe('Model Validation', () => {
      test('should validate model with process node having multiple outgoing edges', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const processNode = server.createNode(NodeType.PROCESS, 'Process', createTestPosition(200, 0));
         const endNode1 = server.createNode(NodeType.END, 'End 1', createTestPosition(400, -100));
         const endNode2 = server.createNode(NodeType.END, 'End 2', createTestPosition(400, 100));

         server.createEdge({ source: beginNode.id, target: processNode.id });
         server.createEdge({ source: processNode.id, target: endNode1.id });
         server.createEdge({ source: processNode.id, target: endNode2.id });

         const result = server.validateModel();

         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('过程节点'))).toBe(true);
      });

      test('should validate model with decision node having duplicate edge values', () => {
         const beginNode = server.createNode(NodeType.BEGIN, 'Start', createTestPosition());
         const decisionNode = server.createNode(NodeType.DECISION, 'Decision', createTestPosition(200, 0));
         const endNode1 = server.createNode(NodeType.END, 'End 1', createTestPosition(400, -100));
         const endNode2 = server.createNode(NodeType.END, 'End 2', createTestPosition(400, 100));

         server.createEdge({ source: beginNode.id, target: decisionNode.id });
         server.createEdge({
            source: decisionNode.id,
            target: endNode1.id,
            properties: { value: 'same_value' }
         });
         server.createEdge({
            source: decisionNode.id,
            target: endNode2.id,
            properties: { value: 'same_value' }
         });

         const result = server.validateModel();

         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('分支节点'))).toBe(true);
      });

      test('should pass validation for valid simple workflow', () => {
         createSimpleWorkflowModel(server);

         const result = server.validateModel();

         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should pass validation for valid branch workflow', () => {
         createBranchWorkflowModel(server);

         const result = server.validateModel();

         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });
   });

   describe('Model Management', () => {
      test('should get model', () => {
         const model = server.getModel();

         expect(model).toBeDefined();
         expect(model.id).toBe('test-workflow');
         expect(model.name).toBe('Test Workflow');
      });

      test('should load model', () => {
         const newServer = createTestWorkflowServer('new-workflow', 'New Workflow');
         createSimpleWorkflowModel(newServer);
         const modelToLoad = newServer.getModel();

         server.loadModel(modelToLoad);

         const loadedModel = server.getModel();
         expect(loadedModel.id).toBe('new-workflow');
         expect(loadedModel.nodes.size).toBe(3);
      });

      test('should update model timestamp on changes', async () => {
         const initialModel = server.getModel();
         const initialTimestamp = initialModel.metadata.updatedAt;

         // Wait a bit to ensure timestamp difference
         await new Promise(resolve => setTimeout(resolve, 10));
         server.createNode(NodeType.BEGIN, 'Start', createTestPosition());

         const updatedModel = server.getModel();
         expect(new Date(updatedModel.metadata.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(initialTimestamp).getTime());
      });
   });
});
