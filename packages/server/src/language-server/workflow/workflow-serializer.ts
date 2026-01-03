/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Grammar, isReference } from 'langium';
import { collectAst } from 'langium/grammar';
import { Serializer } from '../../model-server/serializer.js';
import {
   ApiNode,
   Swimlane as AstSwimlane,
   WorkflowEdge as AstWorkflowEdge,
   WorkflowModel as AstWorkflowModel,
   WorkflowNode as AstWorkflowNode,
   AutoNode,
   ConcurrentNode,
   DecisionNode,
   DecisionTableNode,
   EndNode,
   ExceptionNode,
   isApiNode,
   isAutoNode,
   isConcurrentNode,
   isDecisionNode,
   isDecisionTableNode,
   isEndNode,
   isExceptionNode,
   isSubprocessNode,
   SubprocessNode
} from '../generated/ast.js';

/**
 * 工作流程序列化器
 * Workflow serializer for converting AST to DSL text
 */
export class WorkflowSerializer implements Serializer<AstWorkflowModel> {
   static readonly CHAR_NEWLINE = '\n';
   static readonly CHAR_INDENTATION = ' ';
   static readonly INDENTATION_AMOUNT = 4;

   constructor(
      readonly grammar: Grammar,
      readonly astTypes = collectAst(grammar)
   ) {}

   /**
    * 序列化工作流程模型为 DSL 文本
    * Serialize workflow model to DSL text
    */
   serialize(root: AstWorkflowModel): string {
      const lines: string[] = [];

      lines.push('workflow:');
      lines.push(this.indent(1) + `id: ${root.id ?? 'workflow-1'}`);

      if (root.name) {
         lines.push(this.indent(1) + `name: "${root.name}"`);
      }

      if (root.description) {
         lines.push(this.indent(1) + `description: "${root.description}"`);
      }

      // 序列化元数据 (Serialize metadata)
      if (root.metadata) {
         lines.push(this.indent(1) + 'metadata:');
         if (root.metadata.version) {
            lines.push(this.indent(2) + `version: "${root.metadata.version}"`);
         }
         if (root.metadata.author) {
            lines.push(this.indent(2) + `author: "${root.metadata.author}"`);
         }
         if (root.metadata.tags && root.metadata.tags.length > 0) {
            lines.push(this.indent(2) + 'tags:');
            for (const tag of root.metadata.tags) {
               lines.push(this.indent(3) + `- "${tag}"`);
            }
         }
      }

      // 序列化节点 (Serialize nodes)
      if (root.nodes && root.nodes.length > 0) {
         lines.push(this.indent(1) + 'nodes:');
         for (const node of root.nodes) {
            lines.push(...this.serializeNode(node));
         }
      }

      // 序列化边 (Serialize edges)
      if (root.edges && root.edges.length > 0) {
         lines.push(this.indent(1) + 'edges:');
         for (const edge of root.edges) {
            lines.push(...this.serializeEdge(edge));
         }
      }

      // 序列化泳道 (Serialize swimlanes)
      if (root.swimlanes && root.swimlanes.length > 0) {
         lines.push(this.indent(1) + 'swimlanes:');
         for (const swimlane of root.swimlanes) {
            lines.push(...this.serializeSwimlane(swimlane));
         }
      }

      return lines.join(WorkflowSerializer.CHAR_NEWLINE);
   }

   /**
    * 序列化节点
    * Serialize a workflow node
    */
   private serializeNode(node: AstWorkflowNode): string[] {
      const lines: string[] = [];
      const nodeType = node.nodeType;

      lines.push(this.indent(2) + `- ${nodeType}:`);

      if (node.id) {
         lines.push(this.indent(3) + `id: ${node.id}`);
      }

      if (node.name) {
         lines.push(this.indent(3) + `name: "${node.name}"`);
      }

      if (node.description) {
         lines.push(this.indent(3) + `description: "${node.description}"`);
      }

      // 序列化位置 (Serialize position)
      if (node.position) {
         lines.push(this.indent(3) + 'position:');
         lines.push(this.indent(4) + `x: ${node.position.x}`);
         lines.push(this.indent(4) + `y: ${node.position.y}`);
      }

      // 序列化特定节点类型的属性 (Serialize type-specific properties)
      if (isEndNode(node) || isExceptionNode(node)) {
         const endNode = node as EndNode | ExceptionNode;
         if (endNode.expectedValue) {
            lines.push(this.indent(3) + `expectedValue: "${endNode.expectedValue}"`);
         }
      }

      if (isDecisionNode(node)) {
         const decisionNode = node as DecisionNode;
         if (decisionNode.branches && decisionNode.branches.length > 0) {
            lines.push(this.indent(3) + 'branches:');
            for (const branch of decisionNode.branches) {
               lines.push(this.indent(4) + `- id: ${branch.id ?? ''}`);
               if (branch.value) {
                  lines.push(this.indent(5) + `value: "${branch.value}"`);
               }
               if (branch.isDefault) {
                  lines.push(this.indent(5) + 'isDefault: true');
               }
            }
         }
      }

      if (isDecisionTableNode(node)) {
         const tableNode = node as DecisionTableNode;
         if (tableNode.tableData) {
            lines.push(...this.serializeDecisionTableData(tableNode.tableData));
         }
      }

      if (isSubprocessNode(node)) {
         const subprocessNode = node as SubprocessNode;
         if (subprocessNode.referencePath) {
            lines.push(this.indent(3) + `referencePath: "${subprocessNode.referencePath}"`);
         }
      }

      if (isConcurrentNode(node)) {
         const concurrentNode = node as ConcurrentNode;
         if (concurrentNode.parallelBranches && concurrentNode.parallelBranches.length > 0) {
            lines.push(this.indent(3) + 'parallelBranches:');
            for (const branch of concurrentNode.parallelBranches) {
               lines.push(this.indent(4) + `- id: ${branch.id ?? ''}`);
               if (branch.branchName) {
                  lines.push(this.indent(5) + `name: "${branch.branchName}"`);
               }
            }
         }
      }

      if (isAutoNode(node)) {
         const autoNode = node as AutoNode;
         if (autoNode.automationConfig && autoNode.automationConfig.length > 0) {
            lines.push(this.indent(3) + 'automationConfig:');
            for (const config of autoNode.automationConfig) {
               if (config.key) {
                  lines.push(this.indent(4) + `- key: "${config.key}"`);
                  if (config.configValue) {
                     lines.push(this.indent(5) + `value: "${config.configValue}"`);
                  }
               }
            }
         }
      }

      if (isApiNode(node)) {
         const apiNode = node as ApiNode;
         if (apiNode.apiEndpoint) {
            lines.push(this.indent(3) + `apiEndpoint: "${apiNode.apiEndpoint}"`);
         }
         if (apiNode.apiConfig && apiNode.apiConfig.length > 0) {
            lines.push(this.indent(3) + 'apiConfig:');
            for (const config of apiNode.apiConfig) {
               if (config.key) {
                  lines.push(this.indent(4) + `- key: "${config.key}"`);
                  if (config.configValue) {
                     lines.push(this.indent(5) + `value: "${config.configValue}"`);
                  }
               }
            }
         }
      }

      // 序列化测试数据 (Serialize test data)
      if (node.testData && node.testData.length > 0) {
         lines.push(this.indent(3) + 'testData:');
         for (const testItem of node.testData) {
            lines.push(this.indent(4) + `- id: ${testItem.id ?? ''}`);
            if (testItem.testName) {
               lines.push(this.indent(5) + `name: "${testItem.testName}"`);
            }
            if (testItem.edgeBinding) {
               lines.push(this.indent(5) + `edgeBinding: "${testItem.edgeBinding}"`);
            }
         }
      }

      // 序列化自动化动作 (Serialize automation actions)
      if (node.automationActions && node.automationActions.length > 0) {
         lines.push(this.indent(3) + 'automationActions:');
         for (const action of node.automationActions) {
            lines.push(this.indent(4) + `- id: ${action.id ?? ''}`);
            if (action.actionName) {
               lines.push(this.indent(5) + `name: "${action.actionName}"`);
            }
            if (action.actionType) {
               lines.push(this.indent(5) + `actionType: ${action.actionType}`);
            }
            if (action.edgeBinding) {
               lines.push(this.indent(5) + `edgeBinding: "${action.edgeBinding}"`);
            }
         }
      }

      return lines;
   }

   /**
    * 序列化决策表数据
    * Serialize decision table data
    */
   private serializeDecisionTableData(data: any): string[] {
      const lines: string[] = [];

      lines.push(this.indent(3) + 'tableData:');

      // 输入列 (Input columns)
      if (data.inputColumns && data.inputColumns.length > 0) {
         lines.push(this.indent(4) + 'inputColumns:');
         for (const col of data.inputColumns) {
            lines.push(this.indent(5) + `- id: ${col.id ?? ''}`);
            if (col.columnName) {
               lines.push(this.indent(6) + `name: "${col.columnName}"`);
            }
            if (col.dataType) {
               lines.push(this.indent(6) + `dataType: "${col.dataType}"`);
            }
         }
      }

      // 输出列 (Output columns)
      if (data.outputColumns && data.outputColumns.length > 0) {
         lines.push(this.indent(4) + 'outputColumns:');
         for (const col of data.outputColumns) {
            lines.push(this.indent(5) + `- id: ${col.id ?? ''}`);
            if (col.columnName) {
               lines.push(this.indent(6) + `name: "${col.columnName}"`);
            }
            if (col.dataType) {
               lines.push(this.indent(6) + `dataType: "${col.dataType}"`);
            }
         }
      }

      // 决策列 (Decision columns)
      if (data.decisionColumns && data.decisionColumns.length > 0) {
         lines.push(this.indent(4) + 'decisionColumns:');
         for (const col of data.decisionColumns) {
            lines.push(this.indent(5) + `- id: ${col.id ?? ''}`);
            if (col.columnName) {
               lines.push(this.indent(6) + `name: "${col.columnName}"`);
            }
            if (col.dataType) {
               lines.push(this.indent(6) + `dataType: "${col.dataType}"`);
            }
         }
      }

      // 行数据 (Row data)
      if (data.rows && data.rows.length > 0) {
         lines.push(this.indent(4) + 'rows:');
         for (const row of data.rows) {
            lines.push(this.indent(5) + `- id: ${row.id ?? ''}`);
            if (row.values && row.values.length > 0) {
               lines.push(this.indent(6) + 'values:');
               for (const value of row.values) {
                  if (value.columnId) {
                     lines.push(this.indent(7) + `- column: ${value.columnId}`);
                     if (value.cellValue) {
                        lines.push(this.indent(8) + `value: "${value.cellValue}"`);
                     }
                  }
               }
            }
         }
      }

      return lines;
   }

   /**
    * 序列化边
    * Serialize a workflow edge
    */
   private serializeEdge(edge: AstWorkflowEdge): string[] {
      const lines: string[] = [];

      lines.push(this.indent(2) + '- edge:');

      if (edge.id) {
         lines.push(this.indent(3) + `id: ${edge.id}`);
      }

      if (edge.source) {
         const sourceRef = isReference(edge.source) ? edge.source.$refText : edge.source;
         lines.push(this.indent(3) + `source: ${sourceRef}`);
      }

      if (edge.target) {
         const targetRef = isReference(edge.target) ? edge.target.$refText : edge.target;
         lines.push(this.indent(3) + `target: ${targetRef}`);
      }

      if (edge.condition) {
         lines.push(this.indent(3) + `condition: "${edge.condition}"`);
      }

      if (edge.edgeValue) {
         lines.push(this.indent(3) + `value: "${edge.edgeValue}"`);
      }

      if (edge.dataType) {
         lines.push(this.indent(3) + `dataType: "${edge.dataType}"`);
      }

      return lines;
   }

   /**
    * 序列化泳道
    * Serialize a swimlane
    */
   private serializeSwimlane(swimlane: AstSwimlane): string[] {
      const lines: string[] = [];

      lines.push(this.indent(2) + '- swimlane:');

      if (swimlane.id) {
         lines.push(this.indent(3) + `id: ${swimlane.id}`);
      }

      if (swimlane.name) {
         lines.push(this.indent(3) + `name: "${swimlane.name}"`);
      }

      if (swimlane.description) {
         lines.push(this.indent(3) + `description: "${swimlane.description}"`);
      }

      if (swimlane.position) {
         lines.push(this.indent(3) + 'position:');
         lines.push(this.indent(4) + `x: ${swimlane.position.x}`);
         lines.push(this.indent(4) + `y: ${swimlane.position.y}`);
      }

      if (swimlane.width !== undefined) {
         lines.push(this.indent(3) + `width: ${swimlane.width}`);
      }

      if (swimlane.height !== undefined) {
         lines.push(this.indent(3) + `height: ${swimlane.height}`);
      }

      if (swimlane.color) {
         lines.push(this.indent(3) + `color: "${swimlane.color}"`);
      }

      if (swimlane.containedNodes && swimlane.containedNodes.length > 0) {
         lines.push(this.indent(3) + 'containedNodes:');
         for (const nodeRef of swimlane.containedNodes) {
            const ref = isReference(nodeRef.node) ? nodeRef.node.$refText : nodeRef.node;
            lines.push(this.indent(4) + `- ref: ${ref}`);
         }
      }

      return lines;
   }

   /**
    * 生成缩进
    * Generate indentation
    */
   private indent(level: number): string {
      return WorkflowSerializer.CHAR_INDENTATION.repeat(level * WorkflowSerializer.INDENTATION_AMOUNT);
   }
}
