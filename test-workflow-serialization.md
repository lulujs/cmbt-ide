# 工作流序列化修复测试

## 问题描述
图形编辑工作流后，出现以下问题：
1. 文件结构发生错误变化：`workflow:` → `workflowModel:`，`- begin:` → `- nodeType: "begin"`
2. 属性顺序混乱（`expectedValue` 和 `position` 位置对调）
3. 缩进不正确，`edges` 部分丢失
4. **关键问题**：修改的 `name` 值会退回原来的名称

## 根本原因分析

### 问题4的根本原因
修改名称后退回原值的问题是由于**双向同步冲突**造成的：

1. **文本修改方式的问题**：之前的方法是修改文本字符串，然后重新解析AST
2. **模型重新序列化**：当AST重新解析后，序列化器会根据AST中的旧属性值重新生成文本
3. **异步更新冲突**：模型服务的异步更新机制可能导致更改被覆盖

### 解决方案演进

#### 第一次尝试：智能序列化器 ✅
- **问题**：文件结构混乱
- **解决方案**：创建 `SmartSerializer` 根据模型类型选择合适的序列化器
- **结果**：成功解决结构问题

#### 第二次尝试：属性顺序修复 ✅  
- **问题**：`expectedValue` 和 `position` 位置对调
- **解决方案**：调整 `WorkflowSerializer` 中的属性序列化顺序
- **结果**：成功解决顺序问题

#### 第三次尝试：正则表达式文本替换 ❌
- **问题**：名称修改后退回原值
- **尝试方案**：使用正则表达式直接修改文本内容
- **失败原因**：文本修改后，AST重新解析时会覆盖修改

#### 第四次尝试：直接AST修改 ✅
- **问题**：名称修改后退回原值  
- **最终解决方案**：直接修改AST节点的属性，然后重新序列化
- **技术实现**：
  ```typescript
  // 直接修改AST节点的名称属性
  (node as any).name = newText;
  // 使用修改后的AST重新序列化
  const updatedText = this.modelState.semanticText();
  this.modelState.updateSourceModel({ text: updatedText });
  ```

## 修复的技术细节

### 1. 智能序列化器架构
```typescript
export class SmartSerializer implements Serializer<CrossModelRoot> {
   serialize(root: CrossModelRoot): string {
      if (root.workflowModel && isWorkflowModel(root.workflowModel)) {
         return this.workflowSerializer.serialize(root.workflowModel);
      }
      return this.crossModelSerializer.serialize(root);
   }
}
```

### 2. 属性顺序优化
```typescript
// WorkflowSerializer 中的正确顺序
if (node.description) {
   lines.push(this.indent(3) + `description: "${node.description}"`);
}

// expectedValue 在 position 之前
if (isEndNode(node) || isExceptionNode(node)) {
   if (endNode.expectedValue) {
      lines.push(this.indent(3) + `expectedValue: "${endNode.expectedValue}"`);
   }
}

// position 在 expectedValue 之后
if (node.position) {
   lines.push(this.indent(3) + 'position:');
   lines.push(this.indent(4) + `x: ${node.position.x}`);
   lines.push(this.indent(4) + `y: ${node.position.y}`);
}
```

### 3. 直接AST修改策略
```typescript
// 找到AST节点
const node = this.modelState.index.findWorkflowNode(elementId);
if (node && node.name !== newText) {
   // 直接修改AST属性（绕过文本解析）
   (node as any).name = newText;
   
   // 使用修改后的AST重新序列化
   const updatedText = this.modelState.semanticText();
   this.modelState.updateSourceModel({ text: updatedText });
}
```

## 修复状态
✅ `workflow:` 格式保持正确（智能序列化器）  
✅ 节点格式保持 `- begin:` （智能序列化器）  
✅ `expectedValue` 在 `position` 之前（属性顺序优化）  
✅ 缩进格式正确（智能序列化器）  
✅ `edges` 部分保持完整（智能序列化器）  
✅ **修改的 `name` 值正确保存不退回**（直接AST修改）

## 技术架构优势

1. **智能序列化**：根据模型类型自动选择最适合的序列化器
2. **AST直接操作**：绕过文本解析的双向同步问题
3. **属性顺序保证**：确保输出格式与原始格式一致
4. **健壮性**：多层次的错误处理和回退机制

## 测试验证
现在当你在图形编辑器中修改工作流节点名称时：
- ✅ 修改立即生效且不会退回
- ✅ 文件保持正确的 `workflow:` 格式  
- ✅ 所有属性顺序和结构保持正确