/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import { ProcessNode } from '../../src/workflow/node';
import {
   ApiNodeManager,
   AutoNodeManager,
   BeginNodeManager,
   ConcurrentNodeManager,
   DecisionNodeManager,
   EndNodeManager,
   ExceptionNodeManager,
   NodeFactory,
   ProcessNodeManager,
   ReferenceNodeManager,
   SubprocessNodeManager
} from '../../src/workflow/node-manager';
import { NodeType, Position } from '../../src/workflow/types';

/**
 * 创建测试用的位置
 * Create test position
 */
function createTestPosition(x: number = 0, y: number = 0): Position {
   return { x, y };
}

describe('NodeManager - Basic Node Types', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   describe('BeginNodeManager', () => {
      test('should create begin node without expected value - 需求 1.1', () => {
         const manager = new BeginNodeManager({
            id: 'begin_1',
            name: 'Start',
            position: createTestPosition()
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.BEGIN);
         expect(node.name).toBe('Start');
         // Begin nodes should not have expectedValue property
         expect('expectedValue' in node).toBe(false);
      });

      test('should validate begin node successfully', () => {
         const manager = new BeginNodeManager({
            id: 'begin_1',
            name: 'Start',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should warn when begin node has no name', () => {
         const manager = new BeginNodeManager({
            id: 'begin_1',
            name: '',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
         expect(result.warnings).toBeDefined();
         expect(result.warnings?.some(w => w.includes('名称'))).toBe(true);
      });

      test('should update node properties', () => {
         const manager = new BeginNodeManager({
            id: 'begin_1',
            name: 'Start',
            position: createTestPosition()
         });

         manager.updateProperties({ description: 'Test description' });
         expect(manager.getNode().properties.description).toBe('Test description');
      });

      test('should update node position', () => {
         const manager = new BeginNodeManager({
            id: 'begin_1',
            name: 'Start',
            position: createTestPosition()
         });

         manager.updatePosition({ x: 100, y: 200 });
         expect(manager.getNode().position).toEqual({ x: 100, y: 200 });
      });
   });

   describe('EndNodeManager', () => {
      test('should create end node with expected value - 需求 1.2', () => {
         const manager = new EndNodeManager({
            id: 'end_1',
            name: 'End',
            position: createTestPosition(),
            expectedValue: 'success'
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.END);
         expect(node.name).toBe('End');
         // End nodes must have expectedValue property
         expect('expectedValue' in node).toBe(true);
         expect(node.expectedValue).toBe('success');
      });

      test('should create end node with null expected value by default', () => {
         const manager = new EndNodeManager({
            id: 'end_1',
            name: 'End',
            position: createTestPosition()
         });

         const node = manager.getNode();
         expect('expectedValue' in node).toBe(true);
         expect(node.expectedValue).toBeNull();
      });

      test('should set and get expected value', () => {
         const manager = new EndNodeManager({
            id: 'end_1',
            name: 'End',
            position: createTestPosition()
         });

         manager.setExpectedValue('completed');
         expect(manager.getExpectedValue()).toBe('completed');
      });

      test('should validate end node successfully', () => {
         const manager = new EndNodeManager({
            id: 'end_1',
            name: 'End',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });
   });

   describe('ExceptionNodeManager', () => {
      test('should create exception node with expected value - 需求 1.3', () => {
         const manager = new ExceptionNodeManager({
            id: 'exception_1',
            name: 'Exception',
            position: createTestPosition(),
            expectedValue: 'error'
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.EXCEPTION);
         expect(node.name).toBe('Exception');
         // Exception nodes must have expectedValue property
         expect('expectedValue' in node).toBe(true);
         expect(node.expectedValue).toBe('error');
      });

      test('should validate exception node successfully', () => {
         const manager = new ExceptionNodeManager({
            id: 'exception_1',
            name: 'Exception',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });
   });

   describe('ProcessNodeManager', () => {
      test('should create process node - 需求 1.4', () => {
         const manager = new ProcessNodeManager({
            id: 'process_1',
            name: 'Process',
            position: createTestPosition()
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.PROCESS);
         expect(node.name).toBe('Process');
      });

      test('should validate process node with single outgoing edge', () => {
         const manager = new ProcessNodeManager({
            id: 'process_1',
            name: 'Process',
            position: createTestPosition()
         });

         const result = manager.validate(1);
         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should fail validation when process node has multiple outgoing edges - 属性 4', () => {
         const manager = new ProcessNodeManager({
            id: 'process_1',
            name: 'Process',
            position: createTestPosition()
         });

         const result = manager.validate(2);
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('过程节点'))).toBe(true);
         expect(result.errors.some(e => e.includes('一条出边'))).toBe(true);
      });
   });

   describe('DecisionNodeManager', () => {
      test('should create decision node with default two branches - 需求 1.5', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.DECISION);
         expect(node.branches).toHaveLength(2);
         expect(node.branches[0].value).toBe('true');
         expect(node.branches[1].value).toBe('false');
      });

      test('should validate decision node with unique branch values - 属性 6', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should fail validation when branch values are not unique - 需求 1.6', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition(),
            branches: [
               { id: 'branch_1', value: 'same_value' },
               { id: 'branch_2', value: 'same_value' }
            ]
         });

         const result = manager.validate();
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('唯一'))).toBe(true);
      });

      test('should add branch with unique value', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const result = manager.addBranch({ id: 'branch_3', value: 'maybe' });
         expect(result.isValid).toBe(true);
         expect(manager.getBranches()).toHaveLength(3);
      });

      test('should reject adding branch with duplicate value', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const result = manager.addBranch({ id: 'branch_3', value: 'true' });
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('已存在'))).toBe(true);
      });

      test('should remove branch', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const removed = manager.removeBranch('branch_1');
         expect(removed).toBe(true);
         expect(manager.getBranches()).toHaveLength(1);
      });

      test('should update branch value', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const result = manager.updateBranchValue('branch_1', 'yes');
         expect(result.isValid).toBe(true);
         expect(manager.getBranches().find(b => b.id === 'branch_1')?.value).toBe('yes');
      });

      test('should reject updating branch value to duplicate', () => {
         const manager = new DecisionNodeManager({
            id: 'decision_1',
            name: 'Decision',
            position: createTestPosition()
         });

         const result = manager.updateBranchValue('branch_1', 'false');
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('已被其他分支使用'))).toBe(true);
      });
   });
});

describe('NodeManager - Advanced Node Types', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   describe('SubprocessNodeManager', () => {
      test('should create subprocess node with reference path - 需求 1.8', () => {
         const manager = new SubprocessNodeManager({
            id: 'subprocess_1',
            name: 'Subprocess',
            position: createTestPosition(),
            referencePath: '/path/to/subprocess'
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.SUBPROCESS);
         expect(node.referencePath).toBe('/path/to/subprocess');
      });

      test('should set and get reference path', () => {
         const manager = new SubprocessNodeManager({
            id: 'subprocess_1',
            name: 'Subprocess',
            position: createTestPosition()
         });

         manager.setReferencePath('/new/path');
         expect(manager.getReferencePath()).toBe('/new/path');
      });

      test('should validate subprocess node successfully', () => {
         const manager = new SubprocessNodeManager({
            id: 'subprocess_1',
            name: 'Subprocess',
            position: createTestPosition(),
            referencePath: '/path/to/subprocess'
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
      });
   });

   describe('ConcurrentNodeManager', () => {
      test('should create concurrent node with parallel branches - 需求 1.9', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['node_1', 'node_2']
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.CONCURRENT);
         expect(node.parallelBranches).toEqual(['node_1', 'node_2']);
      });

      test('should add parallel branch', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition()
         });

         manager.addParallelBranch('node_1');
         expect(manager.getParallelBranches()).toContain('node_1');
      });

      test('should not add duplicate parallel branch', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['node_1']
         });

         manager.addParallelBranch('node_1');
         expect(manager.getParallelBranches()).toHaveLength(1);
      });

      test('should remove parallel branch', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['node_1', 'node_2']
         });

         const removed = manager.removeParallelBranch('node_1');
         expect(removed).toBe(true);
         expect(manager.getParallelBranches()).not.toContain('node_1');
      });

      test('should validate concurrent node with no illegal nodes - 需求 6.3', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['process_1', 'process_2']
         });

         const nodeTypes = new Map<string, NodeType>([
            ['process_1', NodeType.PROCESS],
            ['process_2', NodeType.PROCESS]
         ]);

         const result = manager.validateNoIllegalNodes(nodeTypes);
         expect(result.isValid).toBe(true);
      });

      test('should fail validation when concurrent contains begin node - 属性 15', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['begin_1', 'process_1']
         });

         const nodeTypes = new Map<string, NodeType>([
            ['begin_1', NodeType.BEGIN],
            ['process_1', NodeType.PROCESS]
         ]);

         const result = manager.validateNoIllegalNodes(nodeTypes);
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('开始节点'))).toBe(true);
      });

      test('should fail validation when concurrent contains end node', () => {
         const manager = new ConcurrentNodeManager({
            id: 'concurrent_1',
            name: 'Concurrent',
            position: createTestPosition(),
            parallelBranches: ['end_1', 'process_1']
         });

         const nodeTypes = new Map<string, NodeType>([
            ['end_1', NodeType.END],
            ['process_1', NodeType.PROCESS]
         ]);

         const result = manager.validateNoIllegalNodes(nodeTypes);
         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('结束节点'))).toBe(true);
      });
   });

   describe('AutoNodeManager', () => {
      test('should create auto node with automation config - 需求 1.10', () => {
         const config = { script: 'test.js', timeout: 5000 };
         const manager = new AutoNodeManager({
            id: 'auto_1',
            name: 'Auto',
            position: createTestPosition(),
            automationConfig: config
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.AUTO);
         expect(node.automationConfig).toEqual(config);
      });

      test('should set and get automation config', () => {
         const manager = new AutoNodeManager({
            id: 'auto_1',
            name: 'Auto',
            position: createTestPosition()
         });

         const config = { script: 'new.js' };
         manager.setAutomationConfig(config);
         expect(manager.getAutomationConfig()).toEqual(config);
      });

      test('should validate auto node successfully', () => {
         const manager = new AutoNodeManager({
            id: 'auto_1',
            name: 'Auto',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
      });
   });

   describe('ApiNodeManager', () => {
      test('should create API node with endpoint and config - 需求 1.11', () => {
         const manager = new ApiNodeManager({
            id: 'api_1',
            name: 'API',
            position: createTestPosition(),
            apiEndpoint: 'https://api.example.com/endpoint',
            apiConfig: { method: 'POST', headers: {} }
         });

         const node = manager.getNode();
         expect(node).toBeDefined();
         expect(node.type).toBe(NodeType.API);
         expect(node.apiEndpoint).toBe('https://api.example.com/endpoint');
         expect(node.apiConfig).toEqual({ method: 'POST', headers: {} });
      });

      test('should set and get API endpoint', () => {
         const manager = new ApiNodeManager({
            id: 'api_1',
            name: 'API',
            position: createTestPosition()
         });

         manager.setApiEndpoint('https://new.api.com');
         expect(manager.getApiEndpoint()).toBe('https://new.api.com');
      });

      test('should set and get API config', () => {
         const manager = new ApiNodeManager({
            id: 'api_1',
            name: 'API',
            position: createTestPosition()
         });

         const config = { method: 'GET' };
         manager.setApiConfig(config);
         expect(manager.getApiConfig()).toEqual(config);
      });

      test('should validate API node successfully', () => {
         const manager = new ApiNodeManager({
            id: 'api_1',
            name: 'API',
            position: createTestPosition()
         });

         const result = manager.validate();
         expect(result.isValid).toBe(true);
      });
   });
});

describe('ReferenceNodeManager', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   test('should create reference node from source node - 需求 4.2', () => {
      const sourceNode: ProcessNode = {
         id: 'process_1',
         type: NodeType.PROCESS,
         name: 'Source Process',
         position: createTestPosition(),
         properties: { description: 'Test' }
      };

      const manager = new ReferenceNodeManager(sourceNode, 'ref_1');
      const node = manager.getNode();

      expect(node).toBeDefined();
      expect(node.sourceNodeId).toBe('process_1');
      expect(node.isReference).toBe(true);
      expect(node.name).toBe('Source Process (Reference)');
   });

   test('should only allow editing name and stepDisplay - 需求 4.4, 属性 13', () => {
      const sourceNode: ProcessNode = {
         id: 'process_1',
         type: NodeType.PROCESS,
         name: 'Source Process',
         position: createTestPosition(),
         properties: {}
      };

      const manager = new ReferenceNodeManager(sourceNode, 'ref_1');

      expect(manager.isPropertyEditable('name')).toBe(true);
      expect(manager.isPropertyEditable('stepDisplay')).toBe(true);
      expect(manager.isPropertyEditable('description')).toBe(false);
      expect(manager.isPropertyEditable('position')).toBe(false);
   });

   test('should update editable property successfully', () => {
      const sourceNode: ProcessNode = {
         id: 'process_1',
         type: NodeType.PROCESS,
         name: 'Source Process',
         position: createTestPosition(),
         properties: {}
      };

      const manager = new ReferenceNodeManager(sourceNode, 'ref_1');

      const result = manager.updateEditableProperty('name', 'New Name');
      expect(result.isValid).toBe(true);
      expect(manager.getNode().name).toBe('New Name');
   });

   test('should validate reference node successfully - 属性 12', () => {
      const sourceNode: ProcessNode = {
         id: 'process_1',
         type: NodeType.PROCESS,
         name: 'Source Process',
         position: createTestPosition(),
         properties: {}
      };

      const manager = new ReferenceNodeManager(sourceNode, 'ref_1');
      const result = manager.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
   });
});

describe('NodeFactory', () => {
   beforeEach(() => {
      NodeFactory.resetIdCounter();
   });

   test('should generate unique node IDs', () => {
      const id1 = NodeFactory.generateNodeId();
      const id2 = NodeFactory.generateNodeId();

      expect(id1).not.toBe(id2);
      expect(id1).toBe('node_1');
      expect(id2).toBe('node_2');
   });

   test('should create begin node via factory', () => {
      const manager = NodeFactory.createBeginNode('Start', createTestPosition());
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.BEGIN);
      expect(node.name).toBe('Start');
      expect(node.id).toMatch(/^begin_\d+$/);
   });

   test('should create end node via factory', () => {
      const manager = NodeFactory.createEndNode('End', createTestPosition(), 'success');
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.END);
      expect(node.expectedValue).toBe('success');
   });

   test('should create exception node via factory', () => {
      const manager = NodeFactory.createExceptionNode('Exception', createTestPosition(), 'error');
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.EXCEPTION);
      expect(node.expectedValue).toBe('error');
   });

   test('should create process node via factory', () => {
      const manager = NodeFactory.createProcessNode('Process', createTestPosition());
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.PROCESS);
   });

   test('should create decision node via factory', () => {
      const manager = NodeFactory.createDecisionNode('Decision', createTestPosition());
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.DECISION);
      expect(node.branches).toHaveLength(2);
   });

   test('should create subprocess node via factory', () => {
      const manager = NodeFactory.createSubprocessNode('Subprocess', createTestPosition(), '/path');
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.SUBPROCESS);
      expect(node.referencePath).toBe('/path');
   });

   test('should create concurrent node via factory', () => {
      const manager = NodeFactory.createConcurrentNode('Concurrent', createTestPosition(), ['n1', 'n2']);
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.CONCURRENT);
      expect(node.parallelBranches).toEqual(['n1', 'n2']);
   });

   test('should create auto node via factory', () => {
      const manager = NodeFactory.createAutoNode('Auto', createTestPosition(), { script: 'test.js' });
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.AUTO);
      expect(node.automationConfig).toEqual({ script: 'test.js' });
   });

   test('should create API node via factory', () => {
      const manager = NodeFactory.createApiNode('API', createTestPosition(), 'https://api.com', { method: 'GET' });
      const node = manager.getNode();

      expect(node.type).toBe(NodeType.API);
      expect(node.apiEndpoint).toBe('https://api.com');
   });

   test('should create reference node via factory', () => {
      const sourceNode: ProcessNode = {
         id: 'process_1',
         type: NodeType.PROCESS,
         name: 'Source',
         position: createTestPosition(),
         properties: {}
      };

      const manager = NodeFactory.createReferenceNode(sourceNode);
      const node = manager.getNode();

      expect(node.isReference).toBe(true);
      expect(node.sourceNodeId).toBe('process_1');
   });

   test('should create node by type', () => {
      const beginManager = NodeFactory.createNodeByType(NodeType.BEGIN, 'Start', createTestPosition());
      expect(beginManager.getNode().type).toBe(NodeType.BEGIN);

      const endManager = NodeFactory.createNodeByType(NodeType.END, 'End', createTestPosition());
      expect(endManager.getNode().type).toBe(NodeType.END);

      const processManager = NodeFactory.createNodeByType(NodeType.PROCESS, 'Process', createTestPosition());
      expect(processManager.getNode().type).toBe(NodeType.PROCESS);
   });

   test('should throw error for unsupported node type', () => {
      expect(() => {
         NodeFactory.createNodeByType('invalid' as NodeType, 'Invalid', createTestPosition());
      }).toThrow('Unsupported node type');
   });
});
