# 🔧 工作流程语法修复说明
# 🔧 Workflow Syntax Fix Documentation

## 问题描述 (Problem Description)

用户报告访问 `TestWorkflow.workflow.cm` 时出现语法错误：
```
unexpected character: ->{<- at offset: 1137, skipped 1 characters.
```

## 根本原因 (Root Cause)

原始测试文件使用了不符合 Langium 语法定义的格式，主要问题包括：

1. **错误的对象语法**: 使用了 `{ key: value }` 格式，但 Langium 语法要求使用 YAML 风格的缩进语法
2. **不支持的字段**: 包含了语法中未定义的字段（如 `errorType`, `errorMessage`, `label`）
3. **复杂的嵌套结构**: 测试数据使用了过于复杂的嵌套对象

## 修复方案 (Fix Solution)

### 1. 创建简化版本
创建了 `SimpleTestWorkflow.workflow.cm` 文件，使用最基本的语法结构：

```yaml
workflow:
    id: simple_test
    name: "简单测试流程"
    description: "最基本的测试工作流程"
    nodes:
        - begin:
            id: start
            name: "开始"
            position:
                x: 100
                y: 200
        - process:
            id: process_step
            name: "处理步骤"
            position:
                x: 300
                y: 200
        - end:
            id: finish
            name: "结束"
            expectedValue: "completed"
            position:
                x: 500
                y: 200
    edges:
        - edge:
            id: start_to_process
            source: start
            target: process_step
        - edge:
            id: process_to_end
            source: process_step
            target: finish
```

### 2. 修复原始文件
更新了 `TestWorkflow.workflow.cm` 文件，移除了不支持的语法：

**移除的内容**:
- 复杂的 `testData` 对象语法
- 不支持的字段：`errorType`, `errorMessage`, `label`
- 嵌套的对象字面量语法

**保留的内容**:
- 基本的节点定义
- 位置信息
- 边连接
- 基本属性

## 语法规则总结 (Syntax Rules Summary)

根据 Langium 语法定义，工作流程文件必须遵循以下规则：

### 基本结构 (Basic Structure)
```yaml
workflow:
    id: workflow_id
    name: "工作流程名称"
    description: "描述"
    metadata:
        version: "1.0.0"
        author: "作者"
        tags:
            - "标签1"
            - "标签2"
    nodes:
        - node_type:
            id: node_id
            name: "节点名称"
            description: "节点描述"
            position:
                x: 数字
                y: 数字
    edges:
        - edge:
            id: edge_id
            source: source_node_id
            target: target_node_id
            condition: "条件"
```

### 支持的节点类型 (Supported Node Types)
- `begin`: 开始节点
- `end`: 结束节点（需要 `expectedValue`）
- `exception`: 异常节点（需要 `expectedValue`）
- `process`: 处理节点
- `decision`: 分支节点
- `decision_table`: 决策表节点
- `subprocess`: 子流程节点
- `concurrent`: 并发节点
- `auto`: 自动化节点
- `api`: API节点

### 必需字段 (Required Fields)
- 所有节点必须有 `id`
- 结束节点和异常节点必须有 `expectedValue`
- 边必须有 `source` 和 `target`

### 不支持的语法 (Unsupported Syntax)
- ❌ 对象字面量：`{ key: value }`
- ❌ 数组字面量：`[item1, item2]`
- ❌ 复杂的嵌套对象
- ❌ 未定义的字段名

## 测试建议 (Testing Recommendations)

### 优先级测试顺序 (Priority Testing Order)
1. **首先测试**: `SimpleTestWorkflow.workflow.cm` - 最基本的语法
2. **然后测试**: `examples/workflow-examples/basic-workflow/workflows/SimpleProcess.workflow.cm` - 已验证的语法
3. **最后测试**: `TestWorkflow.workflow.cm` - 修复后的复杂示例

### 验证步骤 (Verification Steps)
1. 打开文件，确保没有语法错误
2. 检查是否显示三个标签页
3. 点击 Diagram Editor 标签页
4. 验证节点和边是否正确显示

## 语法验证工具 (Syntax Validation Tools)

如果需要验证语法，可以：
1. 在 Code Editor 中查看是否有红色错误标记
2. 检查浏览器控制台是否有解析错误
3. 确保文件能够在 Form Editor 中正确显示

## 未来改进 (Future Improvements)

1. **语法文档**: 创建完整的语法参考文档
2. **示例库**: 提供更多符合语法的示例文件
3. **验证工具**: 开发语法验证和错误提示工具
4. **IDE支持**: 改进语法高亮和自动完成功能

---

**修复完成**: ✅  
**测试文件**: `SimpleTestWorkflow.workflow.cm`, `TestWorkflow.workflow.cm`  
**状态**: 可以进行图形编辑器测试