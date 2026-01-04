# 序列化调试分析
# Serialization Debug Analysis

## 问题分析 (Problem Analysis)

通过代码分析，发现文件清空问题可能出现在以下几个环节：

### 1. 模型序列化问题 (Model Serialization Issues)

在 `WorkflowStorage.saveSourceModel()` 方法中：
```typescript
this.state.modelService.save({
   uri: saveUri,
   model: this.state.semanticRoot,  // 这里可能是问题所在
   clientId: this.state.clientId
});
```

### 2. 语义根模型状态 (Semantic Root Model State)

问题可能在于 `this.state.semanticRoot` 在某些情况下可能：
- 为空或未正确初始化
- 在图形编辑器操作过程中被意外清空
- 序列化时出现错误

### 3. 序列化器问题 (Serializer Issues)

`WorkflowSerializer.serialize()` 方法可能在处理某些模型状态时返回空字符串。

## 可能的解决方案 (Possible Solutions)

### 方案1: 添加保护性检查 (Add Protective Checks)

在 `WorkflowStorage.saveSourceModel()` 中添加验证：
```typescript
saveSourceModel(action: SaveModelAction): MaybePromise<void> {
   const saveUri = this.getFileUri(action);
   
   // 添加保护性检查
   if (!this.state.semanticRoot) {
      this.logger.error('Cannot save: semantic root is undefined');
      return;
   }
   
   if (!this.state.semanticRoot.workflowModel) {
      this.logger.error('Cannot save: workflow model is undefined');
      return;
   }
   
   // 序列化前验证
   const serializedText = this.state.semanticSerializer.serialize(this.state.semanticRoot);
   if (!serializedText || serializedText.trim().length === 0) {
      this.logger.error('Cannot save: serialized text is empty');
      return;
   }
   
   this.logger.info('Saving workflow model with text length: ' + serializedText.length);
   
   // 保存主文档
   this.state.modelService.save({
      uri: saveUri,
      model: this.state.semanticRoot,
      clientId: this.state.clientId
   });
}
```

### 方案2: 改进错误处理 (Improve Error Handling)

在序列化器中添加更好的错误处理和日志记录。

### 方案3: 备份机制 (Backup Mechanism)

在保存前创建备份，如果保存失败则恢复备份。

## 调试步骤 (Debug Steps)

1. 在 `WorkflowStorage.saveSourceModel()` 中添加详细日志
2. 在 `WorkflowSerializer.serialize()` 中添加调试输出
3. 检查 `this.state.semanticRoot` 的状态
4. 验证序列化输出的内容

## 临时解决方案 (Temporary Solution)

在修复问题之前，建议：
1. 总是备份文件
2. 使用只读模式测试
3. 避免在图形编辑器中保存重要文件