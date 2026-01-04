# GLSP 工作流程渲染示例

这个示例展示了如何使用 GLSP (Graphical Language Server Protocol) 渲染工作流程图形，包含完整的节点视图、边连接和交互功能。

## 目录结构

```
glsp-rendering-example/
├── README.md                     # 本文档
├── glsp-configuration.ts         # GLSP 配置
├── diagrams/                     # 图形渲染配置
│   ├── node-views/              # 节点视图定义
│   │   ├── begin-node-view.ts   # 开始节点视图
│   │   ├── end-node-view.ts     # 结束节点视图
│   │   ├── process-node-view.ts # 处理节点视图
│   │   ├── decision-node-view.ts # 决策节点视图
│   │   ├── decision-table-view.ts # 决策表节点视图
│   │   ├── concurrent-node-view.ts # 并行节点视图
│   │   └── exception-node-view.ts # 异常节点视图
│   ├── edge-views/              # 边视图定义
│   │   ├── workflow-edge-view.ts # 工作流程边视图
│   │   └── conditional-edge-view.ts # 条件边视图
│   ├── decorators/              # 装饰器
│   │   ├── node-decorators.ts   # 节点装饰器
│   │   └── validation-decorators.ts # 验证装饰器
│   └── themes/                  # 主题配置
│       ├── default-theme.css    # 默认主题
│       └── dark-theme.css       # 暗色主题
├── model/                       # 模型定义
│   ├── workflow-gmodel.ts       # 工作流程图形模型
│   └── workflow-model-factory.ts # 模型工厂
└── interactions/                # 交互功能
    ├── node-creation-tool.ts    # 节点创建工具
    ├── edge-creation-tool.ts    # 边创建工具
    └── selection-tool.ts        # 选择工具
```

## 功能特性

- ✅ 完整的节点类型渲染
- ✅ 自定义边连接样式
- ✅ 交互式节点创建和编辑
- ✅ 主题支持（亮色/暗色）
- ✅ 验证状态可视化
- ✅ 拖拽和缩放支持
- ✅ 键盘快捷键
- ✅ 上下文菜单

## 使用方法

1. 安装依赖：
```bash
npm install @eclipse-glsp/client @eclipse-glsp/server
```

2. 导入配置：
```typescript
import { WorkflowDiagramConfiguration } from './glsp-configuration';
```

3. 初始化GLSP客户端：
```typescript
const diagramConfiguration = new WorkflowDiagramConfiguration();
const glspClient = new GLSPClient(diagramConfiguration);
```

## 渲染效果预览

### 节点渲染样式

- **开始节点**：绿色圆形，带有播放图标
- **结束节点**：红色圆形，带有停止图标
- **处理节点**：蓝色矩形，带有齿轮图标
- **决策节点**：黄色菱形，带有问号图标
- **决策表节点**：橙色矩形，带有表格图标
- **并行节点**：绿色矩形，带有分叉图标
- **异常节点**：红色圆形，带有警告图标

### 边连接样式

- **标准连接**：实线箭头
- **条件连接**：带标签的实线箭头
- **异常连接**：红色虚线箭头

## 相关文档

- [GLSP 官方文档](https://www.eclipse.org/glsp/)
- [工作流程 DSL 参考](../../docs/workflow/DSL-Reference.md)
- [节点类型使用指南](../../docs/workflow/Node-Types-Guide.md)