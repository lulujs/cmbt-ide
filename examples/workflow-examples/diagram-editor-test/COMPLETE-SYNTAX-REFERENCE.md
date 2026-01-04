# 🎯 完整语法参考 - Complete Syntax Reference

## ✅ 最新修复 (Latest Fix)

**错误**: `Expecting: one of these possible Token sequences: 1. [api_call] 2. [script] 3. [webhook] but found: '"script"'`
**问题**: `actionType` 字段期望枚举值，不是字符串
**解决**: 使用 `script` 而不是 `"script"`

## 📝 完整语法规则 (Complete Syntax Rules)

### 1. 基本数据类型 (Basic Data Types)

#### 字符串 (Strings)
```yaml
name: "带引号的字符串"
description: "另一个字符串"
```

#### 数字 (Numbers)
```yaml
x: 100          # 整数
y: 200.5        # 小数
version: 1.0.0  # 版本号
```

#### 布尔值 (Booleans)
```yaml
isDefault: true    # 小写 true
isEnabled: TRUE    # 大写 TRUE (两种都可以)
```

#### 枚举值 (Enum Values)
```yaml
actionType: script     # 不带引号的枚举值
actionType: api_call   # 不带引号的枚举值
actionType: webhook    # 不带引号的枚举值
```

### 2. 节点类型语法 (Node Type Syntax)

#### Begin Node (开始节点)
```yaml
- begin:
    id: start_node
    name: "开始"
    description: "流程开始节点"
    position:
        x: 100
        y: 200
```

#### Process Node (处理节点)
```yaml
- process:
    id: process_node
    name: "处理步骤"
    description: "处理业务逻辑"
    position:
        x: 300
        y: 200
```

#### Decision Node (决策节点)
```yaml
- decision:
    id: decision_node
    name: "决策点"
    description: "根据条件选择路径"
    position:
        x: 500
        y: 200
    branches:
        - id: branch1
          value: "yes"
        - id: branch2
          value: "no"
          isDefault: true    # 注意：不带引号的 true
```

#### Concurrent Node (并发节点)
```yaml
- concurrent:
    id: parallel_node
    name: "并行处理"
    description: "并行执行多个任务"
    position:
        x: 700
        y: 200
```

#### Auto Node (自动化节点)
```yaml
- auto:
    id: auto_node
    name: "自动化任务"
    description: "自动执行的任务"
    position:
        x: 900
        y: 200
    automationActions:
        - id: action1
          name: "执行脚本"
          actionType: script        # 注意：不带引号的枚举值
          configuration:
              - key: "script_path"
                value: "run_task.py"
              - key: "timeout"
                value: "300"
```

#### API Node (API节点)
```yaml
- api:
    id: api_node
    name: "API调用"
    description: "调用外部API"
    position:
        x: 1100
        y: 200
    apiEndpoint: "https://api.example.com/process"
    apiConfig:
        - key: "method"
          value: "POST"
        - key: "timeout"
          value: "30"
```

#### End Node (结束节点)
```yaml
- end:
    id: end_node
    name: "结束"
    description: "流程结束节点"
    expectedValue: "success"
    position:
        x: 1300
        y: 200
```

#### Exception Node (异常节点)
```yaml
- exception:
    id: error_node
    name: "异常结束"
    description: "流程异常终止"
    expectedValue: "error"
    position:
        x: 1300
        y: 400
```

### 3. 边语法 (Edge Syntax)

#### 基本边 (Basic Edge)
```yaml
- edge:
    id: edge_1
    source: start_node
    target: process_node
```

#### 带值的边 (Edge with Value)
```yaml
- edge:
    id: edge_2
    source: decision_node
    target: end_node
    value: "success"
```

#### 带条件的边 (Edge with Condition)
```yaml
- edge:
    id: edge_3
    source: decision_node
    target: error_node
    value: "failure"
    condition: "result == false"
```

### 4. 高级功能 (Advanced Features)

#### 测试数据 (Test Data)
```yaml
testData:
    - id: test1
      name: "正常测试"
      inputData:
          - key: "input1"
            value: "test_value"
      expectedOutput:
          - key: "output1"
            value: "expected_result"
```

#### 泳道 (Swimlanes)
```yaml
swimlanes:
    - swimlane:
        id: lane1
        name: "用户操作"
        position:
            x: 50
            y: 200
        width: 400
        height: 150
        color: "#E3F2FD"
        containedNodes:
            - ref: start_node
            - ref: process_node
```

### 5. 常见错误和修复 (Common Errors and Fixes)

#### ❌ 错误的枚举值语法
```yaml
actionType: "script"    # 错误：带引号
```

#### ✅ 正确的枚举值语法
```yaml
actionType: script      # 正确：不带引号
```

#### ❌ 错误的布尔值语法
```yaml
isDefault: "true"       # 错误：带引号
```

#### ✅ 正确的布尔值语法
```yaml
isDefault: true         # 正确：不带引号
```

#### ❌ 错误的缩进
```yaml
nodes:
    - begin:
          id: start     # 错误：过度缩进
```

#### ✅ 正确的缩进
```yaml
nodes:
    - begin:
        id: start       # 正确：4空格缩进
```

### 6. 枚举值完整列表 (Complete Enum Values)

#### ActionType 枚举
- `script` - 脚本执行
- `api_call` - API调用
- `webhook` - Webhook调用

#### 布尔值
- `true` 或 `TRUE` - 真值
- `false` 或 `FALSE` - 假值

### 7. 验证清单 (Validation Checklist)

- [ ] 所有字符串值使用双引号
- [ ] 枚举值不使用引号
- [ ] 布尔值不使用引号
- [ ] 缩进使用4个空格的倍数
- [ ] 列表项使用 `- ` (破折号+空格)
- [ ] 所有必需字段都已填写
- [ ] ID值在同一类型中唯一
- [ ] 引用的节点ID存在

## 🎯 完整工作示例 (Complete Working Example)

参考文件:
- `examples/workflow-examples/basic-workflow/workflows/SimpleProcess.workflow.cm` - 简单示例
- `examples/workflow-examples/approval-workflow/workflows/LeaveApproval.workflow.cm` - 复杂示例
- `examples/workflow-examples/diagram-editor-test/TestWorkflow.workflow.cm` - 测试示例

---

**🎉 现在所有语法规则都已明确！按照这个参考创建的工作流程文件应该能正确解析。**