/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 * Workflow Hover Provider - 工作流程悬停帮助
 * 需求 7.1-7.10, 8.1-8.3: 上下文相关的帮助和文档
 ********************************************************************************/

import { AstNode, MaybePromise } from 'langium';
import { AstNodeHoverProvider, LangiumServices } from 'langium/lsp';
import { Hover, MarkupKind } from 'vscode-languageserver-protocol';

/**
 * Workflow-specific hover provider with contextual help
 * 工作流程专用的悬停帮助提供器
 */
export class WorkflowHoverProvider extends AstNodeHoverProvider {
   constructor(services: LangiumServices) {
      super(services);
   }

   protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
      const nodeType = node.$type;

      // Get hover content based on node type
      const hoverContent = this.getWorkflowNodeHoverContent(nodeType, node);

      if (hoverContent) {
         return {
            contents: {
               kind: MarkupKind.Markdown,
               value: hoverContent
            }
         };
      }

      return undefined;
   }

   protected getWorkflowNodeHoverContent(nodeType: string, node: AstNode): string | undefined {
      switch (nodeType) {
         case 'BeginNode':
            return this.getBeginNodeHelp(node);
         case 'EndNode':
            return this.getEndNodeHelp(node);
         case 'ProcessNode':
            return this.getProcessNodeHelp(node);
         case 'DecisionNode':
            return this.getDecisionNodeHelp(node);
         case 'DecisionTableNode':
            return this.getDecisionTableNodeHelp(node);
         case 'SubprocessNode':
            return this.getSubprocessNodeHelp(node);
         case 'ConcurrentNode':
            return this.getConcurrentNodeHelp(node);
         case 'AutoNode':
            return this.getAutoNodeHelp(node);
         case 'ApiNode':
            return this.getApiNodeHelp(node);
         case 'ExceptionNode':
            return this.getExceptionNodeHelp(node);
         case 'Swimlane':
            return this.getSwimlaneHelp(node);
         case 'TestData':
            return this.getTestDataHelp(node);
         case 'AutomationAction':
            return this.getAutomationActionHelp(node);
         case 'WorkflowEdge':
            return this.getEdgeHelp(node);
         default:
            return this.getGenericWorkflowHelp(nodeType);
      }
   }

   protected getBeginNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      return `## 🚀 开始节点: ${name}

**功能说明:**
- 工作流程的起始点
- 没有输入边，通常有一个输出边
- 不需要预期值

**最佳实践:**
- 每个工作流程只能有一个开始节点
- 建议添加描述性的名称
- 可以配置测试数据用于流程测试

**示例配置:**
\`\`\`
begin StartProcess {
  name: "开始处理订单"
  testData: {
    input: { orderId: "12345" }
    expected: "started"
  }
}
\`\`\`

**相关文档:** [开始节点详细说明](docs/nodes/begin-node.md)`;
   }

   protected getEndNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const expectedValue = this.getNodeProperty(node, 'expectedValue');

      return `## 🏁 结束节点: ${name}

**功能说明:**
- 工作流程的终点
- 有输入边但没有输出边
- 必须指定预期值: \`${expectedValue || '未设置'}\`

**配置要求:**
- ✅ 必须设置 \`expectedValue\` 属性
- ✅ 至少有一条输入边
- ❌ 不能有输出边

**常用预期值:**
- \`"completed"\` - 正常完成
- \`"success"\` - 成功结束
- \`"processed"\` - 处理完成
- \`"approved"\` - 已批准

**示例配置:**
\`\`\`
end FinishProcess {
  name: "完成订单处理"
  expectedValue: "order_completed"
}
\`\`\`

**相关文档:** [结束节点详细说明](docs/nodes/end-node.md)`;
   }

   protected getProcessNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const description = this.getNodeProperty(node, 'description');

      return `## ⚙️ 过程节点: ${name}

**功能说明:**
- 执行具体的业务逻辑
- 只能有一条输出边
- 适用于数据处理、验证、计算等操作

${description ? `**节点描述:** ${description}` : ''}

**连接规则:**
- ✅ 可以有多条输入边
- ⚠️ 只能有一条输出边
- ✅ 可以配置测试数据和自动化动作

**配置选项:**
- \`name\`: 节点显示名称
- \`description\`: 节点功能描述
- \`testData\`: 测试数据配置
- \`automationActions\`: 自动化动作配置

**示例配置:**
\`\`\`
process ValidateOrder {
  name: "验证订单信息"
  description: "检查订单数据的完整性和有效性"
  testData: {
    input: { order: {...} }
    expected: { valid: true }
  }
}
\`\`\`

**相关文档:** [过程节点详细说明](docs/nodes/process-node.md)`;
   }

   protected getDecisionNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';

      return `## 🔀 分支节点: ${name}

**功能说明:**
- 根据条件进行分支判断
- 默认有两条输出边
- 支持多条件分支

**分支配置:**
- 每个分支需要指定条件表达式
- 条件可以是简单的字符串或复杂的表达式
- 所有输出边的条件值必须唯一

**常用条件模式:**
- \`"success"\` / \`"failure"\` - 成功/失败分支
- \`"approved"\` / \`"rejected"\` - 批准/拒绝分支
- \`"valid"\` / \`"invalid"\` - 有效/无效分支
- 表达式: \`data.status == "active"\`

**示例配置:**
\`\`\`
decision CheckOrderStatus {
  name: "检查订单状态"
  branches: {
    "valid": "订单有效，继续处理"
    "invalid": "订单无效，返回错误"
    "pending": "订单待审核"
  }
}
\`\`\`

**验证规则:**
- ⚠️ 所有输出边的值必须不同
- ✅ 至少需要两条输出边
- ✅ 可以添加默认分支

**相关文档:** [分支节点详细说明](docs/nodes/decision-node.md)`;
   }

   protected getDecisionTableNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';

      return `## 📊 决策表节点: ${name}

**功能说明:**
- 使用表格形式定义复杂的决策逻辑
- 支持多输入条件和多输出结果
- 类似Excel表格的编辑体验

**表格结构:**
- **输入列 (inputColumns)**: 决策的输入条件
- **输出列 (outputColumns)**: 决策的输出结果
- **决策列 (decisionColumns)**: 决策的具体内容
- **数据行 (rows)**: 具体的决策规则

**验证规则:**
- ✅ 必须有至少一个输入列和一个输出列
- ⚠️ 决策列内容不能完全相同
- ✅ 根据输出字段值自动创建输出边

**示例配置:**
\`\`\`
decision_table RiskAssessment {
  name: "风险评估"
  table: {
    inputColumns: ["age", "income", "credit_score"]
    outputColumns: ["risk_level", "approval"]
    decisionColumns: ["reason"]
    rows: [
      {
        age: ">65", income: "<30000", credit_score: "<600",
        risk_level: "high", approval: "rejected",
        reason: "高风险客户"
      },
      {
        age: "25-65", income: ">50000", credit_score: ">700",
        risk_level: "low", approval: "approved",
        reason: "优质客户"
      }
    ]
  }
}
\`\`\`

**编辑功能:**
- 📝 在线表格编辑器
- 📂 支持CSV/Excel导入
- 🔍 实时验证和错误提示

**相关文档:** [决策表详细说明](docs/nodes/decision-table-node.md)`;
   }

   protected getSubprocessNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const referencePath = this.getNodeProperty(node, 'referencePath');

      return `## 📋 子流程节点: ${name}

**功能说明:**
- 调用其他工作流程文件
- 支持嵌套流程结构
- 可以传递参数和接收返回值

${referencePath ? `**引用路径:** \`${referencePath}\`` : '**⚠️ 未设置引用路径**'}

**配置要求:**
- ✅ 必须指定 \`referencePath\` 属性
- ✅ 引用的工作流程文件必须存在
- ✅ 可以配置输入参数

**路径格式:**
- 相对路径: \`"./subflows/validation.workflow"\`
- 绝对路径: \`"/workflows/common/validation.workflow"\`
- 包引用: \`"@company/workflows/validation"\`

**参数传递:**
\`\`\`
subprocess CallValidation {
  name: "调用验证子流程"
  referencePath: "./validation.workflow"
  parameters: {
    input: "{{orderData}}"
    mode: "strict"
  }
  outputMapping: {
    result: "validationResult"
  }
}
\`\`\`

**最佳实践:**
- 🔄 避免循环引用
- 📁 使用相对路径便于移植
- 📝 为子流程添加清晰的文档
- ⚡ 考虑性能影响

**相关文档:** [子流程详细说明](docs/nodes/subprocess-node.md)`;
   }

   protected getConcurrentNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';

      return `## 🔀 并发节点: ${name}

**功能说明:**
- 支持并行处理多个分支
- 无顺序要求的业务逻辑
- 可配置汇聚策略

**并发类型:**
- **分支并发**: 同时执行多个独立分支
- **数据并发**: 对数据集合进行并行处理
- **任务并发**: 并行执行多个任务

**汇聚策略:**
- \`all\`: 等待所有分支完成
- \`any\`: 任意分支完成即可
- \`first\`: 第一个完成的分支
- \`majority\`: 大多数分支完成

**验证规则:**
- ✅ 内部节点必须从并发开始流向并发结束
- ❌ 不能包含环路
- ❌ 不能包含开始或结束节点

**示例配置:**
\`\`\`
concurrent ParallelProcessing {
  name: "并行数据处理"
  branches: [
    { name: "处理订单", process: "ProcessOrder" },
    { name: "发送通知", process: "SendNotification" },
    { name: "更新库存", process: "UpdateInventory" }
  ]
  joinType: "all"
  timeout: 300000
}
\`\`\`

**性能考虑:**
- ⚡ 合理控制并发数量
- 🔒 注意资源竞争
- ⏱️ 设置合理的超时时间

**相关文档:** [并发节点详细说明](docs/nodes/concurrent-node.md)`;
   }

   protected getAutoNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const scriptType = this.getNodeProperty(node, 'scriptType');

      return `## 🤖 自动化节点: ${name}

**功能说明:**
- 执行自动化脚本和任务
- 支持多种脚本语言
- 用于系统集成和自动化对接

${scriptType ? `**脚本类型:** \`${scriptType}\`` : ''}

**支持的脚本类型:**
- \`javascript\`: JavaScript脚本
- \`python\`: Python脚本
- \`shell\`: Shell脚本
- \`powershell\`: PowerShell脚本

**配置选项:**
- \`scriptType\`: 脚本语言类型
- \`script\`: 脚本内容
- \`timeout\`: 执行超时时间(毫秒)
- \`environment\`: 环境变量
- \`workingDirectory\`: 工作目录

**示例配置:**
\`\`\`
auto DataProcessing {
  name: "数据处理脚本"
  scriptType: "javascript"
  script: '''
    const result = processData(input.data);
    return {
      processed: true,
      result: result,
      timestamp: new Date().toISOString()
    };
  '''
  timeout: 30000
  environment: {
    NODE_ENV: "production"
  }
}
\`\`\`

**安全注意事项:**
- 🔒 避免执行不可信的脚本
- 🛡️ 限制文件系统访问权限
- ⏱️ 设置合理的超时时间
- 📝 记录执行日志

**调试技巧:**
- 使用 \`console.log\` 输出调试信息
- 检查返回值格式
- 验证环境变量设置

**相关文档:** [自动化节点详细说明](docs/nodes/auto-node.md)`;
   }

   protected getApiNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const endpoint = this.getNodeProperty(node, 'endpoint');
      const method = this.getNodeProperty(node, 'method');

      return `## 🌐 API节点: ${name}

**功能说明:**
- 调用外部API接口
- 绑定统一自动化平台单接口实例
- 支持RESTful API调用

${endpoint ? `**接口地址:** \`${endpoint}\`` : '**⚠️ 未设置接口地址**'}
${method ? `**请求方法:** \`${method}\`` : ''}

**支持的HTTP方法:**
- \`GET\`: 获取数据
- \`POST\`: 创建资源
- \`PUT\`: 更新资源
- \`DELETE\`: 删除资源
- \`PATCH\`: 部分更新

**配置选项:**
- \`endpoint\`: API接口地址
- \`method\`: HTTP请求方法
- \`headers\`: 请求头
- \`body\`: 请求体(POST/PUT)
- \`timeout\`: 请求超时时间
- \`retries\`: 重试次数

**示例配置:**
\`\`\`
api CallUserService {
  name: "调用用户服务"
  endpoint: "https://api.example.com/users"
  method: "POST"
  headers: {
    "Content-Type": "application/json"
    "Authorization": "Bearer {{token}}"
    "X-Request-ID": "{{requestId}}"
  }
  body: {
    name: "{{userName}}"
    email: "{{userEmail}}"
  }
  timeout: 10000
  retries: 3
}
\`\`\`

**变量替换:**
- 使用 \`{{variableName}}\` 语法
- 支持从上下文获取变量值
- 支持嵌套对象属性访问

**错误处理:**
- 自动重试机制
- HTTP状态码检查
- 响应数据验证
- 超时处理

**相关文档:** [API节点详细说明](docs/nodes/api-node.md)`;
   }

   protected getExceptionNodeHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';
      const errorType = this.getNodeProperty(node, 'errorType');

      return `## ⚠️ 异常节点: ${name}

**功能说明:**
- 处理异常情况的特殊结束节点
- 标记流程的异常终止
- 记录错误信息和类型

${errorType ? `**错误类型:** \`${errorType}\`` : ''}

**配置要求:**
- ✅ 必须设置 \`expectedValue\` 属性
- ✅ 建议设置 \`errorType\` 和 \`errorMessage\`
- ✅ 可以配置错误处理动作

**常用错误类型:**
- \`validation_error\`: 数据验证错误
- \`business_error\`: 业务逻辑错误
- \`system_error\`: 系统错误
- \`timeout_error\`: 超时错误
- \`permission_error\`: 权限错误

**示例配置:**
\`\`\`
exception HandleValidationError {
  name: "处理验证错误"
  expectedValue: "validation_failed"
  errorType: "validation_error"
  errorMessage: "输入数据验证失败"
  errorCode: "E001"
  automationActions: {
    name: "发送错误通知"
    actionType: "webhook"
    configuration: {
      url: "https://api.example.com/notify-error"
      payload: {
        error: "{{errorMessage}}"
        code: "{{errorCode}}"
      }
    }
  }
}
\`\`\`

**最佳实践:**
- 📝 提供清晰的错误描述
- 🏷️ 使用标准化的错误代码
- 📊 记录错误统计信息
- 🔔 配置错误通知机制

**相关文档:** [异常节点详细说明](docs/nodes/exception-node.md)`;
   }

   protected getSwimlaneHelp(node: AstNode): string {
      const name = this.getNodeProperty(node, 'name') || 'Unnamed';

      return `## 🏊 泳道: ${name}

**功能说明:**
- 将相关节点进行分组管理
- 提供可视化的组织结构
- 支持折叠和展开

**泳道特性:**
- 📦 容器功能：包含多个节点
- 🎨 可视化：不同颜色和样式
- 📱 响应式：支持水平和垂直布局
- 🔄 交互式：拖拽节点到泳道

**配置选项:**
- \`name\`: 泳道名称
- \`orientation\`: 方向(horizontal/vertical)
- \`nodes\`: 包含的节点列表
- \`color\`: 泳道颜色
- \`collapsed\`: 是否折叠

**操作功能:**
- ➕ 添加节点到泳道
- ➖ 从泳道移除节点
- 🚚 移动整个泳道
- 🗑️ 删除泳道(可选择保留节点)

**示例配置:**
\`\`\`
swimlane UserProcessing {
  name: "用户处理流程"
  orientation: "horizontal"
  nodes: ["ValidateUser", "ProcessUser", "NotifyUser"]
  color: "#4A90E2"
  collapsed: false
}
\`\`\`

**使用场景:**
- 👥 按角色分组(用户、管理员、系统)
- 🏢 按部门分组(销售、财务、IT)
- ⚡ 按阶段分组(准备、执行、完成)

**相关文档:** [泳道详细说明](docs/swimlanes.md)`;
   }

   protected getTestDataHelp(node: AstNode): string {
      return `## 🧪 测试数据

**功能说明:**
- 为节点配置测试用例
- 支持单元测试和集成测试
- 绑定到特定的输出边

**数据结构:**
- \`name\`: 测试用例名称
- \`input\`: 输入数据
- \`expected\`: 预期输出
- \`edgeBinding\`: 绑定的输出边

**示例配置:**
\`\`\`
testData: [
  {
    name: "正常流程测试"
    input: {
      userId: "12345"
      action: "process"
    }
    expected: {
      status: "success"
      result: "processed"
    }
    edgeBinding: "success_edge"
  },
  {
    name: "异常流程测试"
    input: {
      userId: "invalid"
      action: "process"
    }
    expected: {
      status: "error"
      errorCode: "INVALID_USER"
    }
    edgeBinding: "error_edge"
  }
]
\`\`\`

**测试执行:**
- 🚀 自动化测试运行
- 📊 测试结果报告
- 🔍 失败用例分析

**相关文档:** [测试数据详细说明](docs/testing/test-data.md)`;
   }

   protected getAutomationActionHelp(node: AstNode): string {
      return `## 🔧 自动化动作

**功能说明:**
- 为节点配置自动化执行动作
- 支持API调用、脚本执行、Webhook等
- 绑定到特定的输出边

**动作类型:**
- \`api_call\`: API接口调用
- \`script\`: 脚本执行
- \`webhook\`: Webhook通知
- \`email\`: 邮件发送
- \`database\`: 数据库操作

**配置结构:**
\`\`\`
automationActions: [
  {
    name: "发送通知"
    actionType: "api_call"
    configuration: {
      url: "https://api.example.com/notify"
      method: "POST"
      headers: {
        "Authorization": "Bearer {{token}}"
      }
      body: {
        message: "流程已完成"
        data: "{{result}}"
      }
    }
    edgeBinding: "success_edge"
  }
]
\`\`\`

**执行时机:**
- 节点执行完成后
- 根据输出边条件触发
- 支持异步执行

**相关文档:** [自动化动作详细说明](docs/automation/actions.md)`;
   }

   protected getEdgeHelp(node: AstNode): string {
      return `## 🔗 工作流程边

**功能说明:**
- 连接工作流程节点
- 定义流程的执行顺序
- 支持条件判断

**边的类型:**
- **顺序流**: 普通的流程连接
- **条件流**: 带条件判断的连接
- **数据流**: 传递数据的连接
- **异常流**: 异常处理连接

**配置选项:**
- \`condition\`: 边的触发条件
- \`dataType\`: 传递的数据类型
- \`label\`: 边的显示标签

**示例配置:**
\`\`\`
flow ValidateData -> ProcessData {
  condition: "data.valid == true"
  dataType: "OrderData"
  label: "数据有效"
}

flow ValidateData -> HandleError {
  condition: "data.valid == false"
  dataType: "ErrorInfo"
  label: "数据无效"
}
\`\`\`

**相关文档:** [工作流程边详细说明](docs/edges.md)`;
   }

   protected getGenericWorkflowHelp(nodeType: string): string {
      return `## 📋 工作流程元素: ${nodeType}

**这是一个工作流程元素。**

工作流程建模支持多种节点类型和配置选项。

**获取帮助:**
- 查看完整文档: [工作流程建模指南](docs/workflow-modeling.md)
- 节点类型参考: [节点类型说明](docs/node-types.md)
- 最佳实践: [设计最佳实践](docs/best-practices.md)

**快速开始:**
1. 创建开始节点 (\`begin\`)
2. 添加处理节点 (\`process\`)
3. 添加结束节点 (\`end\`)
4. 使用边连接节点 (\`flow\`)`;
   }

   protected getNodeProperty(node: AstNode, property: string): string | undefined {
      return (node as any)[property];
   }
}
