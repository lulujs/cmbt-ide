/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import {
   addNodeToSwimlane,
   createSwimlane,
   CreateSwimlaneParams,
   findSwimlaneForNode,
   isNodeInSwimlane,
   removeNodeFromSwimlane,
   Swimlane,
   SwimlaneCollectionManager,
   SwimlaneManager
} from '../../src/workflow/swimlane';

describe('Swimlane - Basic Functions', () => {
   describe('createSwimlane', () => {
      test('should create swimlane with default values', () => {
         const swimlane = createSwimlane('swimlane_1', { name: 'Test Swimlane' });

         expect(swimlane.id).toBe('swimlane_1');
         expect(swimlane.name).toBe('Test Swimlane');
         expect(swimlane.position).toEqual({ x: 0, y: 0 });
         expect(swimlane.size).toEqual({ width: 400, height: 300 });
         expect(swimlane.containedNodes).toEqual([]);
         expect(swimlane.properties).toEqual({});
      });

      test('should create swimlane with custom values', () => {
         const params: CreateSwimlaneParams = {
            name: 'Custom Swimlane',
            position: { x: 100, y: 200 },
            size: { width: 500, height: 400 },
            properties: { color: '#ff0000', description: 'Test' }
         };

         const swimlane = createSwimlane('swimlane_2', params);

         expect(swimlane.position).toEqual({ x: 100, y: 200 });
         expect(swimlane.size).toEqual({ width: 500, height: 400 });
         expect(swimlane.properties.color).toBe('#ff0000');
         expect(swimlane.properties.description).toBe('Test');
      });
   });

   describe('addNodeToSwimlane', () => {
      test('should add node to swimlane - 需求 3.2', () => {
         const swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         const updated = addNodeToSwimlane(swimlane, 'node_1');

         expect(updated.containedNodes).toContain('node_1');
         expect(updated.containedNodes).toHaveLength(1);
      });

      test('should not add duplicate node', () => {
         let swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         swimlane = addNodeToSwimlane(swimlane, 'node_1');
         swimlane = addNodeToSwimlane(swimlane, 'node_1');

         expect(swimlane.containedNodes).toHaveLength(1);
      });

      test('should add multiple different nodes', () => {
         let swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         swimlane = addNodeToSwimlane(swimlane, 'node_1');
         swimlane = addNodeToSwimlane(swimlane, 'node_2');
         swimlane = addNodeToSwimlane(swimlane, 'node_3');

         expect(swimlane.containedNodes).toHaveLength(3);
         expect(swimlane.containedNodes).toEqual(['node_1', 'node_2', 'node_3']);
      });
   });

   describe('removeNodeFromSwimlane', () => {
      test('should remove node from swimlane', () => {
         let swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         swimlane = addNodeToSwimlane(swimlane, 'node_1');
         swimlane = addNodeToSwimlane(swimlane, 'node_2');
         swimlane = removeNodeFromSwimlane(swimlane, 'node_1');

         expect(swimlane.containedNodes).not.toContain('node_1');
         expect(swimlane.containedNodes).toContain('node_2');
         expect(swimlane.containedNodes).toHaveLength(1);
      });

      test('should handle removing non-existent node', () => {
         const swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         const updated = removeNodeFromSwimlane(swimlane, 'non_existent');

         expect(updated.containedNodes).toHaveLength(0);
      });
   });

   describe('isNodeInSwimlane', () => {
      test('should return true when node is in swimlane', () => {
         let swimlane = createSwimlane('swimlane_1', { name: 'Test' });
         swimlane = addNodeToSwimlane(swimlane, 'node_1');

         expect(isNodeInSwimlane(swimlane, 'node_1')).toBe(true);
      });

      test('should return false when node is not in swimlane', () => {
         const swimlane = createSwimlane('swimlane_1', { name: 'Test' });

         expect(isNodeInSwimlane(swimlane, 'node_1')).toBe(false);
      });
   });

   describe('findSwimlaneForNode', () => {
      test('should find swimlane containing node', () => {
         let swimlane1 = createSwimlane('swimlane_1', { name: 'Swimlane 1' });
         let swimlane2 = createSwimlane('swimlane_2', { name: 'Swimlane 2' });
         swimlane1 = addNodeToSwimlane(swimlane1, 'node_1');
         swimlane2 = addNodeToSwimlane(swimlane2, 'node_2');

         const found = findSwimlaneForNode([swimlane1, swimlane2], 'node_2');

         expect(found).toBeDefined();
         expect(found?.id).toBe('swimlane_2');
      });

      test('should return undefined when node is not in any swimlane', () => {
         const swimlane1 = createSwimlane('swimlane_1', { name: 'Swimlane 1' });
         const swimlane2 = createSwimlane('swimlane_2', { name: 'Swimlane 2' });

         const found = findSwimlaneForNode([swimlane1, swimlane2], 'node_1');

         expect(found).toBeUndefined();
      });
   });
});

describe('SwimlaneManager', () => {
   beforeEach(() => {
      SwimlaneManager.resetIdCounter();
   });

   describe('Creation and Basic Operations', () => {
      test('should create swimlane manager with default values - 需求 3.1, 属性 10', () => {
         const manager = new SwimlaneManager({ name: 'Test Swimlane' });
         const swimlane = manager.getSwimlane();

         expect(swimlane).toBeDefined();
         expect(swimlane.name).toBe('Test Swimlane');
         expect(swimlane.position).toEqual({ x: 0, y: 0 });
         expect(swimlane.size).toEqual({ width: 400, height: 300 });
         expect(swimlane.containedNodes).toEqual([]);
      });

      test('should create swimlane manager with custom ID', () => {
         const manager = new SwimlaneManager({ id: 'custom_id', name: 'Test' });

         expect(manager.getId()).toBe('custom_id');
      });

      test('should generate unique IDs', () => {
         const id1 = SwimlaneManager.generateSwimlaneId();
         const id2 = SwimlaneManager.generateSwimlaneId();

         expect(id1).not.toBe(id2);
         expect(id1).toBe('swimlane_1');
         expect(id2).toBe('swimlane_2');
      });

      test('should update swimlane name', () => {
         const manager = new SwimlaneManager({ name: 'Original' });
         manager.updateName('Updated');

         expect(manager.getName()).toBe('Updated');
      });

      test('should update swimlane position', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.updatePosition({ x: 100, y: 200 });

         expect(manager.getPosition()).toEqual({ x: 100, y: 200 });
      });

      test('should update swimlane size', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.updateSize({ width: 600, height: 500 });

         expect(manager.getSize()).toEqual({ width: 600, height: 500 });
      });

      test('should update swimlane properties', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.updateProperties({ color: '#00ff00', description: 'Updated' });

         const props = manager.getProperties();
         expect(props.color).toBe('#00ff00');
         expect(props.description).toBe('Updated');
      });
   });

   describe('Node Management', () => {
      test('should add node to swimlane - 需求 3.2, 属性 11', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         const added = manager.addNode('node_1');

         expect(added).toBe(true);
         expect(manager.containsNode('node_1')).toBe(true);
         expect(manager.getNodeCount()).toBe(1);
      });

      test('should not add duplicate node', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.addNode('node_1');
         const added = manager.addNode('node_1');

         expect(added).toBe(false);
         expect(manager.getNodeCount()).toBe(1);
      });

      test('should add multiple nodes', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         const added = manager.addNodes(['node_1', 'node_2', 'node_3']);

         expect(added).toEqual(['node_1', 'node_2', 'node_3']);
         expect(manager.getNodeCount()).toBe(3);
      });

      test('should remove node from swimlane', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.addNode('node_1');
         const removed = manager.removeNode('node_1');

         expect(removed).toBe(true);
         expect(manager.containsNode('node_1')).toBe(false);
      });

      test('should return false when removing non-existent node', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         const removed = manager.removeNode('non_existent');

         expect(removed).toBe(false);
      });

      test('should remove multiple nodes', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.addNodes(['node_1', 'node_2', 'node_3']);
         const removed = manager.removeNodes(['node_1', 'node_3']);

         expect(removed).toEqual(['node_1', 'node_3']);
         expect(manager.getNodeCount()).toBe(1);
         expect(manager.containsNode('node_2')).toBe(true);
      });

      test('should clear all nodes', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.addNodes(['node_1', 'node_2', 'node_3']);
         const cleared = manager.clearNodes();

         expect(cleared).toEqual(['node_1', 'node_2', 'node_3']);
         expect(manager.isEmpty()).toBe(true);
      });

      test('should get contained nodes', () => {
         const manager = new SwimlaneManager({ name: 'Test' });
         manager.addNodes(['node_1', 'node_2']);

         const nodes = manager.getContainedNodes();
         expect(nodes).toEqual(['node_1', 'node_2']);
      });

      test('should check if swimlane is empty', () => {
         const manager = new SwimlaneManager({ name: 'Test' });

         expect(manager.isEmpty()).toBe(true);

         manager.addNode('node_1');
         expect(manager.isEmpty()).toBe(false);
      });
   });

   describe('Point Containment', () => {
      test('should check if point is within swimlane bounds', () => {
         const manager = new SwimlaneManager({
            name: 'Test',
            position: { x: 100, y: 100 },
            size: { width: 200, height: 150 }
         });

         // Inside
         expect(manager.containsPoint({ x: 150, y: 150 })).toBe(true);
         expect(manager.containsPoint({ x: 100, y: 100 })).toBe(true); // Edge
         expect(manager.containsPoint({ x: 300, y: 250 })).toBe(true); // Edge

         // Outside
         expect(manager.containsPoint({ x: 50, y: 150 })).toBe(false);
         expect(manager.containsPoint({ x: 350, y: 150 })).toBe(false);
         expect(manager.containsPoint({ x: 150, y: 50 })).toBe(false);
         expect(manager.containsPoint({ x: 150, y: 300 })).toBe(false);
      });
   });

   describe('Validation', () => {
      test('should validate swimlane successfully - 属性 10', () => {
         const manager = new SwimlaneManager({ name: 'Valid Swimlane' });
         const result = manager.validate();

         expect(result.isValid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test('should warn when swimlane has no name', () => {
         const manager = new SwimlaneManager({ name: '' });
         const result = manager.validate();

         expect(result.isValid).toBe(true);
         expect(result.warnings).toBeDefined();
         expect(result.warnings?.some(w => w.includes('名称'))).toBe(true);
      });

      test('should fail validation when width is zero or negative', () => {
         const manager = new SwimlaneManager({
            name: 'Test',
            size: { width: 0, height: 100 }
         });
         const result = manager.validate();

         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('宽度'))).toBe(true);
      });

      test('should fail validation when height is zero or negative', () => {
         const manager = new SwimlaneManager({
            name: 'Test',
            size: { width: 100, height: -10 }
         });
         const result = manager.validate();

         expect(result.isValid).toBe(false);
         expect(result.errors.some(e => e.includes('高度'))).toBe(true);
      });
   });

   describe('Cloning', () => {
      test('should clone swimlane without nodes', () => {
         const manager = new SwimlaneManager({
            name: 'Original',
            position: { x: 100, y: 100 },
            properties: { color: '#ff0000' }
         });
         manager.addNodes(['node_1', 'node_2']);

         const cloned = manager.clone();

         expect(cloned.getName()).toBe('Original (Copy)');
         expect(cloned.getPosition()).toEqual({ x: 100, y: 100 });
         expect(cloned.getProperties().color).toBe('#ff0000');
         expect(cloned.isEmpty()).toBe(true);
         expect(cloned.getId()).not.toBe(manager.getId());
      });

      test('should clone swimlane with nodes', () => {
         const manager = new SwimlaneManager({ name: 'Original' });
         manager.addNodes(['node_1', 'node_2']);

         const cloned = manager.cloneWithNodes();

         expect(cloned.getContainedNodes()).toEqual(['node_1', 'node_2']);
      });
   });
});

describe('SwimlaneCollectionManager', () => {
   let collectionManager: SwimlaneCollectionManager;

   beforeEach(() => {
      SwimlaneManager.resetIdCounter();
      collectionManager = new SwimlaneCollectionManager();
   });

   describe('Swimlane Creation and Retrieval', () => {
      test('should create swimlane - 需求 3.1, 属性 10', () => {
         const manager = collectionManager.createSwimlane({ name: 'Test Swimlane' });

         expect(manager).toBeDefined();
         expect(manager.getName()).toBe('Test Swimlane');
         expect(collectionManager.getSwimlaneCount()).toBe(1);
      });

      test('should get swimlane by ID', () => {
         const created = collectionManager.createSwimlane({ id: 'test_id', name: 'Test' });
         const retrieved = collectionManager.getSwimlane('test_id');

         expect(retrieved).toBe(created);
      });

      test('should return undefined for non-existent swimlane', () => {
         const retrieved = collectionManager.getSwimlane('non_existent');

         expect(retrieved).toBeUndefined();
      });

      test('should get all swimlanes', () => {
         collectionManager.createSwimlane({ name: 'Swimlane 1' });
         collectionManager.createSwimlane({ name: 'Swimlane 2' });

         const all = collectionManager.getAllSwimlanes();

         expect(all).toHaveLength(2);
      });

      test('should get all swimlane data', () => {
         collectionManager.createSwimlane({ name: 'Swimlane 1' });
         collectionManager.createSwimlane({ name: 'Swimlane 2' });

         const data = collectionManager.getAllSwimlaneData();

         expect(data).toHaveLength(2);
         expect(data[0].name).toBe('Swimlane 1');
         expect(data[1].name).toBe('Swimlane 2');
      });
   });

   describe('Swimlane Deletion', () => {
      test('should delete swimlane - 需求 3.4', () => {
         const manager = collectionManager.createSwimlane({ id: 'test_id', name: 'Test' });
         manager.addNodes(['node_1', 'node_2']);

         const deletedNodes = collectionManager.deleteSwimlane('test_id');

         expect(collectionManager.getSwimlane('test_id')).toBeUndefined();
         expect(collectionManager.getSwimlaneCount()).toBe(0);
         expect(deletedNodes).toEqual([]); // Without deleteContainedNodes option
      });

      test('should delete swimlane and return contained nodes when option is set', () => {
         const manager = collectionManager.createSwimlane({ id: 'test_id', name: 'Test' });
         manager.addNodes(['node_1', 'node_2']);

         const deletedNodes = collectionManager.deleteSwimlane('test_id', { deleteContainedNodes: true });

         expect(deletedNodes).toEqual(['node_1', 'node_2']);
      });

      test('should return empty array when deleting non-existent swimlane', () => {
         const deletedNodes = collectionManager.deleteSwimlane('non_existent');

         expect(deletedNodes).toEqual([]);
      });
   });

   describe('Node Assignment', () => {
      test('should assign node to swimlane - 需求 3.2, 属性 11', () => {
         collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Test' });

         const result = collectionManager.assignNodeToSwimlane('node_1', 'swimlane_1');

         expect(result.success).toBe(true);
         expect(result.newSwimlaneId).toBe('swimlane_1');
         expect(result.nodeId).toBe('node_1');
         expect(collectionManager.getSwimlaneIdForNode('node_1')).toBe('swimlane_1');
      });

      test('should move node between swimlanes', () => {
         collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Swimlane 1' });
         collectionManager.createSwimlane({ id: 'swimlane_2', name: 'Swimlane 2' });

         collectionManager.assignNodeToSwimlane('node_1', 'swimlane_1');
         const result = collectionManager.assignNodeToSwimlane('node_1', 'swimlane_2');

         expect(result.success).toBe(true);
         expect(result.previousSwimlaneId).toBe('swimlane_1');
         expect(result.newSwimlaneId).toBe('swimlane_2');
         expect(collectionManager.getSwimlaneIdForNode('node_1')).toBe('swimlane_2');

         // Verify node was removed from first swimlane
         const swimlane1 = collectionManager.getSwimlane('swimlane_1');
         expect(swimlane1?.containsNode('node_1')).toBe(false);
      });

      test('should fail when assigning to non-existent swimlane', () => {
         const result = collectionManager.assignNodeToSwimlane('node_1', 'non_existent');

         expect(result.success).toBe(false);
         expect(result.error).toBeDefined();
      });

      test('should remove node from swimlane', () => {
         collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Test' });
         collectionManager.assignNodeToSwimlane('node_1', 'swimlane_1');

         const result = collectionManager.removeNodeFromSwimlane('node_1');

         expect(result.success).toBe(true);
         expect(result.previousSwimlaneId).toBe('swimlane_1');
         expect(collectionManager.isNodeInAnySwimlane('node_1')).toBe(false);
      });

      test('should fail when removing node not in any swimlane', () => {
         const result = collectionManager.removeNodeFromSwimlane('node_1');

         expect(result.success).toBe(false);
         expect(result.error).toBeDefined();
      });

      test('should get swimlane for node', () => {
         const manager = collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Test' });
         collectionManager.assignNodeToSwimlane('node_1', 'swimlane_1');

         const swimlane = collectionManager.getSwimlaneForNode('node_1');

         expect(swimlane).toBe(manager);
      });

      test('should check if node is in any swimlane', () => {
         collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Test' });

         expect(collectionManager.isNodeInAnySwimlane('node_1')).toBe(false);

         collectionManager.assignNodeToSwimlane('node_1', 'swimlane_1');
         expect(collectionManager.isNodeInAnySwimlane('node_1')).toBe(true);
      });
   });

   describe('Swimlane Movement', () => {
      test('should move swimlane - 需求 3.3', () => {
         collectionManager.createSwimlane({
            id: 'swimlane_1',
            name: 'Test',
            position: { x: 0, y: 0 }
         });

         const result = collectionManager.moveSwimlane('swimlane_1', { x: 100, y: 200 });

         expect(result).toBeDefined();
         expect(result?.deltaX).toBe(100);
         expect(result?.deltaY).toBe(200);
         expect(result?.swimlane.getPosition()).toEqual({ x: 100, y: 200 });
      });

      test('should return undefined when moving non-existent swimlane', () => {
         const result = collectionManager.moveSwimlane('non_existent', { x: 100, y: 200 });

         expect(result).toBeUndefined();
      });
   });

   describe('Find Swimlane at Position', () => {
      test('should find swimlane at position', () => {
         collectionManager.createSwimlane({
            id: 'swimlane_1',
            name: 'Test',
            position: { x: 100, y: 100 },
            size: { width: 200, height: 150 }
         });

         const found = collectionManager.findSwimlaneAtPosition({ x: 150, y: 150 });

         expect(found).toBeDefined();
         expect(found?.getId()).toBe('swimlane_1');
      });

      test('should return undefined when no swimlane at position', () => {
         collectionManager.createSwimlane({
            id: 'swimlane_1',
            name: 'Test',
            position: { x: 100, y: 100 },
            size: { width: 200, height: 150 }
         });

         const found = collectionManager.findSwimlaneAtPosition({ x: 50, y: 50 });

         expect(found).toBeUndefined();
      });
   });

   describe('Validation', () => {
      test('should validate all swimlanes', () => {
         collectionManager.createSwimlane({ id: 'valid', name: 'Valid' });
         collectionManager.createSwimlane({
            id: 'invalid',
            name: 'Invalid',
            size: { width: 0, height: 100 }
         });

         const results = collectionManager.validateAll();

         expect(results.get('valid')?.isValid).toBe(true);
         expect(results.get('invalid')?.isValid).toBe(false);
      });
   });

   describe('Import/Export', () => {
      test('should import from data', () => {
         const data: Swimlane[] = [
            {
               id: 'swimlane_1',
               name: 'Swimlane 1',
               position: { x: 0, y: 0 },
               size: { width: 400, height: 300 },
               properties: {},
               containedNodes: ['node_1', 'node_2']
            },
            {
               id: 'swimlane_2',
               name: 'Swimlane 2',
               position: { x: 500, y: 0 },
               size: { width: 400, height: 300 },
               properties: {},
               containedNodes: ['node_3']
            }
         ];

         collectionManager.importFromData(data);

         expect(collectionManager.getSwimlaneCount()).toBe(2);
         expect(collectionManager.getSwimlaneIdForNode('node_1')).toBe('swimlane_1');
         expect(collectionManager.getSwimlaneIdForNode('node_3')).toBe('swimlane_2');
      });

      test('should export to data', () => {
         const manager1 = collectionManager.createSwimlane({ id: 'swimlane_1', name: 'Swimlane 1' });
         manager1.addNodes(['node_1', 'node_2']);
         collectionManager.createSwimlane({ id: 'swimlane_2', name: 'Swimlane 2' });

         const exported = collectionManager.exportToData();

         expect(exported).toHaveLength(2);
         const swimlane1Data = exported.find(s => s.id === 'swimlane_1');
         expect(swimlane1Data?.containedNodes).toEqual(['node_1', 'node_2']);
      });

      test('should clear all swimlanes', () => {
         collectionManager.createSwimlane({ name: 'Test 1' });
         collectionManager.createSwimlane({ name: 'Test 2' });
         collectionManager.assignNodeToSwimlane('node_1', collectionManager.getAllSwimlanes()[0].getId());

         collectionManager.clear();

         expect(collectionManager.getSwimlaneCount()).toBe(0);
         expect(collectionManager.isNodeInAnySwimlane('node_1')).toBe(false);
      });
   });
});
