/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import {
   ApiCallConfiguration,
   AutomationActionManager,
   ScriptConfiguration,
   WebhookConfiguration
} from '../../src/workflow/automation-action-manager';
import { WorkflowEdge } from '../../src/workflow/edge';
import { WorkflowModel, addEdgeToModel, addNodeToModel, createEmptyWorkflowModel } from '../../src/workflow/model';
import { ProcessNode, WorkflowNode } from '../../src/workflow/node';
import { AutomationAction, NodeType } from '../../src/workflow/types';

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

describe('AutomationActionManager', () => {
   describe('createAutomationAction', () => {
      test('should create automation action with all properties - 需求 5.2', () => {
         const action = AutomationActionManager.createAutomationAction('API Call Action', 'api_call', 'edge_1', {
            url: 'https://api.example.com'
         });

         expect(action).toBeDefined();
         expect(action.id).toBeDefined();
         expect(action.name).toBe('API Call Action');
         expect(action.actionType).toBe('api_call');
         expect(action.edgeBinding).toBe('edge_1');
         expect(action.configuration).toEqual({ url: 'https://api.example.com' });
      });

      test('should create automation action with default empty configuration', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'script', 'edge_1');

         expect(action.configuration).toEqual({});
      });

      test('should generate unique IDs for each action', () => {
         const action1 = AutomationActionManager.createAutomationAction('Action 1', 'api_call', 'edge_1');
         const action2 = AutomationActionManager.createAutomationAction('Action 2', 'api_call', 'edge_1');

         expect(action1.id).not.toBe(action2.id);
      });
   });

   describe('createApiCallAction', () => {
      test('should create API call action with configuration', () => {
         const config: ApiCallConfiguration = {
            url: 'https://api.example.com/endpoint',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { data: 'test' },
            timeout: 5000
         };

         const action = AutomationActionManager.createApiCallAction('API Action', 'edge_1', config);

         expect(action.actionType).toBe('api_call');
         expect(action.configuration).toEqual(config);
      });
   });

   describe('createScriptAction', () => {
      test('should create script action with configuration', () => {
         const config: ScriptConfiguration = {
            language: 'javascript',
            code: 'console.log("Hello");',
            timeout: 10000
         };

         const action = AutomationActionManager.createScriptAction('Script Action', 'edge_1', config);

         expect(action.actionType).toBe('script');
         expect(action.configuration).toEqual(config);
      });
   });

   describe('createWebhookAction', () => {
      test('should create webhook action with configuration', () => {
         const config: WebhookConfiguration = {
            url: 'https://webhook.example.com',
            method: 'POST',
            headers: { 'X-Custom-Header': 'value' },
            payload: { event: 'test' },
            retryCount: 3
         };

         const action = AutomationActionManager.createWebhookAction('Webhook Action', 'edge_1', config);

         expect(action.actionType).toBe('webhook');
         expect(action.configuration).toEqual(config);
      });
   });

   describe('addActionToNode', () => {
      test('should add automation action to node - 需求 5.2', () => {
         const node = createTestProcessNode('process_1', 'Process');
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         const updatedNode = AutomationActionManager.addActionToNode(node, action);

         expect(updatedNode.automationActions).toBeDefined();
         expect(updatedNode.automationActions).toHaveLength(1);
         expect(updatedNode.automationActions![0]).toEqual(action);
      });

      test('should append action to existing actions', () => {
         const existingAction = AutomationActionManager.createAutomationAction('Existing', 'api_call', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [existingAction]
         };
         const newAction = AutomationActionManager.createAutomationAction('New', 'script', 'edge_2');

         const updatedNode = AutomationActionManager.addActionToNode(node, newAction);

         expect(updatedNode.automationActions).toHaveLength(2);
      });
   });

   describe('removeActionFromNode', () => {
      test('should remove automation action from node', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action]
         };

         const updatedNode = AutomationActionManager.removeActionFromNode(node, action.id);

         expect(updatedNode.automationActions).toHaveLength(0);
      });

      test('should return unchanged node if action not found', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action]
         };

         const updatedNode = AutomationActionManager.removeActionFromNode(node, 'non_existent_id');

         expect(updatedNode.automationActions).toHaveLength(1);
      });

      test('should return unchanged node if no actions exist', () => {
         const node = createTestProcessNode('process_1', 'Process');

         const updatedNode = AutomationActionManager.removeActionFromNode(node, 'any_id');

         expect(updatedNode).toEqual(node);
      });
   });

   describe('updateActionInNode', () => {
      test('should update automation action in node', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action]
         };

         const updatedNode = AutomationActionManager.updateActionInNode(node, action.id, {
            name: 'Updated Action',
            configuration: { url: 'https://new.api.com' }
         });

         expect(updatedNode.automationActions![0].name).toBe('Updated Action');
         expect(updatedNode.automationActions![0].configuration).toEqual({ url: 'https://new.api.com' });
      });
   });

   describe('getActionsForNode', () => {
      test('should return all automation actions for node', () => {
         const action1 = AutomationActionManager.createAutomationAction('Action 1', 'api_call', 'edge_1');
         const action2 = AutomationActionManager.createAutomationAction('Action 2', 'script', 'edge_2');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action1, action2]
         };

         const result = AutomationActionManager.getActionsForNode(node);

         expect(result).toHaveLength(2);
      });

      test('should return empty array if no actions', () => {
         const node = createTestProcessNode('process_1', 'Process');

         const result = AutomationActionManager.getActionsForNode(node);

         expect(result).toEqual([]);
      });
   });

   describe('getActionsForEdge', () => {
      test('should return actions bound to specific edge - 需求 5.2', () => {
         const action1 = AutomationActionManager.createAutomationAction('Action 1', 'api_call', 'edge_1');
         const action2 = AutomationActionManager.createAutomationAction('Action 2', 'script', 'edge_2');
         const action3 = AutomationActionManager.createAutomationAction('Action 3', 'webhook', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action1, action2, action3]
         };

         const result = AutomationActionManager.getActionsForEdge(node, 'edge_1');

         expect(result).toHaveLength(2);
         expect(result.every(a => a.edgeBinding === 'edge_1')).toBe(true);
      });

      test('should return empty array if no actions for edge', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action]
         };

         const result = AutomationActionManager.getActionsForEdge(node, 'edge_2');

         expect(result).toEqual([]);
      });
   });

   describe('addActionToEdge', () => {
      test('should add automation action to edge with correct binding', () => {
         const edge = createTestEdge('edge_1', 'node_1', 'node_2');
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'other_edge');

         const updatedEdge = AutomationActionManager.addActionToEdge(edge, action);

         expect(updatedEdge.automationActions).toHaveLength(1);
         expect(updatedEdge.automationActions![0].edgeBinding).toBe('edge_1');
      });
   });

   describe('removeActionFromEdge', () => {
      test('should remove automation action from edge', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');
         const edge: WorkflowEdge = {
            ...createTestEdge('edge_1', 'node_1', 'node_2'),
            automationActions: [action]
         };

         const updatedEdge = AutomationActionManager.removeActionFromEdge(edge, action.id);

         expect(updatedEdge.automationActions).toHaveLength(0);
      });
   });

   describe('validateAction', () => {
      test('should validate valid API call action', () => {
         const action = AutomationActionManager.createApiCallAction('API Action', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should validate valid script action', () => {
         const action = AutomationActionManager.createScriptAction('Script Action', 'edge_1', {
            language: 'javascript',
            code: 'console.log("test");'
         });

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(true);
      });

      test('should validate valid webhook action', () => {
         const action = AutomationActionManager.createWebhookAction('Webhook Action', 'edge_1', {
            url: 'https://webhook.example.com',
            method: 'POST'
         });

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(true);
      });

      test('should fail validation for missing name', () => {
         const action: AutomationAction = {
            id: 'aa_1',
            name: '',
            actionType: 'api_call',
            edgeBinding: 'edge_1',
            configuration: { url: 'https://api.com', method: 'GET' }
         };

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('name'))).toBe(true);
      });

      test('should fail validation for missing edge binding', () => {
         const action: AutomationAction = {
            id: 'aa_1',
            name: 'Action',
            actionType: 'api_call',
            edgeBinding: '',
            configuration: { url: 'https://api.com', method: 'GET' }
         };

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('Edge binding'))).toBe(true);
      });

      test('should fail validation for API call without URL', () => {
         const action: AutomationAction = {
            id: 'aa_1',
            name: 'Action',
            actionType: 'api_call',
            edgeBinding: 'edge_1',
            configuration: { method: 'GET' }
         };

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('URL'))).toBe(true);
      });

      test('should fail validation for script without code', () => {
         const action: AutomationAction = {
            id: 'aa_1',
            name: 'Action',
            actionType: 'script',
            edgeBinding: 'edge_1',
            configuration: { language: 'javascript' }
         };

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('code'))).toBe(true);
      });

      test('should fail validation for webhook without URL', () => {
         const action: AutomationAction = {
            id: 'aa_1',
            name: 'Action',
            actionType: 'webhook',
            edgeBinding: 'edge_1',
            configuration: {}
         };

         const result = AutomationActionManager.validateAction(action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('URL'))).toBe(true);
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

      test('should validate correct edge binding', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         const result = AutomationActionManager.validateEdgeBinding(model, 'process_1', action);

         expect(result.valid).toBe(true);
      });

      test('should fail validation for non-existent node', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         const result = AutomationActionManager.validateEdgeBinding(model, 'non_existent', action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('not found'))).toBe(true);
      });

      test('should fail validation for non-outgoing edge', () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         // process_2 has edge_1 as incoming, not outgoing
         const result = AutomationActionManager.validateEdgeBinding(model, 'process_2', action);

         expect(result.valid).toBe(false);
         expect(result.errors.some(e => e.includes('not an outgoing edge'))).toBe(true);
      });
   });

   describe('executeAction', () => {
      test('should execute action successfully - 需求 5.4', async () => {
         const action = AutomationActionManager.createApiCallAction('API Action', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });

         const result = await AutomationActionManager.executeAction(action);

         expect(result.success).toBe(true);
         expect(result.actionId).toBe(action.id);
         expect(result.executionTime).toBeDefined();
      });

      test('should execute action with custom executor', async () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1', {
            url: 'https://api.example.com'
         });

         const executor = async () => ({ status: 'custom_success' });

         const result = await AutomationActionManager.executeAction(action, executor);

         expect(result.success).toBe(true);
         expect(result.response).toEqual({ status: 'custom_success' });
      });

      test('should handle executor errors', async () => {
         const action = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         const executor = async () => {
            throw new Error('Execution failed');
         };

         const result = await AutomationActionManager.executeAction(action, executor);

         expect(result.success).toBe(false);
         expect(result.errors).toContain('Execution failed');
      });

      test('should simulate API call execution', async () => {
         const action = AutomationActionManager.createApiCallAction('API Action', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });

         const result = await AutomationActionManager.executeAction(action);

         expect(result.success).toBe(true);
         expect(result.response).toEqual({ status: 200, message: 'Simulated API call success' });
      });

      test('should simulate script execution', async () => {
         const action = AutomationActionManager.createScriptAction('Script Action', 'edge_1', {
            language: 'javascript',
            code: 'console.log("test");'
         });

         const result = await AutomationActionManager.executeAction(action);

         expect(result.success).toBe(true);
         expect(result.response).toEqual({ status: 'completed', message: 'Simulated script execution success' });
      });

      test('should simulate webhook execution', async () => {
         const action = AutomationActionManager.createWebhookAction('Webhook Action', 'edge_1', {
            url: 'https://webhook.example.com',
            method: 'POST'
         });

         const result = await AutomationActionManager.executeAction(action);

         expect(result.success).toBe(true);
         expect(result.response).toEqual({ status: 'delivered', message: 'Simulated webhook delivery success' });
      });
   });

   describe('executeAllActionsForNode', () => {
      test('should execute all actions for node', async () => {
         const action1 = AutomationActionManager.createApiCallAction('API Action', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });
         const action2 = AutomationActionManager.createScriptAction('Script Action', 'edge_2', {
            language: 'javascript',
            code: 'test'
         });
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action1, action2]
         };

         const results = await AutomationActionManager.executeAllActionsForNode(node);

         expect(results).toHaveLength(2);
         expect(results.every(r => r.success)).toBe(true);
      });
   });

   describe('executeActionsForEdge', () => {
      test('should execute actions for specific edge - 需求 5.4', async () => {
         const action1 = AutomationActionManager.createApiCallAction('API Action 1', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });
         const action2 = AutomationActionManager.createScriptAction('Script Action', 'edge_2', {
            language: 'javascript',
            code: 'test'
         });
         const action3 = AutomationActionManager.createWebhookAction('Webhook Action', 'edge_1', {
            url: 'https://webhook.example.com',
            method: 'POST'
         });
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action1, action2, action3]
         };

         const results = await AutomationActionManager.executeActionsForEdge(node, 'edge_1');

         expect(results).toHaveLength(2);
      });
   });

   describe('cloneAction', () => {
      test('should clone action with new ID', () => {
         const original = AutomationActionManager.createApiCallAction('API Action', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });

         const cloned = AutomationActionManager.cloneAction(original);

         expect(cloned.id).not.toBe(original.id);
         expect(cloned.name).toBe(original.name);
         expect(cloned.actionType).toBe(original.actionType);
         expect(cloned.edgeBinding).toBe(original.edgeBinding);
         expect(cloned.configuration).toEqual(original.configuration);
      });

      test('should clone action with new edge binding', () => {
         const original = AutomationActionManager.createAutomationAction('Action', 'api_call', 'edge_1');

         const cloned = AutomationActionManager.cloneAction(original, 'edge_2');

         expect(cloned.edgeBinding).toBe('edge_2');
      });
   });

   describe('batchBindActionsToEdge', () => {
      test('should bind multiple actions to edge', () => {
         const action1 = AutomationActionManager.createAutomationAction('Action 1', 'api_call', 'edge_1');
         const action2 = AutomationActionManager.createAutomationAction('Action 2', 'script', 'edge_2');

         const bound = AutomationActionManager.batchBindActionsToEdge([action1, action2], 'edge_3');

         expect(bound.every(a => a.edgeBinding === 'edge_3')).toBe(true);
      });
   });

   describe('getActionsByType', () => {
      test('should return actions filtered by type', () => {
         const action1 = AutomationActionManager.createApiCallAction('API Action 1', 'edge_1', {
            url: 'https://api.example.com',
            method: 'GET'
         });
         const action2 = AutomationActionManager.createScriptAction('Script Action', 'edge_2', {
            language: 'javascript',
            code: 'test'
         });
         const action3 = AutomationActionManager.createApiCallAction('API Action 2', 'edge_3', {
            url: 'https://api2.example.com',
            method: 'POST'
         });
         const node: WorkflowNode = {
            ...createTestProcessNode('process_1', 'Process'),
            automationActions: [action1, action2, action3]
         };

         const apiActions = AutomationActionManager.getActionsByType(node, 'api_call');

         expect(apiActions).toHaveLength(2);
         expect(apiActions.every(a => a.actionType === 'api_call')).toBe(true);
      });
   });
});
