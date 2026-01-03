# 需求文档

## 介绍

将 CrossModel 数据建模应用改造为业务流程建模应用，支持工作流程建模并实现自定义 DSL 语言。该系统将保留原有的三种建模方式（文本、图形、表单），但重新设计为支持业务流程建模的核心概念和功能。

## 术语表

- **Process_Modeling_System**: 业务流程建模系统
- **Workflow_Engine**: 工作流引擎
- **DSL_Parser**: DSL 解析器
- **Node_Manager**: 节点管理器
- **Edge_Manager**: 边管理器
- **Decision_Table**: 决策表
- **Swimlane**: 泳道
- **Test_Data**: 测试数据
- **Automation_Action**: 自动化动作
- **Reference_Node**: 引用节点
- **Concurrent_Process**: 并发流程

## 需求

### 需求 1: 基础节点管理

**用户故事:** 作为流程设计师，我想要创建和管理各种类型的流程节点，以便构建完整的业务工作流程。

#### 验收标准

1. WHEN 用户创建开始节点 THEN THE Process_Modeling_System SHALL 创建一个没有预期值的开始节点
2. WHEN 用户创建结束节点 THEN THE Process_Modeling_System SHALL 创建一个带有预期值的结束节点
3. WHEN 用户创建异常节点 THEN THE Process_Modeling_System SHALL 创建一个特殊的结束节点，带有预期值
4. WHEN 用户创建过程节点 THEN THE Process_Modeling_System SHALL 创建一个只允许一条出边的过程节点
5. WHEN 用户创建分支节点 THEN THE Process_Modeling_System SHALL 创建一个默认两条输出边的分支节点
6. WHEN 用户为分支节点添加多条输出边 THEN THE Process_Modeling_System SHALL 确保所有输出边的值不相同
7. WHEN 用户创建决策表节点 THEN THE Process_Modeling_System SHALL 创建一个类似 Excel 表格的节点，包含输出列
8. WHEN 用户创建子流程节点 THEN THE Process_Modeling_System SHALL 允许嵌套指定页生成的路径
9. WHEN 用户创建并发节点 THEN THE Process_Modeling_System SHALL 创建支持并行处理的流程节点
10. WHEN 用户创建 Auto 节点 THEN THE Process_Modeling_System SHALL 创建用于自动化对接的节点
11. WHEN 用户创建 API 节点 THEN THE Process_Modeling_System SHALL 创建用于绑定统一自动化平台单接口实例的节点

### 需求 2: 决策表功能

**用户故事:** 作为流程设计师，我想要使用决策表功能，以便处理复杂的多条件决策逻辑。

#### 验收标准

1. WHEN 用户创建决策表节点 THEN THE Process_Modeling_System SHALL 提供默认的决策表数据
2. WHEN 用户导入决策表数据 THEN THE Process_Modeling_System SHALL 根据输出字段值创建相应的出边
3. WHEN 用户编辑决策表数据 THEN THE Process_Modeling_System SHALL 验证决策列内容不能完全相同
4. WHEN 决策表缺少决策内容列 THEN THE Process_Modeling_System SHALL 阻止保存并提示错误
5. WHEN 决策表的决策列内容完全相同 THEN THE Process_Modeling_System SHALL 阻止保存并提示错误

### 需求 3: 泳道功能

**用户故事:** 作为流程设计师，我想要使用泳道功能，以便将相关的节点进行分组管理。

#### 验收标准

1. WHEN 用户创建泳道 THEN THE Process_Modeling_System SHALL 创建一个可容纳节点的泳道容器
2. WHEN 用户将节点拖入泳道 THEN THE Process_Modeling_System SHALL 将节点归属到该泳道
3. WHEN 用户移动泳道 THEN THE Process_Modeling_System SHALL 同时移动泳道内的所有节点
4. WHEN 用户删除泳道 THEN THE Process_Modeling_System SHALL 询问是否同时删除泳道内的节点

### 需求 4: 节点引用功能

**用户故事:** 作为流程设计师，我想要创建节点引用，以便复用已有的节点配置。

#### 验收标准

1. WHEN 用户右键点击支持引用的节点（开始、结束、流程、分支、决策表、自动化、异常）THEN THE Process_Modeling_System SHALL 显示创建引用选项
2. WHEN 用户选择单个节点创建引用 THEN THE Process_Modeling_System SHALL 创建一个克隆节点
3. WHEN 用户选择多个节点批量创建引用 THEN THE Process_Modeling_System SHALL 为每个节点创建对应的克隆节点
4. WHEN 用户编辑引用节点 THEN THE Process_Modeling_System SHALL 只允许修改节点名称和步骤显示按钮
5. WHEN 用户尝试修改引用节点的其他数据 THEN THE Process_Modeling_System SHALL 阻止修改并保持与源节点一致

### 需求 5: 测试数据和自动化动作

**用户故事:** 作为流程设计师，我想要为每个节点配置测试数据和自动化动作，以便支持流程的测试和自动化执行。

#### 验收标准

1. WHEN 用户为节点配置测试数据 THEN THE Process_Modeling_System SHALL 允许为每个输出边绑定测试数据
2. WHEN 用户为节点配置自动化动作 THEN THE Process_Modeling_System SHALL 允许为每个输出边绑定自动化动作
3. WHEN 用户执行测试数据 THEN THE Process_Modeling_System SHALL 按照绑定的输出边执行相应的测试逻辑
4. WHEN 用户执行自动化动作 THEN THE Process_Modeling_System SHALL 按照绑定的输出边执行相应的自动化逻辑

### 需求 6: 并发流程功能

**用户故事:** 作为流程设计师，我想要使用并发流程功能，以便处理无顺序要求的并行业务逻辑。

#### 验收标准

1. WHEN 用户创建并发流程 THEN THE Process_Modeling_System SHALL 确保内部节点从并发开始流向并发结束
2. WHEN 并发流程包含环路 THEN THE Process_Modeling_System SHALL 阻止保存并提示错误
3. WHEN 并发流程包含开始或结束节点 THEN THE Process_Modeling_System SHALL 阻止保存并提示错误
4. WHEN 用户在并发流程中添加节点 THEN THE Process_Modeling_System SHALL 验证节点连接的合法性

### 需求 7: DSL 语言支持

**用户故事:** 作为开发者，我想要使用自定义的 DSL 语言，以便通过文本方式定义业务流程。

#### 验收标准

1. WHEN 用户使用 DSL 定义开始节点 THEN THE DSL_Parser SHALL 解析并创建开始节点
2. WHEN 用户使用 DSL 定义结束节点 THEN THE DSL_Parser SHALL 解析并创建带预期值的结束节点
3. WHEN 用户使用 DSL 定义过程节点 THEN THE DSL_Parser SHALL 解析并创建过程节点
4. WHEN 用户使用 DSL 定义分支节点 THEN THE DSL_Parser SHALL 解析并创建分支节点及其输出边
5. WHEN 用户使用 DSL 定义决策表节点 THEN THE DSL_Parser SHALL 解析并创建决策表节点
6. WHEN 用户使用 DSL 定义子流程节点 THEN THE DSL_Parser SHALL 解析并创建子流程节点
7. WHEN 用户使用 DSL 定义并发节点 THEN THE DSL_Parser SHALL 解析并创建并发节点
8. WHEN 用户使用 DSL 定义 Auto 节点 THEN THE DSL_Parser SHALL 解析并创建 Auto 节点
9. WHEN 用户使用 DSL 定义 API 节点 THEN THE DSL_Parser SHALL 解析并创建 API 节点
10. WHEN 用户使用 DSL 定义泳道 THEN THE DSL_Parser SHALL 解析并创建泳道结构
11. FOR ALL 有效的工作流程模型 THEN THE DSL_Parser SHALL 支持序列化后再解析产生等价模型（往返一致性）

### 需求 8: 三种建模方式

**用户故事:** 作为用户，我想要保留原有的三种建模方式，以便根据不同场景选择最适合的建模方法。

#### 验收标准

1. WHEN 用户选择文本建模 THEN THE Process_Modeling_System SHALL 提供基于 DSL 的文本编辑器
2. WHEN 用户选择图形建模 THEN THE Process_Modeling_System SHALL 提供可视化的流程图编辑器
3. WHEN 用户选择表单建模 THEN THE Process_Modeling_System SHALL 提供结构化的表单编辑器
4. WHEN 用户在不同建模方式间切换 THEN THE Process_Modeling_System SHALL 保持数据同步
5. WHEN 用户在一种建模方式中修改流程 THEN THE Process_Modeling_System SHALL 实时更新其他建模方式的显示

### 需求 9: 项目管理功能

**用户故事:** 作为系统管理员，我想要保留原有的项目管理功能，以便继续使用版本控制和多项目管理能力。

#### 验收标准

1. WHEN 用户创建新的流程项目 THEN THE Process_Modeling_System SHALL 创建项目结构并初始化版本控制
2. WHEN 用户保存流程模型 THEN THE Process_Modeling_System SHALL 将更改提交到版本控制系统
3. WHEN 用户查看历史版本 THEN THE Process_Modeling_System SHALL 显示流程模型的版本历史
4. WHEN 用户管理多个项目 THEN THE Process_Modeling_System SHALL 支持项目间的隔离和依赖管理
5. WHEN 用户导入导出流程模型 THEN THE Process_Modeling_System SHALL 支持标准格式的导入导出功能