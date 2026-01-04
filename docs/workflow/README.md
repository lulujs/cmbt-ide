# 业务流程建模系统文档

欢迎使用业务流程建模系统！本文档提供了系统的完整使用指南和参考资料。

## 快速导航

### 入门指南

- [快速开始](./Quick-Start.md) - 创建您的第一个工作流程
- [交互式教程](./Tutorial.md) - 通过实践学习系统功能

### 用户文档

- [快速开始](./Quick-Start.md) - 创建您的第一个工作流程
- [交互式教程](./Tutorial.md) - 通过实践学习系统功能
- [DSL 语法参考](./DSL-Reference.md) - 完整的 DSL 语法说明
- [节点类型使用指南](./Node-Types-Guide.md) - 各种节点类型的详细说明
- [工作流程图例说明](./Diagram-Legend.md) - 图形符号和颜色含义
- [最佳实践和设计模式](./Best-Practices.md) - 流程设计的最佳实践

### 开发者文档

- [架构设计和扩展指南](./Architecture-Guide.md) - 系统架构和扩展方法
- [API 参考文档](./API-Reference.md) - 完整的 API 参考
- [开发环境设置](./Development-Setup.md) - 开发环境配置指南

## 示例项目

系统提供了多个示例项目，帮助您快速了解各种功能：

| 示例             | 说明                 | 位置                                                  |
| ---------------- | -------------------- | ----------------------------------------------------- |
| 基础工作流程     | 最简单的工作流程示例 | `examples/workflow-examples/basic-workflow/`          |
| 审批工作流程     | 带分支决策的审批流程 | `examples/workflow-examples/approval-workflow/`       |
| 决策表工作流程   | 使用决策表的复杂决策 | `examples/workflow-examples/decision-table-workflow/` |
| 并行工作流程     | 并行处理示例         | `examples/workflow-examples/parallel-workflow/`       |
| 错误处理工作流程 | 异常处理和重试       | `examples/workflow-examples/error-handling-workflow/` |
| 子流程工作流程   | 模块化流程设计       | `examples/workflow-examples/subprocess-workflow/`     |

## 项目模板

使用项目模板快速开始新项目：

| 模板     | 说明             | 位置                                             |
| -------- | ---------------- | ------------------------------------------------ |
| 基础模板 | 最简单的项目结构 | `examples/workflow-templates/basic-template/`    |
| 审批模板 | 多级审批流程模板 | `examples/workflow-templates/approval-template/` |

## 功能概览

### 支持的节点类型

- **开始节点** (begin) - 流程入口
- **结束节点** (end) - 流程正常终止
- **异常节点** (exception) - 流程异常终止
- **过程节点** (process) - 业务处理步骤
- **分支节点** (decision) - 条件分支
- **决策表节点** (decision_table) - 复杂决策逻辑
- **子流程节点** (subprocess) - 嵌套子流程
- **并发节点** (concurrent) - 并行处理
- **Auto 节点** (auto) - 自动化任务
- **API 节点** (api) - API 调用

### 三种建模方式

1. **文本建模** - 使用 DSL 语言直接编写
2. **图形建模** - 可视化拖拽编辑
3. **表单建模** - 结构化表单编辑

### 高级功能

- 泳道管理
- 节点引用
- 测试数据配置
- 自动化动作
- 实时验证
- 跨建模方式同步

## 获取帮助

- 查看 [常见问题](./FAQ.md)
- 提交 [GitHub Issue](https://github.com/your-org/crossmodel/issues)
- 阅读 [贡献指南](../../CONTRIBUTING.md)

## 版本信息

- 当前版本：1.0.0
- 最后更新：2024-01

## 相关链接

- [项目主页](../../README.md)
- [架构概述](../Architecture.md)
- [变更日志](../../CHANGELOG.md)
