/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 *
 * Property-Based Test: DSL Round-Trip Consistency
 * 属性测试: DSL 往返一致性
 *
 * **Feature: business-process-modeling, Property 17: DSL 往返一致性**
 * **Validates: Requirements 7.1-7.10**
 *
 * This test verifies that for any valid workflow model, serializing to DSL
 * and then deserializing back produces an equivalent model.
 ********************************************************************************/

import { NodeType } from '@crossmodel/protocol';
import { describe, expect, test } from '@jest/globals';
import * as fc from 'fast-check';
import { WorkflowLanguageServer } from '../../../src/language-server/workflow/workflow-language-server';
import { createTestPosition, createTestWorkflowServer } from './workflow-test-utils';

/**
 * Arbitrary for generating valid node types
 */
const nodeTypeArb = fc.constantFrom(
   NodeType.BEGIN,
   NodeType.END,
   NodeType.EXCEPTION,
   NodeType.PROCESS,
   NodeType.DECISION,
   NodeType.SUBPROCESS,
   NodeType.CONCURRENT,
   NodeType.AUTO,
   NodeType.API
);

/**
 * Arbitrary for generating valid node names (alphanumeric with underscores)
 */
const nodeNameArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{0,19}$/);

/**
 * Arbitrary for generating valid positions
 */
const positionArb = fc.record({
   x: fc.integer({ min: 0, max: 1000 }),
   y: fc.integer({ min: 0, max: 1000 })
});

/**
 * Arbitrary for generating a simple workflow model configuration
 */
const simpleWorkflowConfigArb = fc.record({
   modelId: fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
   modelName: nodeNameArb,
   nodeCount: fc.integer({ min: 2, max: 5 })
});

/**
 * Helper function to compare workflow models for equivalence
 * Compares essential properties while ignoring metadata timestamps
 */
function areModelsEquivalent(
   original: ReturnType<WorkflowLanguageServer['getModel']>,
   parsed: ReturnType<WorkflowLanguageServer['getModel']>
): { equivalent: boolean; differences: string[] } {
   const differences: string[] = [];

   // Compare model ID and name
   if (original.id !== parsed.id) {
      differences.push(`Model ID mismatch: ${original.id} vs ${parsed.id}`);
   }
   if (original.name !== parsed.name) {
      differences.push(`Model name mismatch: ${original.name} vs ${parsed.name}`);
   }

   // Compare node count
   if (original.nodes.size !== parsed.nodes.size) {
      differences.push(`Node count mismatch: ${original.nodes.size} vs ${parsed.nodes.size}`);
   }

   // Compare edge count
   if (original.edges.size !== parsed.edges.size) {
      differences.push(`Edge count mismatch: ${original.edges.size} vs ${parsed.edges.size}`);
   }

   // Compare each node
   for (const [nodeId, originalNode] of original.nodes) {
      const parsedNode = parsed.nodes.get(nodeId);
      if (!parsedNode) {
         differences.push(`Node ${nodeId} missing in parsed model`);
         continue;
      }
      if (originalNode.type !== parsedNode.type) {
         differences.push(`Node ${nodeId} type mismatch: ${originalNode.type} vs ${parsedNode.type}`);
      }
      if (originalNode.name !== parsedNode.name) {
         differences.push(`Node ${nodeId} name mismatch: ${originalNode.name} vs ${parsedNode.name}`);
      }
   }

   // Compare each edge
   for (const [edgeId, originalEdge] of original.edges) {
      const parsedEdge = parsed.edges.get(edgeId);
      if (!parsedEdge) {
         differences.push(`Edge ${edgeId} missing in parsed model`);
         continue;
      }
      if (originalEdge.source !== parsedEdge.source) {
         differences.push(`Edge ${edgeId} source mismatch: ${originalEdge.source} vs ${parsedEdge.source}`);
      }
      if (originalEdge.target !== parsedEdge.target) {
         differences.push(`Edge ${edgeId} target mismatch: ${originalEdge.target} vs ${parsedEdge.target}`);
      }
   }

   return {
      equivalent: differences.length === 0,
      differences
   };
}

describe('Workflow DSL Round-Trip Property Tests', () => {
   /**
    * **Feature: business-process-modeling, Property 17: DSL 往返一致性**
    * **Validates: Requirements 7.1-7.10**
    *
    * Property: For any valid workflow model, serializing to DSL text and then
    * deserializing back should produce an equivalent model.
    *
    * 属性: 对于任何有效的工作流程模型，DSL 序列化后再解析应该产生等价的模型
    */
   test('Property 17: DSL round-trip produces equivalent model', () => {
      fc.assert(
         fc.property(
            simpleWorkflowConfigArb,
            fc.array(nodeTypeArb, { minLength: 1, maxLength: 3 }),
            fc.array(positionArb, { minLength: 1, maxLength: 3 }),
            (config, nodeTypes, positions) => {
               // Create a workflow server with the generated configuration
               const server = createTestWorkflowServer(config.modelId, config.modelName);

               // Create nodes based on generated types
               const createdNodes: string[] = [];
               for (let i = 0; i < Math.min(nodeTypes.length, positions.length); i++) {
                  const nodeType = nodeTypes[i];
                  const position = positions[i];
                  const nodeName = `Node_${i + 1}`;

                  try {
                     const node = server.createNode(nodeType, nodeName, position);
                     createdNodes.push(node.id);
                  } catch {
                     // Skip if node creation fails (e.g., invalid type)
                  }
               }

               // Create edges between consecutive nodes if we have at least 2 nodes
               if (createdNodes.length >= 2) {
                  for (let i = 0; i < createdNodes.length - 1; i++) {
                     try {
                        server.createEdge({
                           source: createdNodes[i],
                           target: createdNodes[i + 1]
                        });
                     } catch {
                        // Skip if edge creation fails
                     }
                  }
               }

               // Get the original model
               const originalModel = server.getModel();

               // Serialize to DSL
               const dslText = server.serialize();

               // Deserialize back to model
               const parsedModel = server.deserialize(dslText);

               // Compare models for equivalence
               const comparison = areModelsEquivalent(originalModel, parsedModel);

               // The models should be equivalent
               return comparison.equivalent;
            }
         ),
         { numRuns: 100 }
      );
   });

   /**
    * Property: Serialization should produce valid DSL text that can be parsed
    * 属性: 序列化应该产生可以被解析的有效 DSL 文本
    */
   test('Property 17.1: Serialization produces parseable DSL text', () => {
      fc.assert(
         fc.property(nodeNameArb, positionArb, (modelName, position) => {
            const server = createTestWorkflowServer('test-model', modelName);

            // Create a simple workflow
            const beginNode = server.createNode(NodeType.BEGIN, 'Start', position);
            const endNode = server.createNode(NodeType.END, 'End', {
               x: position.x + 200,
               y: position.y
            });
            server.createEdge({ source: beginNode.id, target: endNode.id });

            // Serialize
            const dslText = server.serialize();

            // DSL text should not be empty
            expect(dslText.length).toBeGreaterThan(0);

            // DSL text should contain workflow keyword
            expect(dslText).toContain('workflow:');

            // DSL text should contain nodes section
            expect(dslText).toContain('nodes:');

            // DSL text should contain edges section
            expect(dslText).toContain('edges:');

            // Deserialize should not throw
            expect(() => server.deserialize(dslText)).not.toThrow();

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Property: All node types should be serializable and deserializable
    * 属性: 所有节点类型都应该可以序列化和反序列化
    */
   test('Property 17.2: All node types are serializable', () => {
      fc.assert(
         fc.property(nodeTypeArb, nodeNameArb, positionArb, (nodeType, nodeName, position) => {
            const server = createTestWorkflowServer('test-model', 'Test Workflow');

            // Create a node of the specified type
            const node = server.createNode(nodeType, nodeName, position);

            // Serialize
            const dslText = server.serialize();

            // DSL text should contain the node type
            expect(dslText).toContain(nodeType);

            // DSL text should contain the node name
            expect(dslText).toContain(nodeName);

            // Deserialize
            const parsedModel = server.deserialize(dslText);

            // Parsed model should contain the node
            expect(parsedModel.nodes.size).toBeGreaterThanOrEqual(1);

            return true;
         }),
         { numRuns: 100 }
      );
   });

   /**
    * Property: Edge connections should be preserved through round-trip
    * 属性: 边连接应该在往返过程中保持不变
    */
   test('Property 17.3: Edge connections preserved through round-trip', () => {
      fc.assert(
         fc.property(fc.integer({ min: 2, max: 5 }), nodeCount => {
            const server = createTestWorkflowServer('test-model', 'Test Workflow');

            // Create a chain of process nodes
            const nodes: string[] = [];
            for (let i = 0; i < nodeCount; i++) {
               const nodeType = i === 0 ? NodeType.BEGIN : i === nodeCount - 1 ? NodeType.END : NodeType.PROCESS;
               const node = server.createNode(nodeType, `Node_${i}`, createTestPosition(i * 100, 0));
               nodes.push(node.id);
            }

            // Create edges between consecutive nodes
            const originalEdgeCount = nodes.length - 1;
            for (let i = 0; i < originalEdgeCount; i++) {
               server.createEdge({ source: nodes[i], target: nodes[i + 1] });
            }

            // Get original model
            const originalModel = server.getModel();
            expect(originalModel.edges.size).toBe(originalEdgeCount);

            // Serialize and deserialize
            const dslText = server.serialize();
            const parsedModel = server.deserialize(dslText);

            // Edge count should be preserved
            expect(parsedModel.edges.size).toBe(originalEdgeCount);

            return true;
         }),
         { numRuns: 100 }
      );
   });
});
