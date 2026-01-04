# 安全测试程序 - Safe Testing Procedure

## 🛡️ 文件保护措施已实施 (File Protection Measures Implemented)

我已经在以下文件中添加了保护性检查：

### 1. WorkflowStorage 保护 (WorkflowStorage Protection)
- ✅ 添加了语义根模型验证
- ✅ 添加了工作流程模型验证  
- ✅ 添加了序列化输出验证
- ✅ 添加了详细的错误日志记录

### 2. 文档管理器保护 (Document Manager Protection)
- ✅ 添加了自动备份机制
- ✅ 添加了空内容检查
- ✅ 拒绝保存空文件

## 🧪 安全测试步骤 (Safe Testing Steps)

### 步骤1: 验证保护措施 (Verify Protection Measures)
```bash
# 检查修改是否已应用
grep -n "保护性检查\|protective checks" packages/server/src/glsp-server/workflow-diagram/workflow-storage.ts
grep -n "备份文件\|backup file" packages/server/src/model-server/open-text-document-manager.ts
```

### 步骤2: 重新构建服务器 (Rebuild Server)
```bash
# 重新构建后端服务器以应用修复
yarn build:server
```

### 步骤3: 重启开发环境 (Restart Development Environment)
```bash
# 重启整个开发环境
yarn start:browser
```

### 步骤4: 安全测试流程 (Safe Testing Procedure)

#### 4.1 准备测试文件 (Prepare Test Files)
```bash
# 创建测试副本
cp examples/workflow-examples/diagram-editor-test/SimpleTestWorkflow.workflow.cm examples/workflow-examples/diagram-editor-test/SimpleTestWorkflow-test.workflow.cm
```

#### 4.2 测试图形编辑器显示 (Test Diagram Editor Display)
1. 打开 `SimpleTestWorkflow-test.workflow.cm`
2. 验证是否显示三个标签页：
   - 📝 Form Editor
   - 💻 Code Editor  
   - 📊 Diagram Editor ← **这个应该现在可见**
3. 点击 Diagram Editor 标签页
4. 检查是否显示工作流程图形

#### 4.3 验证节点显示 (Verify Node Display)
在图形编辑器中应该看到：
- 🟢 开始节点 (start_node)
- 🔵 处理步骤 (process_step)  
- 🔶 检查结果 (check_result) - 决策节点
- 🔴 成功结束 (success_end)
- 🔴 失败结束 (failure_end)

#### 4.4 验证边连接 (Verify Edge Connections)
应该看到节点之间的连接线：
- 开始 → 处理步骤
- 处理步骤 → 检查结果
- 检查结果 → 成功结束 (success分支)
- 检查结果 → 失败结束 (failure分支)

### 步骤5: 检查日志输出 (Check Log Output)
在浏览器开发者工具的控制台中查找：
- ✅ "Updating workflow model for ... with X nodes and Y edges"
- ✅ "Saving workflow model to ... with text length: X"
- ❌ 任何错误消息

### 步骤6: 验证文件完整性 (Verify File Integrity)
```bash
# 检查文件是否仍然包含内容
wc -l examples/workflow-examples/diagram-editor-test/SimpleTestWorkflow-test.workflow.cm

# 检查是否创建了备份文件
ls -la examples/workflow-examples/diagram-editor-test/*.backup
```

## 🚨 如果仍然出现问题 (If Issues Still Occur)

### 检查备份文件 (Check Backup Files)
```bash
# 如果文件被清空，从备份恢复
cp examples/workflow-examples/diagram-editor-test/SimpleTestWorkflow-test.workflow.cm.backup examples/workflow-examples/diagram-editor-test/SimpleTestWorkflow-test.workflow.cm
```

### 查看详细日志 (View Detailed Logs)
1. 打开浏览器开发者工具
2. 查看 Console 标签页
3. 查看 Network 标签页中的 GLSP 请求
4. 检查后端服务器日志

## 📋 测试检查清单 (Testing Checklist)

- [ ] 保护措施已实施并构建
- [ ] 开发环境已重启
- [ ] 测试文件已准备
- [ ] Diagram Editor 标签页可见
- [ ] 图形内容正确显示
- [ ] 节点和边正确渲染
- [ ] 没有错误日志
- [ ] 文件内容保持完整
- [ ] 备份文件已创建

## 🎯 预期结果 (Expected Results)

如果修复成功，你应该能够：
1. ✅ 看到 Diagram Editor 标签页
2. ✅ 在图形编辑器中查看工作流程图
3. ✅ 文件内容保持完整，不会被清空
4. ✅ 看到详细的日志信息而不是错误

## 📞 如果需要进一步帮助 (If Further Help Needed)

如果问题仍然存在，请提供：
1. 浏览器控制台的错误日志
2. 后端服务器的日志输出
3. 文件是否仍然被清空
4. 是否创建了备份文件