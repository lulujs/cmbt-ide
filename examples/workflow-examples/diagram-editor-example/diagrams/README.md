# 图形文件目录

这个目录包含从图形编辑器导出的图形文件。

## 文件类型

- **PNG文件**: 用于文档和演示的位图图像
- **SVG文件**: 可缩放的矢量图形，适合打印和高分辨率显示
- **JSON文件**: GLSP图形模型的序列化数据

## 导出方法

### 在图形编辑器中导出

1. 打开工作流程的图形编辑器视图
2. 右键点击画布
3. 选择"导出" → 选择格式（PNG/SVG）
4. 保存到此目录

### 程序化导出

```typescript
// 在图形编辑器中
const diagramWidget = getCurrentDiagramWidget();

// 导出为PNG
const pngData = await diagramWidget.exportAsImage('png');

// 导出为SVG
const svgData = await diagramWidget.exportAsImage('svg');
```

## 示例文件

- `complete-example.png`: CompleteExample.workflow.cm 的流程图截图
- `complete-example.svg`: CompleteExample.workflow.cm 的矢量图形
- `complete-example.json`: CompleteExample.workflow.cm 的GLSP模型数据

这些文件可以用于：
- 文档和演示
- 版本控制中的可视化对比
- 与团队成员分享流程设计
- 集成到其他文档系统中