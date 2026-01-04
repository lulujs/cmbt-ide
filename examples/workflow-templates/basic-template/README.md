# 基础工作流程模板

这是一个基础的工作流程项目模板，包含最简单的工作流程结构。

## 使用方法

1. 复制此目录到您的项目位置
2. 修改 `datamodel.cm` 中的项目信息
3. 根据需要修改或添加工作流程文件

## 项目结构

```
basic-template/
├── datamodel.cm              # 数据模型定义
├── workflows/                # 工作流程目录
│   └── MainWorkflow.workflow.cm  # 主工作流程
└── README.md                 # 项目说明
```

## 自定义

### 修改项目信息

编辑 `datamodel.cm` 文件：

```yaml
datamodel:
    id: your_project_id
    name: "您的项目名称"
    type: logical
    version: 1.0.0
    description: "您的项目描述"
```

### 添加新工作流程

在 `workflows/` 目录下创建新的 `.workflow.cm` 文件。

## 相关文档

- [快速开始指南](../../../docs/workflow/Quick-Start.md)
- [DSL 语法参考](../../../docs/workflow/DSL-Reference.md)
- [节点类型使用指南](../../../docs/workflow/Node-Types-Guide.md)
