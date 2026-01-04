# 工作流程图编辑器测试指南
# Workflow Diagram Editor Test Guide

## 测试目标 (Test Objectives)

验证工作流程图编辑器的完整功能，包括：
- 图形编辑器标签页的显示
- 节点的创建、编辑和删除
- 边的连接和配置
- 与代码编辑器的同步

Verify the complete functionality of the workflow diagram editor, including:
- Display of diagram editor tab
- Node creation, editing, and deletion
- Edge connection and configuration
- Synchronization with code editor

## 测试步骤 (Test Steps)

### 1. 启动应用程序 (Start Application)

```bash
cd applications/browser-app
yarn start --port 3001
```

访问: http://127.0.0.1:3001

### 2. 打开工作流程文件 (Open Workflow File)

1. 在文件浏览器中导航到 `examples/workflow-examples/diagram-editor-test/`
2. 首先尝试打开 `SimpleTestWorkflow.workflow.cm` 文件（简单版本）
3. 或者打开 `TestWorkflow.workflow.cm` 文件（完整版本）
4. **验证**: 应该看到三个标签页：
   - 📝 Code Editor (代码编辑器)
   - 📊 Form Editor (表单编辑器)  
   - 🎨 **Diagram Editor (图形编辑器)** ← 这是我们要验证的

**注意**: 如果遇到语法错误，请使用 `SimpleTestWorkflow.workflow.cm` 进行测试，它使用了最基本的语法结构。

### 3. 测试图形编辑器功能 (Test Diagram Editor Features)

#### 3.1 查看现有节点 (View Existing Nodes)
- 点击 "Diagram Editor" 标签页
- **验证**: 应该看到以下节点：
  - 开始节点 (Start Node)
  - 处理节点 (Process Node) 
  - 分支节点 (Decision Node)
  - 结束节点 (End Node)

#### 3.2 节点操作 (Node Operations)
- **选择节点**: 点击任意节点，应该高亮显示
- **移动节点**: 拖拽节点到新位置
- **编辑属性**: 双击节点或右键选择"Properties"

#### 3.3 边操作 (Edge Operations)
- **查看连接**: 验证节点之间的连接线
- **创建新连接**: 从一个节点拖拽到另一个节点
- **编辑条件**: 选择边并编辑条件属性

#### 3.4 同步测试 (Synchronization Test)
- 在图形编辑器中修改节点位置
- 切换到代码编辑器标签页
- **验证**: 位置坐标应该自动更新

## 预期结果 (Expected Results)

✅ **成功标准**:
1. 工作流程文件打开时显示三个标签页
2. 图形编辑器标签页可以正常访问
3. 节点在图形视图中正确显示
4. 可以进行基本的图形编辑操作
5. 图形编辑器与代码编辑器保持同步

❌ **失败情况**:
- 只显示两个标签页（缺少图形编辑器）
- 图形编辑器标签页无法点击或显示错误
- 节点无法正确渲染
- 编辑操作不响应

## 故障排除 (Troubleshooting)

### 问题1: 图形编辑器标签页不显示
**可能原因**:
- WorkflowDiagramFrontendModule 未正确注册
- 文件扩展名关联问题
- GLSP 服务器未启动

**解决方案**:
1. 检查 `packages/glsp-client/package.json` 中的 `theiaExtensions`
2. 验证 `.workflow.cm` 文件扩展名
3. 检查控制台错误信息

### 问题2: 节点无法显示
**可能原因**:
- GLSP 服务器连接失败
- 模型解析错误
- 渲染引擎问题

**解决方案**:
1. 检查浏览器开发者工具的网络标签页
2. 查看控制台错误信息
3. 验证工作流程文件语法

## 技术细节 (Technical Details)

### 相关文件 (Related Files)
- `packages/glsp-client/src/browser/workflow-diagram/workflow-diagram-frontend-module.ts`
- `packages/glsp-client/src/browser/workflow-diagram/workflow-diagram-manager.ts`
- `packages/glsp-client/src/common/crossmodel-diagram-language.ts`
- `packages/server/src/glsp-server/workflow-diagram/workflow-diagram-module.ts`

### 文件扩展名 (File Extensions)
- 工作流程文件: `.workflow.cm`
- 语言标识: `workflow-diagram`
- MIME类型: `application/crossmodel-workflow`

### 端口配置 (Port Configuration)
- 前端应用: http://127.0.0.1:3001
- GLSP 服务器: 通过 WebSocket 连接
- 语言服务器: 集成在后端进程中