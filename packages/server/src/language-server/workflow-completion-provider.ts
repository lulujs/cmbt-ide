/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 * Workflow Completion Provider - 工作流程智能代码补全
 * 需求 7.1-7.10, 8.1-8.3: 智能的用户辅助功能
 ********************************************************************************/

import { AstNodeDescription, AstUtils, GrammarAST, MaybePromise } from 'langium';
import { CompletionAcceptor, CompletionContext, CompletionValueItem, DefaultCompletionProvider, NextFeature } from 'langium/lsp';
import { CompletionItemKind, InsertTextFormat, MarkupKind, TextEdit } from 'vscode-languageserver-protocol';
import type { Range } from 'vscode-languageserver-types';

/**
 * Workflow-specific completion provider with intelligent assistance
 * 工作流程专用的智能代码补全提供器
 */
export class WorkflowCompletionProvider extends DefaultCompletionProvider {
   override readonly completionOptions = {
      triggerCharacters: ['\n', ' ', '{', '.', ':', '(']
   };

   protected override completionFor(
      context: CompletionContext,
      next: NextFeature<GrammarAST.AbstractElement>,
      acceptor: CompletionAcceptor
   ): MaybePromise<void> {
      const assignment = AstUtils.getContainerOfType(next.feature, GrammarAST.isAssignment);

      if (!GrammarAST.isCrossReference(next.feature) && assignment) {
         return this.completionForWorkflowAssignment(context, next, assignment, acceptor);
      }

      return super.completionFor(context, next, acceptor);
   }

   protected completionForWorkflowAssignment(
      context: CompletionContext,
      next: NextFeature<GrammarAST.AbstractElement>,
      assignment: GrammarAST.Assignment,
      acceptor: CompletionAcceptor
   ): MaybePromise<void> {
      switch (assignment.feature) {
         case 'type':
            return this.completeNodeType(context, acceptor);
         case 'name':
            return this.completeNodeName(context, acceptor);
         case 'condition':
            return this.completeCondition(context, acceptor);
         case 'expectedValue':
            return this.completeExpectedValue(context, acceptor);
         case 'testData':
            return this.completeTestData(context, acceptor);
         case 'automationActions':
            return this.completeAutomationActions(context, acceptor);
         case 'decisionTable':
            return this.completeDecisionTable(context, acceptor);
         case 'swimlane':
            return this.completeSwimlane(context, acceptor);
         default:
            return super.completionFor(context, next, acceptor);
      }
   }

   /**
    * Complete node types with descriptions and examples
    * 补全节点类型，包含描述和示例
    */
   protected completeNodeType(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const nodeTypes = [
         {
            label: 'begin',
            detail: 'Begin Node - 开始节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**开始节点**\n\n流程的起始点，没有输入边，通常有一个输出边。\n\n**示例:**\n\`\`\`\nbegin StartProcess {\n  name: "开始处理"\n  testData: {\n    input: {}\n    expected: "started"\n  }\n}\n\`\`\``
            },
            insertText: 'begin ${1:NodeName} {\n  name: "${2:节点名称}"\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Class,
            sortText: '01'
         },
         {
            label: 'end',
            detail: 'End Node - 结束节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**结束节点**\n\n流程的终点，有输入边但没有输出边，必须指定预期值。\n\n**示例:**\n\`\`\`\nend FinishProcess {\n  name: "完成处理"\n  expectedValue: "completed"\n}\n\`\`\``
            },
            insertText: 'end ${1:NodeName} {\n  name: "${2:节点名称}"\n  expectedValue: "${3:expected_result}"\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Class,
            sortText: '02'
         },
         {
            label: 'process',
            detail: 'Process Node - 过程节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**过程节点**\n\n执行具体业务逻辑的节点，只能有一条输出边。\n\n**示例:**\n\`\`\`\nprocess ValidateData {\n  name: "验证数据"\n  description: "验证输入数据的完整性"\n  testData: {\n    input: { data: "test" }\n    expected: { valid: true }\n  }\n}\n\`\`\``
            },
            insertText: 'process ${1:NodeName} {\n  name: "${2:节点名称}"\n  description: "${3:节点描述}"\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Method,
            sortText: '03'
         },
         {
            label: 'decision',
            detail: 'Decision Node - 分支节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**分支节点**\n\n根据条件进行分支的节点，默认有两条输出边。\n\n**示例:**\n\`\`\`\ndecision CheckStatus {\n  name: "检查状态"\n  branches: {\n    "success": "状态正常"\n    "failure": "状态异常"\n  }\n}\n\`\`\``
            },
            insertText:
               'decision ${1:NodeName} {\n  name: "${2:节点名称}"\n  branches: {\n    "${3:condition1}": "${4:描述1}"\n    "${5:condition2}": "${6:描述2}"\n  }\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Enum,
            sortText: '04'
         },
         {
            label: 'decision_table',
            detail: 'Decision Table Node - 决策表节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**决策表节点**\n\n使用表格形式定义复杂决策逻辑的节点。\n\n**示例:**\n\`\`\`\ndecision_table RiskAssessment {\n  name: "风险评估"\n  table: {\n    inputColumns: ["age", "income"]\n    outputColumns: ["risk_level"]\n    rows: [\n      { age: ">65", income: "<30000", risk_level: "high" }\n      { age: "18-65", income: ">50000", risk_level: "low" }\n    ]\n  }\n}\n\`\`\``
            },
            insertText:
               'decision_table ${1:NodeName} {\n  name: "${2:节点名称}"\n  table: {\n    inputColumns: ["${3:input1}", "${4:input2}"]\n    outputColumns: ["${5:output1}"]\n    rows: [\n      { ${3:input1}: "${6:value1}", ${4:input2}: "${7:value2}", ${5:output1}: "${8:result1}" }\n    ]\n  }\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Struct,
            sortText: '05'
         },
         {
            label: 'subprocess',
            detail: 'Subprocess Node - 子流程节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**子流程节点**\n\n调用其他工作流程的节点，支持嵌套流程。\n\n**示例:**\n\`\`\`\nsubprocess CallSubflow {\n  name: "调用子流程"\n  referencePath: "./subflows/validation.workflow"\n  parameters: {\n    input: "data"\n  }\n}\n\`\`\``
            },
            insertText:
               'subprocess ${1:NodeName} {\n  name: "${2:节点名称}"\n  referencePath: "${3:./path/to/subflow.workflow}"\n  parameters: {\n    ${4:param1}: "${5:value1}"\n  }\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Module,
            sortText: '06'
         },
         {
            label: 'concurrent',
            detail: 'Concurrent Node - 并发节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**并发节点**\n\n支持并行处理的节点，可以同时执行多个分支。\n\n**示例:**\n\`\`\`\nconcurrent ParallelTasks {\n  name: "并行任务"\n  branches: [\n    { name: "task1", process: "ProcessA" }\n    { name: "task2", process: "ProcessB" }\n  ]\n  joinType: "all" // all, any, first\n}\n\`\`\``
            },
            insertText:
               'concurrent ${1:NodeName} {\n  name: "${2:节点名称}"\n  branches: [\n    { name: "${3:task1}", process: "${4:ProcessA}" }\n    { name: "${5:task2}", process: "${6:ProcessB}" }\n  ]\n  joinType: "${7|all,any,first|}"\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Interface,
            sortText: '07'
         },
         {
            label: 'auto',
            detail: 'Auto Node - 自动化节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**自动化节点**\n\n用于自动化对接的节点，支持脚本和API调用。\n\n**示例:**\n\`\`\`\nauto AutomateTask {\n  name: "自动化任务"\n  scriptType: "javascript"\n  script: "return processData(input);"\n  timeout: 30000\n}\n\`\`\``
            },
            insertText:
               'auto ${1:NodeName} {\n  name: "${2:节点名称}"\n  scriptType: "${3|javascript,python,shell|}"\n  script: "${4:// 自动化脚本}"\n  timeout: ${5:30000}\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Function,
            sortText: '08'
         },
         {
            label: 'api',
            detail: 'API Node - API节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**API节点**\n\n用于绑定统一自动化平台单接口实例的节点。\n\n**示例:**\n\`\`\`\napi CallExternalAPI {\n  name: "调用外部API"\n  endpoint: "https://api.example.com/process"\n  method: "POST"\n  headers: {\n    "Content-Type": "application/json"\n    "Authorization": "Bearer {{token}}"\n  }\n  body: {\n    data: "{{input}}"\n  }\n}\n\`\`\``
            },
            insertText:
               'api ${1:NodeName} {\n  name: "${2:节点名称}"\n  endpoint: "${3:https://api.example.com/endpoint}"\n  method: "${4|GET,POST,PUT,DELETE|}"\n  headers: {\n    "Content-Type": "application/json"\n    $5\n  }\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Event,
            sortText: '09'
         },
         {
            label: 'exception',
            detail: 'Exception Node - 异常节点',
            documentation: {
               kind: MarkupKind.Markdown,
               value: `**异常节点**\n\n处理异常情况的特殊结束节点。\n\n**示例:**\n\`\`\`\nexception HandleError {\n  name: "处理错误"\n  expectedValue: "error_handled"\n  errorType: "validation_error"\n  errorMessage: "数据验证失败"\n}\n\`\`\``
            },
            insertText:
               'exception ${1:NodeName} {\n  name: "${2:节点名称}"\n  expectedValue: "${3:error_handled}"\n  errorType: "${4:error_type}"\n  errorMessage: "${5:错误描述}"\n  $0\n}',
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Event,
            sortText: '10'
         }
      ];

      nodeTypes.forEach(nodeType => {
         acceptor(context, {
            ...nodeType,
            textEdit: TextEdit.replace(this.getCompletionRange(context), nodeType.insertText || nodeType.label)
         });
      });
   }

   /**
    * Complete node names with intelligent suggestions
    * 智能补全节点名称
    */
   protected completeNodeName(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const suggestions = [
         {
            label: 'StartProcess',
            detail: '开始处理',
            insertText: 'StartProcess',
            kind: CompletionItemKind.Value
         },
         {
            label: 'ValidateInput',
            detail: '验证输入',
            insertText: 'ValidateInput',
            kind: CompletionItemKind.Value
         },
         {
            label: 'ProcessData',
            detail: '处理数据',
            insertText: 'ProcessData',
            kind: CompletionItemKind.Value
         },
         {
            label: 'CheckCondition',
            detail: '检查条件',
            insertText: 'CheckCondition',
            kind: CompletionItemKind.Value
         },
         {
            label: 'SaveResult',
            detail: '保存结果',
            insertText: 'SaveResult',
            kind: CompletionItemKind.Value
         },
         {
            label: 'EndProcess',
            detail: '结束处理',
            insertText: 'EndProcess',
            kind: CompletionItemKind.Value
         }
      ];

      suggestions.forEach(suggestion => {
         acceptor(context, {
            ...suggestion,
            textEdit: TextEdit.replace(this.getCompletionRange(context), suggestion.insertText)
         });
      });
   }

   /**
    * Complete conditions with common patterns
    * 补全条件表达式
    */
   protected completeCondition(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const conditions = [
         {
            label: 'success',
            detail: '成功条件',
            insertText: '"success"',
            documentation: '表示操作成功的条件'
         },
         {
            label: 'failure',
            detail: '失败条件',
            insertText: '"failure"',
            documentation: '表示操作失败的条件'
         },
         {
            label: 'timeout',
            detail: '超时条件',
            insertText: '"timeout"',
            documentation: '表示操作超时的条件'
         },
         {
            label: 'data.status == "valid"',
            detail: '数据状态验证',
            insertText: 'data.status == "valid"',
            documentation: '检查数据状态是否有效'
         },
         {
            label: 'input.count > 0',
            detail: '数量检查',
            insertText: 'input.count > 0',
            documentation: '检查输入数量是否大于0'
         },
         {
            label: 'user.role == "admin"',
            detail: '权限检查',
            insertText: 'user.role == "admin"',
            documentation: '检查用户是否为管理员'
         }
      ];

      conditions.forEach(condition => {
         acceptor(context, {
            label: condition.label,
            detail: condition.detail,
            documentation: condition.documentation,
            insertText: condition.insertText,
            textEdit: TextEdit.replace(this.getCompletionRange(context), condition.insertText),
            kind: CompletionItemKind.Value,
            sortText: '0'
         });
      });
   }

   /**
    * Complete expected values
    * 补全预期值
    */
   protected completeExpectedValue(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const expectedValues = [
         { label: '"completed"', detail: '已完成' },
         { label: '"success"', detail: '成功' },
         { label: '"processed"', detail: '已处理' },
         { label: '"validated"', detail: '已验证' },
         { label: '"approved"', detail: '已批准' },
         { label: '"rejected"', detail: '已拒绝' },
         { label: '"cancelled"', detail: '已取消' },
         { label: '"error"', detail: '错误' }
      ];

      expectedValues.forEach(value => {
         acceptor(context, {
            label: value.label,
            detail: value.detail,
            insertText: value.label,
            textEdit: TextEdit.replace(this.getCompletionRange(context), value.label),
            kind: CompletionItemKind.Value
         });
      });
   }

   /**
    * Complete test data structures
    * 补全测试数据结构
    */
   protected completeTestData(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const testDataTemplate = `{
  name: "\${1:测试用例名称}"
  input: {
    \${2:param1}: "\${3:value1}"
    \${4:param2}: "\${5:value2}"
  }
  expected: {
    \${6:result}: "\${7:expected_value}"
  }
  edgeBinding: "\${8:output_edge_name}"
}`;

      acceptor(context, {
         label: 'Test Data Template',
         detail: '测试数据模板',
         documentation: {
            kind: MarkupKind.Markdown,
            value: '**测试数据模板**\n\n为节点创建测试数据，包含输入参数、预期结果和边绑定。'
         },
         insertText: testDataTemplate,
         insertTextFormat: InsertTextFormat.Snippet,
         textEdit: TextEdit.replace(this.getCompletionRange(context), testDataTemplate),
         kind: CompletionItemKind.Snippet,
         sortText: '0'
      });
   }

   /**
    * Complete automation actions
    * 补全自动化动作
    */
   protected completeAutomationActions(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const automationTemplates = [
         {
            label: 'API Call Action',
            detail: 'API调用动作',
            insertText: `{
  name: "\${1:API调用}"
  actionType: "api_call"
  configuration: {
    url: "\${2:https://api.example.com/endpoint}"
    method: "\${3|GET,POST,PUT,DELETE|}"
    headers: {
      "Content-Type": "application/json"
    }
    body: {
      \${4:data}: "\${5:value}"
    }
  }
  edgeBinding: "\${6:output_edge_name}"
}`,
            kind: CompletionItemKind.Snippet
         },
         {
            label: 'Script Action',
            detail: '脚本动作',
            insertText: `{
  name: "\${1:脚本执行}"
  actionType: "script"
  configuration: {
    language: "\${2|javascript,python,shell|}"
    script: "\${3:// 脚本内容}"
    timeout: \${4:30000}
  }
  edgeBinding: "\${5:output_edge_name}"
}`,
            kind: CompletionItemKind.Snippet
         },
         {
            label: 'Webhook Action',
            detail: 'Webhook动作',
            insertText: `{
  name: "\${1:Webhook调用}"
  actionType: "webhook"
  configuration: {
    url: "\${2:https://webhook.example.com/notify}"
    method: "POST"
    payload: {
      \${3:event}: "\${4:workflow_completed}"
      \${5:data}: "\${6:{{result}}}"
    }
  }
  edgeBinding: "\${7:output_edge_name}"
}`,
            kind: CompletionItemKind.Snippet
         }
      ];

      automationTemplates.forEach(template => {
         acceptor(context, {
            label: template.label,
            detail: template.detail,
            insertText: template.insertText,
            insertTextFormat: InsertTextFormat.Snippet,
            textEdit: TextEdit.replace(this.getCompletionRange(context), template.insertText),
            kind: template.kind,
            sortText: '0'
         });
      });
   }

   /**
    * Complete decision table structures
    * 补全决策表结构
    */
   protected completeDecisionTable(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const decisionTableTemplate = `{
  inputColumns: ["\${1:condition1}", "\${2:condition2}"]
  outputColumns: ["\${3:result}"]
  decisionColumns: ["\${4:decision}"]
  rows: [
    {
      \${1:condition1}: "\${5:value1}"
      \${2:condition2}: "\${6:value2}"
      \${3:result}: "\${7:output1}"
      \${4:decision}: "\${8:decision1}"
    }
    {
      \${1:condition1}: "\${9:value3}"
      \${2:condition2}: "\${10:value4}"
      \${3:result}: "\${11:output2}"
      \${4:decision}: "\${12:decision2}"
    }
  ]
}`;

      acceptor(context, {
         label: 'Decision Table Template',
         detail: '决策表模板',
         documentation: {
            kind: MarkupKind.Markdown,
            value: '**决策表模板**\n\n创建决策表结构，包含输入列、输出列、决策列和数据行。'
         },
         insertText: decisionTableTemplate,
         insertTextFormat: InsertTextFormat.Snippet,
         textEdit: TextEdit.replace(this.getCompletionRange(context), decisionTableTemplate),
         kind: CompletionItemKind.Struct,
         sortText: '0'
      });
   }

   /**
    * Complete swimlane structures
    * 补全泳道结构
    */
   protected completeSwimlane(context: CompletionContext, acceptor: CompletionAcceptor): void {
      const swimlaneTemplate = `{
  name: "\${1:泳道名称}"
  orientation: "\${2|horizontal,vertical|}"
  nodes: ["\${3:NodeName1}", "\${4:NodeName2}"]
  color: "\${5:#C69A2C}"
  collapsed: \${6|false,true|}
}`;

      acceptor(context, {
         label: 'Swimlane Template',
         detail: '泳道模板',
         documentation: {
            kind: MarkupKind.Markdown,
            value: '**泳道模板**\n\n创建泳道结构，用于组织和管理相关的工作流程节点。'
         },
         insertText: swimlaneTemplate,
         insertTextFormat: InsertTextFormat.Snippet,
         textEdit: TextEdit.replace(this.getCompletionRange(context), swimlaneTemplate),
         kind: CompletionItemKind.Module,
         sortText: '0'
      });
   }

   protected getCompletionRange(context: CompletionContext): Range {
      const text = context.textDocument.getText();
      const existingText = text.substring(context.tokenOffset, context.offset);
      let range: Range = {
         start: context.position,
         end: context.position
      };

      if (existingText.length > 0) {
         const start = context.textDocument.positionAt(context.tokenOffset);
         const end = context.textDocument.positionAt(context.tokenEndOffset);
         range = { start, end };
      }

      return range;
   }

   protected override filterKeyword(context: CompletionContext, keyword: GrammarAST.Keyword): boolean {
      // Show all workflow keywords
      return true;
   }

   protected override createReferenceCompletionItem(description: AstNodeDescription): CompletionValueItem {
      const item = super.createReferenceCompletionItem(description);
      return {
         ...item,
         detail: this.getNodeTypeDetail(description),
         documentation: this.getNodeDocumentation(description)
      };
   }

   protected getNodeTypeDetail(description: AstNodeDescription): string {
      const nodeType = description.type;
      const typeMap: Record<string, string> = {
         BeginNode: '开始节点',
         EndNode: '结束节点',
         ProcessNode: '过程节点',
         DecisionNode: '分支节点',
         DecisionTableNode: '决策表节点',
         SubprocessNode: '子流程节点',
         ConcurrentNode: '并发节点',
         AutoNode: '自动化节点',
         ApiNode: 'API节点',
         ExceptionNode: '异常节点'
      };
      return typeMap[nodeType] || nodeType;
   }

   protected getNodeDocumentation(description: AstNodeDescription): string {
      const nodeType = description.type;
      const docMap: Record<string, string> = {
         BeginNode: '流程的起始点，标记工作流程的开始',
         EndNode: '流程的终点，标记工作流程的正常结束',
         ProcessNode: '执行具体业务逻辑的节点',
         DecisionNode: '根据条件进行分支判断的节点',
         DecisionTableNode: '使用表格形式定义复杂决策逻辑',
         SubprocessNode: '调用其他工作流程的节点',
         ConcurrentNode: '支持并行处理的节点',
         AutoNode: '执行自动化脚本的节点',
         ApiNode: '调用外部API的节点',
         ExceptionNode: '处理异常情况的特殊结束节点'
      };
      return docMap[nodeType] || '工作流程节点';
   }
}
