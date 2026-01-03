# 设计文档

## 概述

本设计文档描述了将 CrossModel 数据建模应用改造为业务流程建模应用的技术方案。该系统将基于现有的 Langium + GLSP + Theia 架构，重新设计语法、语义模型和用户界面，以支持工作流程建模和自定义 DSL 语言。

系统将保留原有的三种建模方式（文本、图形、表单），但将核心概念从数据建模转换为业务流程建模，支持多种流程节点类型、决策表、泳道、并发处理等高级功能。

## 架构

### 整体架构

基于现有的 CrossModel 架构，保持以下核心组件：

```
┌─────────────────────────────────────────────────────────────┐
│                    前端应用层                                 │
│  ┌─────────────────┬─────────────────┬─────────────────────┐ │
│  │   文本编辑器     │   图形编辑器     │    表单编辑器        │ │
│  │  (DSL Editor)   │ (Workflow Diagram)│  (Property Forms)  │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    服务层                                    │
│  ┌─────────────────┬─────────────────┬─────────────────────┐ │
│  │ Workflow        │ GLSP            │ Model               │ │
│  │ Language Server │ Server          │ Service             │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    数据层                                    │
│              Langium Document Store                         │
│            (Workflow Models Storage)                        │
└─────────────────────────────────────────────────────────────┘
```

### 核心架构变更

1. **语言服务器改造**: 将 CrossModel 的数据建模语法替换为工作流程建模语法
2. **GLSP 服务器扩展**: 支持工作流程图形元素的渲染和交互
3. **模型服务增强**: 支持工作流程特有的数据结构和操作
4. **前端界面重构**: 适配工作流程建模的用户界面需求

## 组件和接口

### 1. 工作流程语言服务器 (Workflow Language Server)

基于现有的 `@crossmodel/server` 包进行改造：

**核心接口:**
```typescript
interface WorkflowLanguageServer {
  // 节点管理
  createNode(type: NodeType, properties: NodeProperties): WorkflowNode
  updateNode(nodeId: string, properties: Partial<NodeProperties>): void
  deleteNode(nodeId: string): void
  
  // 边管理
  createEdge(sourceId: string, targetId: string, properties: EdgeProperties): WorkflowEdge
  updateEdge(edgeId: string, properties: Partial<EdgeProperties>): void
  deleteEdge(edgeId: string): void
  
  // 决策表管理
  createDecisionTable(nodeId: string, data: DecisionTableData): void
  updateDecisionTable(nodeId: string, data: DecisionTableData): void
  validateDecisionTable(data: DecisionTableData): ValidationResult
  
  // 泳道管理
  createSwimlane(properties: SwimlaneProperties): Swimlane
  addNodeToSwimlane(nodeId: string, swimlaneId: string): void
  removeNodeFromSwimlane(nodeId: string): void
  
  // 引用节点管理
  createReference(sourceNodeId: string): ReferenceNode
  batchCreateReferences(nodeIds: string[]): ReferenceNode[]
}
```

**节点类型定义:**
```typescript
enum NodeType {
  BEGIN = 'begin',
  END = 'end',
  EXCEPTION = 'exception',
  PROCESS = 'process',
  DECISION = 'decision',
  DECISION_TABLE = 'decision_table',
  SUBPROCESS = 'subprocess',
  CONCURRENT = 'concurrent',
  AUTO = 'auto',
  API = 'api'
}

interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  properties: NodeProperties
  position: Position
  testData?: TestData[]
  automationActions?: AutomationAction[]
  expectedValue?: any // 仅用于 END 和 EXCEPTION 节点
}
```

### 2. GLSP 工作流程服务器 (GLSP Workflow Server)

扩展现有的 GLSP 服务器以支持工作流程图形建模：

**图形模型映射:**
```typescript
interface WorkflowGLSPServer {
  // 模型转换
  convertToGModel(workflowModel: WorkflowModel): GModel
  convertFromGModel(gModel: GModel): WorkflowModel
  
  // 图形操作
  handleCreateNode(operation: CreateNodeOperation): void
  handleCreateEdge(operation: CreateEdgeOperation): void
  handleMoveNode(operation: MoveOperation): void
  handleDeleteElement(operation: DeleteElementOperation): void
  
  // 特殊操作
  handleCreateSwimlane(operation: CreateSwimlaneOperation): void
  handleEditDecisionTable(operation: EditDecisionTableOperation): void
  handleCreateReference(operation: CreateReferenceOperation): void
}
```

**图形元素定义:**
```typescript
interface WorkflowGraphicalElements {
  // 基础节点图形
  beginNode: GNode
  endNode: GNode
  processNode: GNode
  decisionNode: GNode
  
  // 特殊节点图形
  decisionTableNode: GNode & { tableData: DecisionTableData }
  subprocessNode: GNode & { referencePath: string }
  concurrentNode: GNode & { parallelBranches: GNode[] }
  
  // 容器图形
  swimlane: GCompartment & { containedNodes: string[] }
  
  // 连接图形
  sequenceFlow: GEdge & { condition?: string }
  dataFlow: GEdge & { dataType: string }
}
```

### 3. DSL 语法定义

基于 Langium 框架定义工作流程建模的 DSL 语法：

**语法规则 (Grammar):**
```langium
grammar WorkflowDSL

entry WorkflowModel:
    'workflow' name=ID '{'
        (elements+=WorkflowElement)*
        (swimlanes+=Swimlane)*
    '}';

WorkflowElement:
    Node | Edge;

Node:
    BeginNode | EndNode | ExceptionNode | ProcessNode | 
    DecisionNode | DecisionTableNode | SubprocessNode | 
    ConcurrentNode | AutoNode | ApiNode;

BeginNode:
    'begin' name=ID ('at' position=Position)? 
    (testData=TestDataBlock)?
    (automationActions=AutomationActionBlock)?;

EndNode:
    'end' name=ID ('at' position=Position)?
    'expects' expectedValue=Expression
    (testData=TestDataBlock)?
    (automationActions=AutomationActionBlock)?;

ProcessNode:
    'process' name=ID ('at' position=Position)?
    ('description' description=STRING)?
    (testData=TestDataBlock)?
    (automationActions=AutomationActionBlock)?;

DecisionNode:
    'decision' name=ID ('at' position=Position)?
    'branches' '{' (branches+=Branch)+ '}';

DecisionTableNode:
    'decision_table' name=ID ('at' position=Position)?
    'table' table=DecisionTable;

Edge:
    'flow' from=[Node:ID] '->' to=[Node:ID]
    ('condition' condition=STRING)?
    ('data' dataType=STRING)?;

Swimlane:
    'swimlane' name=ID '{'
        'contains' '[' (nodes+=[Node:ID])* ']'
    '}';
```

### 4. 数据模型

**核心数据结构:**
```typescript
interface WorkflowModel {
  name: string
  nodes: Map<string, WorkflowNode>
  edges: Map<string, WorkflowEdge>
  swimlanes: Map<string, Swimlane>
  metadata: WorkflowMetadata
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
  dataType?: string
  testData?: TestData[]
  automationActions?: AutomationAction[]
}

interface DecisionTableData {
  inputColumns: Column[]
  outputColumns: Column[]
  decisionColumns: Column[]
  rows: TableRow[]
}

interface TestData {
  id: string
  name: string
  inputData: Record<string, any>
  expectedOutput: Record<string, any>
  edgeBinding: string // 绑定到特定输出边
}

interface AutomationAction {
  id: string
  name: string
  actionType: 'api_call' | 'script' | 'webhook'
  configuration: Record<string, any>
  edgeBinding: string // 绑定到特定输出边
}

interface ReferenceNode extends WorkflowNode {
  sourceNodeId: string
  isReference: true
  editableProperties: ['name', 'stepDisplay'] // 只允许编辑这些属性
}
```

### 5. 表单建模界面

基于现有的 `@crossmodel/form-client` 进行改造：

**表单组件:**
```typescript
interface WorkflowFormComponents {
  // 节点属性表单
  NodePropertiesForm: React.FC<{ node: WorkflowNode }>
  DecisionTableEditor: React.FC<{ data: DecisionTableData }>
  TestDataEditor: React.FC<{ testData: TestData[] }>
  AutomationActionEditor: React.FC<{ actions: AutomationAction[] }>
  
  // 流程属性表单
  WorkflowPropertiesForm: React.FC<{ workflow: WorkflowModel }>
  SwimlanePropertiesForm: React.FC<{ swimlane: Swimlane }>
  
  // 引用管理表单
  ReferenceManagerForm: React.FC<{ references: ReferenceNode[] }>
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上，是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

基于需求分析，以下是系统必须满足的正确性属性：

### 属性 1: 开始节点无预期值约束
*对于任何* 开始节点的创建请求，创建的节点应该不包含预期值属性
**验证: 需求 1.1**

### 属性 2: 结束节点预期值约束  
*对于任何* 结束节点的创建请求，创建的节点应该包含预期值属性
**验证: 需求 1.2**

### 属性 3: 异常节点特殊结束约束
*对于任何* 异常节点的创建请求，创建的节点应该是结束节点的特殊类型且包含预期值属性
**验证: 需求 1.3**

### 属性 4: 过程节点出边限制
*对于任何* 过程节点，其输出边的数量应该不超过一条
**验证: 需求 1.4**

### 属性 5: 分支节点默认输出边
*对于任何* 新创建的分支节点，应该默认包含两条输出边
**验证: 需求 1.5**

### 属性 6: 分支节点输出边值唯一性
*对于任何* 分支节点，其所有输出边的值应该互不相同
**验证: 需求 1.6**

### 属性 7: 决策表节点默认数据
*对于任何* 新创建的决策表节点，应该包含默认的决策表数据结构
**验证: 需求 2.1**

### 属性 8: 决策表数据导入边创建
*对于任何* 决策表数据导入操作，系统应该根据输出字段值创建对应数量的输出边
**验证: 需求 2.2**

### 属性 9: 决策表决策列唯一性
*对于任何* 决策表数据，其决策列的内容应该不能完全相同
**验证: 需求 2.3**

### 属性 10: 泳道容器属性
*对于任何* 新创建的泳道，应该具有容纳节点的容器属性
**验证: 需求 3.1**

### 属性 11: 节点泳道归属
*对于任何* 拖入泳道的节点，该节点应该正确归属到目标泳道
**验证: 需求 3.2**

### 属性 12: 引用节点克隆属性
*对于任何* 引用节点创建操作，创建的引用节点应该包含与源节点相同的核心属性
**验证: 需求 4.2**

### 属性 13: 引用节点编辑限制
*对于任何* 引用节点的编辑操作，只有节点名称和步骤显示按钮属性应该允许修改
**验证: 需求 4.3**

### 属性 14: 测试数据边绑定
*对于任何* 节点的测试数据配置，每个测试数据应该正确绑定到指定的输出边
**验证: 需求 5.1**

### 属性 15: 并发流程结构约束
*对于任何* 并发流程，其内部节点应该形成从并发开始到并发结束的有向无环图
**验证: 需求 6.1**

### 属性 16: 并发流程环路检测
*对于任何* 包含环路的并发流程，系统应该拒绝保存并返回错误
**验证: 需求 6.2**

### 属性 17: DSL 往返一致性
*对于任何* 有效的工作流程模型，DSL 序列化后再解析应该产生等价的模型
**验证: 需求 7.1-7.10**

### 属性 18: 跨建模方式数据同步
*对于任何* 在一种建模方式中的修改，其他建模方式应该实时反映相同的数据状态
**验证: 需求 8.4**

### 属性 19: 项目结构初始化
*对于任何* 新项目创建操作，应该生成完整的项目结构和版本控制初始化
**验证: 需求 9.1**

## 错误处理

### 节点验证错误
- **无效节点类型**: 当用户尝试创建不支持的节点类型时，返回明确的错误信息
- **节点属性缺失**: 当必需属性缺失时，阻止节点创建并提示具体缺失项
- **节点连接约束**: 当违反节点连接规则时（如过程节点多出边），拒绝操作

### 决策表验证错误
- **决策列重复**: 当决策表包含完全相同的决策列时，阻止保存并高亮重复项
- **缺少输出列**: 当决策表缺少必需的输出列时，提示添加输出列
- **数据格式错误**: 当导入的决策表数据格式不正确时，提供格式修正建议

### 并发流程验证错误
- **环路检测**: 当并发流程包含环路时，高亮环路路径并阻止保存
- **非法节点**: 当并发流程包含开始或结束节点时，提示移除非法节点
- **连接断裂**: 当并发流程内部连接不完整时，提示补全连接

### DSL 解析错误
- **语法错误**: 提供详细的语法错误位置和修正建议
- **语义错误**: 当 DSL 语义不正确时（如引用不存在的节点），提供上下文相关的错误信息
- **类型错误**: 当属性类型不匹配时，提供类型转换建议

## 测试策略

### 双重测试方法
系统将采用单元测试和基于属性的测试相结合的方法：

**单元测试**:
- 验证特定示例和边界情况
- 测试组件间的集成点
- 验证错误条件和异常处理
- 测试用户界面交互

**基于属性的测试**:
- 验证跨所有输入的通用属性
- 通过随机化实现全面的输入覆盖
- 每个正确性属性对应一个基于属性的测试
- 最小运行 100 次迭代以确保可靠性

### 测试框架配置
- **单元测试框架**: Jest (继承现有配置)
- **基于属性的测试框架**: fast-check (TypeScript 生态系统中的主流选择)
- **测试标记格式**: **功能: business-process-modeling, 属性 {编号}: {属性文本}**

### 测试覆盖范围
1. **节点管理测试**: 所有节点类型的创建、更新、删除操作
2. **边管理测试**: 边的创建、验证、数据绑定
3. **决策表测试**: 数据导入、验证、边生成
4. **泳道测试**: 容器功能、节点归属管理
5. **引用系统测试**: 引用创建、编辑限制、数据同步
6. **并发流程测试**: 结构验证、环路检测
7. **DSL 测试**: 解析、序列化、往返一致性
8. **跨组件同步测试**: 三种建模方式间的数据同步
9. **项目管理测试**: 项目创建、版本控制、导入导出

### 性能测试考虑
- **大型流程模型**: 测试包含数百个节点的复杂流程模型
- **实时同步性能**: 测试跨建模方式的同步延迟
- **决策表性能**: 测试大型决策表的导入和处理性能
- **内存使用**: 监控长时间编辑会话的内存使用情况

## 实现细节

### 1. 项目结构改造

基于现有的 CrossModel 项目结构，需要进行以下关键改造：

```
packages/
├── server/                    # 工作流程语言服务器
│   ├── src/
│   │   ├── language-server/
│   │   │   ├── workflow-grammar.langium      # 工作流程 DSL 语法
│   │   │   ├── workflow-validator.ts         # 语义验证器
│   │   │   ├── workflow-scope-provider.ts    # 作用域提供器
│   │   │   └── workflow-completion-provider.ts # 自动完成
│   │   ├── glsp-server/
│   │   │   ├── workflow-diagram-server.ts    # 工作流程图服务器
│   │   │   ├── workflow-model-factory.ts     # 模型工厂
│   │   │   └── workflow-operations/          # 图形操作处理器
│   │   └── model-server/
│   │       ├── workflow-model-service.ts     # 模型服务
│   │       └── workflow-serializer.ts        # 序列化器
├── glsp-client/               # 工作流程图形客户端
│   ├── src/
│   │   ├── workflow-diagram/
│   │   │   ├── workflow-diagram-widget.ts    # 图形编辑器组件
│   │   │   ├── workflow-palette.ts           # 工具面板
│   │   │   └── workflow-context-menu.ts      # 上下文菜单
│   │   └── workflow-views/
│   │       ├── decision-table-view.ts        # 决策表编辑器
│   │       └── swimlane-view.ts              # 泳道管理器
├── form-client/               # 工作流程表单客户端
│   ├── src/
│   │   ├── workflow-forms/
│   │   │   ├── node-properties-form.tsx     # 节点属性表单
│   │   │   ├── test-data-form.tsx           # 测试数据表单
│   │   │   └── automation-action-form.tsx   # 自动化动作表单
│   │   └── workflow-property-view/
│   │       └── workflow-property-widget.ts  # 属性视图组件
└── protocol/                  # 通信协议
    ├── src/
    │   ├── workflow-protocol.ts              # 工作流程协议定义
    │   └── workflow-types.ts                 # 类型定义
```

### 2. 核心文件改造清单

**语言服务器核心文件:**
- `workflow-grammar.langium`: 定义工作流程 DSL 语法
- `workflow-validator.ts`: 实现语义验证（节点约束、环路检测等）
- `workflow-model-service.ts`: 提供模型操作 API
- `workflow-serializer.ts`: 处理模型序列化和反序列化

**GLSP 服务器核心文件:**
- `workflow-diagram-server.ts`: 处理图形编辑操作
- `workflow-model-factory.ts`: 语义模型到图形模型的转换
- `workflow-operations/`: 各种图形操作的处理器

**前端核心文件:**
- `workflow-diagram-widget.ts`: 主要的图形编辑器界面
- `workflow-palette.ts`: 节点创建工具面板
- `node-properties-form.tsx`: 节点属性编辑表单

### 3. 数据迁移策略

为了从数据建模转换到工作流程建模，需要：

1. **保留基础架构**: 保持 Langium Document Store 作为核心数据存储
2. **替换语法定义**: 将数据建模语法替换为工作流程建模语法
3. **更新类型系统**: 定义新的工作流程相关类型和接口
4. **迁移配置**: 更新项目配置以支持新的文件扩展名和语法高亮

### 4. 向后兼容性

虽然这是一个重大的功能转换，但需要考虑：

1. **项目结构兼容**: 保持现有的项目管理和版本控制功能
2. **扩展机制兼容**: 保持现有的扩展和插件机制
3. **配置兼容**: 尽可能保持现有的配置文件格式

## 部署和集成

### 1. 开发环境设置

```bash
# 安装依赖
yarn install

# 生成语言服务器
yarn langium:generate

# 构建所有包
yarn build

# 启动开发服务器
yarn start:electron  # 桌面版
yarn start:browser   # 浏览器版
```

### 2. 测试环境

```bash
# 运行单元测试
yarn test

# 运行基于属性的测试
yarn test:property

# 运行端到端测试
yarn ui-test
```

### 3. 生产部署

保持现有的部署流程：
- 桌面应用: Electron 打包为各平台安装包
- 浏览器版本: 静态资源部署到 Web 服务器
- 语言服务器: 可独立部署为微服务

## 风险和缓解措施

### 技术风险

1. **性能风险**: 大型工作流程模型可能影响性能
   - 缓解: 实现懒加载和虚拟化渲染
   - 缓解: 优化图形渲染算法

2. **复杂性风险**: 决策表和并发流程增加系统复杂性
   - 缓解: 模块化设计，独立的验证器
   - 缓解: 全面的单元测试和集成测试

3. **兼容性风险**: 与现有 Theia 生态系统的兼容性
   - 缓解: 保持现有的扩展接口
   - 缓解: 渐进式迁移策略

### 用户体验风险

1. **学习曲线**: 用户需要学习新的 DSL 语法
   - 缓解: 提供详细的文档和示例
   - 缓解: 实现智能的代码补全和错误提示

2. **功能缺失**: 用户可能期望更多 BPMN 标准功能
   - 缓解: 明确功能范围和路线图
   - 缓解: 提供扩展机制支持自定义功能

### 项目风险

1. **开发时间**: 大规模重构可能超出预期时间
   - 缓解: 分阶段实施，优先核心功能
   - 缓解: 并行开发不同组件

2. **质量风险**: 快速开发可能影响代码质量
   - 缓解: 严格的代码审查流程
   - 缓解: 自动化测试和持续集成

## 后续扩展计划

### 短期扩展 (3-6个月)

1. **BPMN 导入导出**: 支持标准 BPMN 2.0 格式
2. **流程执行引擎**: 基本的流程执行和状态跟踪
3. **更多节点类型**: 定时器、消息、信号等事件节点
4. **高级决策表**: 支持更复杂的决策逻辑和表达式

### 中期扩展 (6-12个月)

1. **流程监控**: 实时流程执行监控和分析
2. **版本管理**: 流程版本控制和变更管理
3. **协作功能**: 多用户协作编辑
4. **API 集成**: 与外部系统的 API 集成

### 长期扩展 (1年以上)

1. **AI 辅助**: 智能流程优化建议
2. **云端部署**: 完整的云端工作流程平台
3. **移动端支持**: 移动设备上的流程查看和审批
4. **企业集成**: 与企业系统的深度集成

这个设计为将 CrossModel 改造为功能完整的业务流程建模应用提供了全面的技术方案，保持了原有架构的优势同时引入了工作流程建模的专业功能。