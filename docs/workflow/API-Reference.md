# API 参考文档

本文档提供了业务流程建模系统的 API 参考，包括核心接口、类型定义和服务方法。

## 目录

- [核心类型](#核心类型)
- [模型服务 API](#模型服务-api)
- [语言服务 API](#语言服务-api)
- [GLSP 服务 API](#glsp-服务-api)
- [事件和回调](#事件和回调)

## 核心类型

### WorkflowModel

工作流程模型的根类型。

```typescript
interface WorkflowModel {
   /** 工作流程唯一标识符 */
   id: string;

   /** 工作流程名称 */
   name: string;

   /** 元数据 */
   metadata?: WorkflowMetadata;

   /** 节点列表 */
   nodes: WorkflowNode[];

   /** 边列表 */
   edges: WorkflowEdge[];

   /** 泳道列表 */
   swimlanes?: Swimlane[];
}
```

### WorkflowMetadata

工作流程元数据。

```typescript
interface WorkflowMetadata {
   /** 版本号 */
   version?: string;

   /** 作者 */
   author?: string;

   /** 标签列表 */
   tags?: string[];

   /** 创建时间 */
   createdAt?: string;

   /** 更新时间 */
   updatedAt?: string;
}
```

### NodeType

节点类型枚举。

```typescript
enum NodeType {
   /** 开始节点 */
   BEGIN = 'begin',

   /** 结束节点 */
   END = 'end',

   /** 异常节点 */
   EXCEPTION = 'exception',

   /** 过程节点 */
   PROCESS = 'process',

   /** 分支节点 */
   DECISION = 'decision',

   /** 决策表节点 */
   DECISION_TABLE = 'decision_table',

   /** 子流程节点 */
   SUBPROCESS = 'subprocess',

   /** 并发节点 */
   CONCURRENT = 'concurrent',

   /** Auto 节点 */
   AUTO = 'auto',

   /** API 节点 */
   API = 'api'
}
```

### WorkflowNode

工作流程节点基础接口。

```typescript
interface WorkflowNode {
   /** 节点唯一标识符 */
   id: string;

   /** 节点类型 */
   type: NodeType;

   /** 节点名称 */
   name: string;

   /** 节点描述 */
   description?: string;

   /** 节点位置 */
   position?: Position;

   /** 测试数据 */
   testData?: TestData[];

   /** 自动化动作 */
   automationActions?: AutomationAction[];
}
```

### 特定节点类型

#### BeginNode

```typescript
interface BeginNode extends WorkflowNode {
   type: NodeType.BEGIN;
}
```

#### EndNode

```typescript
interface EndNode extends WorkflowNode {
   type: NodeType.END;

   /** 预期值（必需） */
   expectedValue: string;
}
```

#### ExceptionNode

```typescript
interface ExceptionNode extends WorkflowNode {
   type: NodeType.EXCEPTION;

   /** 预期值（必需） */
   expectedValue: string;

   /** 错误代码 */
   errorCode?: string;
}
```

#### ProcessNode

```typescript
interface ProcessNode extends WorkflowNode {
   type: NodeType.PROCESS;
}
```

#### DecisionNode

```typescript
interface DecisionNode extends WorkflowNode {
   type: NodeType.DECISION;

   /** 分支定义 */
   branches: Branch[];
}

interface Branch {
   /** 分支标识符 */
   id: string;

   /** 分支值 */
   value: string;

   /** 是否为默认分支 */
   isDefault?: boolean;
}
```

#### DecisionTableNode

```typescript
interface DecisionTableNode extends WorkflowNode {
   type: NodeType.DECISION_TABLE;

   /** 决策表数据 */
   tableData: DecisionTableData;
}

interface DecisionTableData {
   /** 输入列 */
   inputColumns: Column[];

   /** 输出列 */
   outputColumns: Column[];

   /** 决策列 */
   decisionColumns: Column[];

   /** 数据行 */
   rows: TableRow[];
}

interface Column {
   /** 列标识符 */
   id: string;

   /** 列名称 */
   name: string;

   /** 数据类型 */
   dataType: 'string' | 'number' | 'boolean';
}

interface TableRow {
   /** 行标识符 */
   id: string;

   /** 单元格值 */
   values: CellValue[];
}

interface CellValue {
   /** 列标识符 */
   column: string;

   /** 单元格值 */
   value: string;
}
```

#### ConcurrentNode

```typescript
interface ConcurrentNode extends WorkflowNode {
   type: NodeType.CONCURRENT;

   /** 并行分支 */
   parallelBranches: ParallelBranch[];
}

interface ParallelBranch {
   /** 分支标识符 */
   id: string;

   /** 分支名称 */
   name: string;
}
```

#### SubprocessNode

```typescript
interface SubprocessNode extends WorkflowNode {
   type: NodeType.SUBPROCESS;

   /** 引用的工作流程路径 */
   referencePath: string;
}
```

#### AutoNode

```typescript
interface AutoNode extends WorkflowNode {
   type: NodeType.AUTO;

   /** 自动化类型 */
   automationType: string;

   /** 配置 */
   configuration: Record<string, any>;
}
```

#### ApiNode

```typescript
interface ApiNode extends WorkflowNode {
   type: NodeType.API;

   /** API 端点 */
   endpoint: string;

   /** HTTP 方法 */
   method: 'GET' | 'POST' | 'PUT' | 'DELETE';

   /** 请求头 */
   headers?: Record<string, string>;

   /** 请求体 */
   body?: Record<string, any>;
}
```

### WorkflowEdge

工作流程边。

```typescript
interface WorkflowEdge {
   /** 边唯一标识符 */
   id: string;

   /** 源节点 ID */
   source: string;

   /** 目标节点 ID */
   target: string;

   /** 条件值（用于分支节点） */
   value?: string;

   /** 测试数据 */
   testData?: TestData[];

   /** 自动化动作 */
   automationActions?: AutomationAction[];
}
```

### Swimlane

泳道。

```typescript
interface Swimlane {
   /** 泳道唯一标识符 */
   id: string;

   /** 泳道名称 */
   name: string;

   /** 位置 */
   position?: Position;

   /** 宽度 */
   width?: number;

   /** 高度 */
   height?: number;

   /** 背景颜色 */
   color?: string;

   /** 包含的节点引用 */
   containedNodes: NodeReference[];
}

interface NodeReference {
   /** 引用的节点 ID */
   ref: string;
}
```

### Position

位置。

```typescript
interface Position {
   /** X 坐标 */
   x: number;

   /** Y 坐标 */
   y: number;
}
```

### TestData

测试数据。

```typescript
interface TestData {
   /** 测试数据标识符 */
   id: string;

   /** 测试数据名称 */
   name: string;

   /** 输入数据 */
   inputData: Record<string, any>;

   /** 预期输出 */
   expectedOutput: Record<string, any>;

   /** 绑定的边 ID */
   edgeBinding: string;
}
```

### AutomationAction

自动化动作。

```typescript
interface AutomationAction {
   /** 动作标识符 */
   id: string;

   /** 动作名称 */
   name: string;

   /** 动作类型 */
   actionType: 'api_call' | 'script' | 'webhook';

   /** 配置 */
   configuration: Record<string, any>;

   /** 绑定的边 ID */
   edgeBinding: string;
}
```

### ReferenceNode

引用节点。

```typescript
interface ReferenceNode extends WorkflowNode {
   /** 源节点 ID */
   sourceNodeId: string;

   /** 是否为引用节点 */
   isReference: true;

   /** 可编辑的属性 */
   editableProperties: ('name' | 'stepDisplay')[];
}
```

## 模型服务 API

### WorkflowModelService

工作流程模型服务接口。

```typescript
interface WorkflowModelService {
   /**
    * 打开工作流程文档
    * @param uri 文档 URI
    * @returns 工作流程模型
    */
   open(uri: string): Promise<WorkflowModel>;

   /**
    * 保存工作流程文档
    * @param uri 文档 URI
    */
   save(uri: string): Promise<void>;

   /**
    * 关闭工作流程文档
    * @param uri 文档 URI
    */
   close(uri: string): Promise<void>;

   /**
    * 获取工作流程模型
    * @param uri 文档 URI
    * @returns 工作流程模型
    */
   getModel(uri: string): WorkflowModel | undefined;

   /**
    * 创建节点
    * @param uri 文档 URI
    * @param type 节点类型
    * @param properties 节点属性
    * @returns 创建的节点
    */
   createNode(uri: string, type: NodeType, properties: NodeProperties): Promise<WorkflowNode>;

   /**
    * 更新节点
    * @param uri 文档 URI
    * @param nodeId 节点 ID
    * @param properties 要更新的属性
    */
   updateNode(uri: string, nodeId: string, properties: Partial<NodeProperties>): Promise<void>;

   /**
    * 删除节点
    * @param uri 文档 URI
    * @param nodeId 节点 ID
    */
   deleteNode(uri: string, nodeId: string): Promise<void>;

   /**
    * 创建边
    * @param uri 文档 URI
    * @param sourceId 源节点 ID
    * @param targetId 目标节点 ID
    * @param properties 边属性
    * @returns 创建的边
    */
   createEdge(uri: string, sourceId: string, targetId: string, properties?: EdgeProperties): Promise<WorkflowEdge>;

   /**
    * 更新边
    * @param uri 文档 URI
    * @param edgeId 边 ID
    * @param properties 要更新的属性
    */
   updateEdge(uri: string, edgeId: string, properties: Partial<EdgeProperties>): Promise<void>;

   /**
    * 删除边
    * @param uri 文档 URI
    * @param edgeId 边 ID
    */
   deleteEdge(uri: string, edgeId: string): Promise<void>;

   /**
    * 更新决策表数据
    * @param uri 文档 URI
    * @param nodeId 决策表节点 ID
    * @param tableData 决策表数据
    */
   updateDecisionTable(uri: string, nodeId: string, tableData: DecisionTableData): Promise<void>;

   /**
    * 验证决策表数据
    * @param tableData 决策表数据
    * @returns 验证结果
    */
   validateDecisionTable(tableData: DecisionTableData): ValidationResult;

   /**
    * 创建泳道
    * @param uri 文档 URI
    * @param properties 泳道属性
    * @returns 创建的泳道
    */
   createSwimlane(uri: string, properties: SwimlaneProperties): Promise<Swimlane>;

   /**
    * 将节点添加到泳道
    * @param uri 文档 URI
    * @param nodeId 节点 ID
    * @param swimlaneId 泳道 ID
    */
   addNodeToSwimlane(uri: string, nodeId: string, swimlaneId: string): Promise<void>;

   /**
    * 从泳道移除节点
    * @param uri 文档 URI
    * @param nodeId 节点 ID
    */
   removeNodeFromSwimlane(uri: string, nodeId: string): Promise<void>;

   /**
    * 删除泳道
    * @param uri 文档 URI
    * @param swimlaneId 泳道 ID
    * @param deleteContainedNodes 是否删除包含的节点
    */
   deleteSwimlane(uri: string, swimlaneId: string, deleteContainedNodes?: boolean): Promise<void>;

   /**
    * 创建引用节点
    * @param uri 文档 URI
    * @param sourceNodeId 源节点 ID
    * @returns 创建的引用节点
    */
   createReference(uri: string, sourceNodeId: string): Promise<ReferenceNode>;

   /**
    * 批量创建引用节点
    * @param uri 文档 URI
    * @param nodeIds 源节点 ID 列表
    * @returns 创建的引用节点列表
    */
   batchCreateReferences(uri: string, nodeIds: string[]): Promise<ReferenceNode[]>;
}
```

### NodeProperties

节点属性类型。

```typescript
interface NodeProperties {
   /** 节点名称 */
   name: string;

   /** 节点描述 */
   description?: string;

   /** 节点位置 */
   position?: Position;

   /** 预期值（用于结束节点） */
   expectedValue?: string;

   /** 错误代码（用于异常节点） */
   errorCode?: string;

   /** 分支定义（用于分支节点） */
   branches?: Branch[];

   /** 决策表数据（用于决策表节点） */
   tableData?: DecisionTableData;

   /** 并行分支（用于并发节点） */
   parallelBranches?: ParallelBranch[];

   /** 引用路径（用于子流程节点） */
   referencePath?: string;

   /** 自动化类型（用于 Auto 节点） */
   automationType?: string;

   /** API 端点（用于 API 节点） */
   endpoint?: string;

   /** HTTP 方法（用于 API 节点） */
   method?: string;

   /** 配置 */
   configuration?: Record<string, any>;
}
```

### EdgeProperties

边属性类型。

```typescript
interface EdgeProperties {
   /** 条件值 */
   value?: string;
}
```

### SwimlaneProperties

泳道属性类型。

```typescript
interface SwimlaneProperties {
   /** 泳道名称 */
   name: string;

   /** 位置 */
   position?: Position;

   /** 宽度 */
   width?: number;

   /** 高度 */
   height?: number;

   /** 背景颜色 */
   color?: string;
}
```

### ValidationResult

验证结果类型。

```typescript
interface ValidationResult {
   /** 是否有效 */
   isValid: boolean;

   /** 错误列表 */
   errors: ValidationError[];

   /** 警告列表 */
   warnings: ValidationWarning[];
}

interface ValidationError {
   /** 错误消息 */
   message: string;

   /** 错误位置 */
   location?: string;

   /** 错误代码 */
   code?: string;
}

interface ValidationWarning {
   /** 警告消息 */
   message: string;

   /** 警告位置 */
   location?: string;
}
```

## 语言服务 API

### WorkflowLanguageService

工作流程语言服务接口。

```typescript
interface WorkflowLanguageService {
   /**
    * 解析 DSL 文本
    * @param text DSL 文本
    * @returns 解析结果
    */
   parse(text: string): ParseResult<WorkflowModel>;

   /**
    * 序列化模型为 DSL 文本
    * @param model 工作流程模型
    * @returns DSL 文本
    */
   serialize(model: WorkflowModel): string;

   /**
    * 验证模型
    * @param model 工作流程模型
    * @returns 验证诊断信息
    */
   validate(model: WorkflowModel): Diagnostic[];

   /**
    * 获取代码补全建议
    * @param document 文档
    * @param position 光标位置
    * @returns 补全项列表
    */
   getCompletionItems(document: TextDocument, position: Position): CompletionItem[];

   /**
    * 获取悬停信息
    * @param document 文档
    * @param position 光标位置
    * @returns 悬停信息
    */
   getHoverInfo(document: TextDocument, position: Position): Hover | undefined;

   /**
    * 获取定义位置
    * @param document 文档
    * @param position 光标位置
    * @returns 定义位置
    */
   getDefinition(document: TextDocument, position: Position): Location | undefined;

   /**
    * 获取引用位置
    * @param document 文档
    * @param position 光标位置
    * @returns 引用位置列表
    */
   getReferences(document: TextDocument, position: Position): Location[];

   /**
    * 格式化文档
    * @param document 文档
    * @returns 格式化编辑
    */
   format(document: TextDocument): TextEdit[];
}
```

### ParseResult

解析结果类型。

```typescript
interface ParseResult<T> {
   /** 解析的值 */
   value?: T;

   /** 解析错误 */
   parserErrors: ParserError[];

   /** 词法错误 */
   lexerErrors: LexerError[];
}
```

## GLSP 服务 API

### WorkflowGLSPServer

工作流程 GLSP 服务器接口。

```typescript
interface WorkflowGLSPServer {
   /**
    * 初始化服务器
    * @param params 初始化参数
    */
   initialize(params: InitializeParameters): Promise<void>;

   /**
    * 加载模型
    * @param action 加载模型动作
    * @returns 图形模型
    */
   loadModel(action: RequestModelAction): Promise<GModelRoot>;

   /**
    * 执行操作
    * @param operation 操作
    */
   executeOperation(operation: Operation): Promise<void>;

   /**
    * 获取工具面板
    * @returns 工具面板配置
    */
   getToolPalette(): ToolPalette;

   /**
    * 获取上下文菜单
    * @param element 选中的元素
    * @returns 上下文菜单项
    */
   getContextMenu(element: GModelElement): MenuItem[];
}
```

### 操作类型

```typescript
/** 创建节点操作 */
interface CreateNodeOperation extends Operation {
   kind: 'createNode';
   elementTypeId: string;
   location: Point;
   args?: Record<string, any>;
}

/** 创建边操作 */
interface CreateEdgeOperation extends Operation {
   kind: 'createEdge';
   elementTypeId: string;
   sourceElementId: string;
   targetElementId: string;
   args?: Record<string, any>;
}

/** 删除元素操作 */
interface DeleteElementOperation extends Operation {
   kind: 'deleteElement';
   elementIds: string[];
}

/** 移动元素操作 */
interface ChangeBoundsOperation extends Operation {
   kind: 'changeBounds';
   newBounds: ElementAndBounds[];
}

/** 重新连接边操作 */
interface ReconnectEdgeOperation extends Operation {
   kind: 'reconnectEdge';
   edgeElementId: string;
   sourceElementId: string;
   targetElementId: string;
}
```

## 事件和回调

### ModelChangeListener

模型变更监听器。

```typescript
interface ModelChangeListener {
   /**
    * 模型变更时调用
    * @param uri 文档 URI
    * @param model 更新后的模型
    * @param source 变更来源
    */
   onModelChanged(uri: string, model: WorkflowModel, source: string): void;
}
```

### ValidationListener

验证监听器。

```typescript
interface ValidationListener {
   /**
    * 验证完成时调用
    * @param uri 文档 URI
    * @param diagnostics 诊断信息
    */
   onValidationComplete(uri: string, diagnostics: Diagnostic[]): void;
}
```

### 使用示例

```typescript
// 注册模型变更监听器
modelService.addModelChangeListener({
   onModelChanged(uri, model, source) {
      console.log(`Model changed: ${uri}, source: ${source}`);
      // 处理模型变更
   }
});

// 注册验证监听器
languageService.addValidationListener({
   onValidationComplete(uri, diagnostics) {
      if (diagnostics.length > 0) {
         console.log(`Validation errors in ${uri}:`, diagnostics);
      }
   }
});
```

## 相关文档

- [架构设计和扩展指南](./Architecture-Guide.md)
- [DSL 语法参考](./DSL-Reference.md)
- [贡献指南](../../CONTRIBUTING.md)
