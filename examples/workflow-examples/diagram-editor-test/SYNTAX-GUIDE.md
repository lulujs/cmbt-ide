# 工作流程语法指南 - 修复版
# Workflow Syntax Guide - Fixed Version

## 🔧 语法修复完成 (Syntax Fix Complete)

**问题**: `Expecting token of type 'DEDENT' but found 'description'`
**原因**: 根据Langium语法定义，节点属性应该使用标准4空格缩进，不是6空格
**解决**: 已修复所有工作流程文件，使用正确的4空格缩进

## 📝 正确的语法格式 (Correct Syntax Format)

### 基本结构 (Basic Structure)
```yaml
workflow:
    id: workflow_id
    name: "工作流程名称"
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
                x: 100
                y: 200
    
    edges:
        - edge:
            id: edge_id
            source: source_node_id
            target: target_node_id
```

### 关键缩进规则 (Key Indentation Rules)

#### ✅ 正确的节点定义 (Correct Node Definition)
```yaml
nodes:
    - begin:        # 4 spaces for list item
        id: start   # 4 spaces for properties (same as list item)
        name: "开始" # 4 spaces for properties
```

#### ❌ 错误的节点定义 (Incorrect Node Definition)
```yaml
nodes:
    - begin:          # 4 spaces
          id: start   # 6 spaces (错误 - 应该是4个空格)
          name: "开始" # 6 spaces (错误 - 应该是4个空格)
```

### 节点类型示例 (Node Type Examples)

#### 开始节点 (Begin Node)
```yaml
- begin:
    id: start_node
    name: "开始"
    description: "流程开始节点"
    position:
        x: 100
        y: 200
```

#### 处理节点 (Process Node)
```yaml
- process:
    id: process_node
    name: "处理步骤"
    description: "处理业务逻辑"
    position:
        x: 300
        y: 200
```

#### 决策节点 (Decision Node)
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
          isDefault: true
```

#### 结束节点 (End Node)
```yaml
- end:
    id: end_node
    name: "结束"
    description: "流程结束节点"
    expectedValue: "success"
    position:
        x: 700
        y: 200
```

### 边定义示例 (Edge Definition Examples)

#### 基本边 (Basic Edge)
```yaml
- edge:
    id: edge_1
    source: start_node
    target: process_node
```

#### 带条件的边 (Conditional Edge)
```yaml
- edge:
    id: edge_2
    source: decision_node
    target: end_node
    value: "yes"
```

## 🚨 常见错误 (Common Errors)

### 1. 缩进错误 (Indentation Errors)
```yaml
# ❌ 错误 - 缩进不一致
- begin:
    id: start    # 应该是6个空格，不是4个
      name: "开始" # 应该是6个空格，不是8个

# ✅ 正确 - 缩进一致
- begin:
      id: start    # 6个空格
      name: "开始"  # 6个空格
```

### 2. 列表项缩进错误 (List Item Indentation Errors)
```yaml
# ❌ 错误 - 列表项缩进不正确
branches:
- id: branch1      # 应该有适当的缩进
  value: "yes"

# ✅ 正确 - 列表项缩进正确
branches:
    - id: branch1  # 正确的缩进
      value: "yes"
```

### 3. 嵌套结构错误 (Nested Structure Errors)
```yaml
# ❌ 错误 - 嵌套结构缩进不正确
position:
x: 100           # 应该有缩进
y: 200           # 应该有缩进

# ✅ 正确 - 嵌套结构缩进正确
position:
    x: 100       # 正确的缩进
    y: 200       # 正确的缩进
```

## 🔍 语法验证 (Syntax Validation)

### 检查清单 (Checklist)
- [ ] 所有节点定义使用4个空格缩进
- [ ] 所有边定义使用4个空格缩进
- [ ] 嵌套属性（如position）使用正确的递增缩进
- [ ] 列表项（如branches, tags）使用正确的缩进
- [ ] 没有混合使用制表符和空格
- [ ] 所有字符串值都用引号包围
- [ ] 根据Langium语法定义验证结构

### 验证工具 (Validation Tools)
1. **IDE语法高亮**: 使用支持YAML的编辑器
2. **在线验证器**: 可以使用YAML验证器检查基本语法
3. **CrossModel解析器**: 最终验证需要通过CrossModel的解析器

## 📋 已修复的文件 (Fixed Files)

### ✅ 修复完成 (Fix Complete)
- `SimpleProcess.workflow.cm` - 基本工作流程
- `SimpleTestWorkflow.workflow.cm` - 简单测试工作流程  
- `TestWorkflow.workflow.cm` - 完整测试工作流程

### 修复内容 (Fix Details)
- 统一使用6个空格缩进节点属性
- 修正嵌套结构的缩进
- 确保列表项的正确缩进
- 保持一致的代码格式

## 🚀 下一步 (Next Steps)

1. **重新构建**: `yarn build:server`
2. **重启环境**: `yarn start:browser`
3. **测试语法**: 打开任何 `.workflow.cm` 文件验证语法正确
4. **测试图形编辑器**: 确认Diagram Editor标签页正常显示

现在所有工作流程文件都应该能够正确解析，不再出现DEDENT错误。