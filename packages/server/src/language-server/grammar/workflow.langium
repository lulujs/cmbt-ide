/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 * 
 * Workflow DSL Grammar for Business Process Modeling
 * 工作流程 DSL 语法定义
 ********************************************************************************/

import 'terminals'
import 'common'

// ============================================================================
// Entry Point - 工作流程模型入口
// ============================================================================

interface WorkflowModel extends NamedObject {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    swimlanes: Swimlane[];
    metadata?: WorkflowMetadata;
}

WorkflowModel returns WorkflowModel:
    'workflow' ':'
        INDENT
            NamedObjectFragment
            ('metadata' ':'
                INDENT
                    metadata=WorkflowMetadata
                DEDENT
            )?
            ('nodes' ':'
                INDENT
                    (LIST_ITEM nodes+=WorkflowNode)+
                DEDENT
            )?
            ('edges' ':'
                INDENT
                    (LIST_ITEM edges+=WorkflowEdge)+
                DEDENT
            )?
            ('swimlanes' ':'
                INDENT
                    (LIST_ITEM swimlanes+=Swimlane)+
                DEDENT
            )?
        DEDENT
;

// ============================================================================
// Metadata - 工作流程元数据
// ============================================================================

interface WorkflowMetadata {
    version?: string;
    author?: string;
    tags: string[];
}

WorkflowMetadata returns WorkflowMetadata:
    'version' ':' version=STRING
    ('author' ':' author=STRING)?
    ('tags' ':'
        INDENT
            (LIST_ITEM tags+=STRING)+
        DEDENT
    )?
;

// ============================================================================
// Position - 节点位置
// ============================================================================

interface Position {
    x: number;
    y: number;
}

Position returns Position:
    'x' ':' x=NUMBER
    'y' ':' y=NUMBER
;

// ============================================================================
// Nodes - 工作流程节点
// ============================================================================

interface WorkflowNode extends NamedObject {
    nodeType: string;
    position?: Position;
    testData: TestDataItem[];
    automationActions: AutomationActionItem[];
}

WorkflowNode returns WorkflowNode:
    BeginNode | EndNode | ExceptionNode | ProcessNode | 
    DecisionNode | DecisionTableNode | SubprocessNode | 
    ConcurrentNode | AutoNode | ApiNode;

// ============================================================================
// Begin Node - 开始节点 (没有预期值)
// ============================================================================

interface BeginNode extends WorkflowNode {
}

BeginNode returns BeginNode:
    nodeType='begin' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

// ============================================================================
// End Node - 结束节点 (带有预期值)
// ============================================================================

interface EndNode extends WorkflowNode {
    expectedValue?: string;
}

EndNode returns EndNode:
    nodeType='end' ':'
        INDENT
            NamedObjectFragment
            ('expectedValue' ':' expectedValue=STRING)?
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

// ============================================================================
// Exception Node - 异常节点 (特殊的结束节点，带有预期值)
// ============================================================================

interface ExceptionNode extends WorkflowNode {
    expectedValue?: string;
}

ExceptionNode returns ExceptionNode:
    nodeType='exception' ':'
        INDENT
            NamedObjectFragment
            ('expectedValue' ':' expectedValue=STRING)?
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

// ============================================================================
// Process Node - 过程节点 (只允许一条出边)
// ============================================================================

interface ProcessNode extends WorkflowNode {
}

ProcessNode returns ProcessNode:
    nodeType='process' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

// ============================================================================
// Decision Node - 分支节点 (默认两条输出边，所有输出边的值不相同)
// ============================================================================

interface DecisionNode extends WorkflowNode {
    branches: BranchCondition[];
}

DecisionNode returns DecisionNode:
    nodeType='decision' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('branches' ':'
                INDENT
                    (LIST_ITEM branches+=BranchCondition)+
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

interface BranchCondition extends IdentifiedObject {
    value?: string;
    isDefault?: boolean;
}

BranchCondition returns BranchCondition:
    IdentifiedObjectFragment
    ('value' ':' value=STRING)?
    (isDefault?='isDefault' ':' ('TRUE' | 'true'))?
;

// ============================================================================
// Decision Table Node - 决策表节点 (类似Excel表格的节点，包含输出列)
// ============================================================================

interface DecisionTableNode extends WorkflowNode {
    tableData?: DecisionTableData;
}

DecisionTableNode returns DecisionTableNode:
    nodeType='decision_table' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('tableData' ':'
                INDENT
                    tableData=DecisionTableData
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

interface DecisionTableData {
    inputColumns: TableColumn[];
    outputColumns: TableColumn[];
    decisionColumns: TableColumn[];
    rows: TableRow[];
}

DecisionTableData returns DecisionTableData:
    'inputColumns' ':'
        INDENT
            (LIST_ITEM inputColumns+=TableColumn)+
        DEDENT
    ('outputColumns' ':'
        INDENT
            (LIST_ITEM outputColumns+=TableColumn)+
        DEDENT
    )?
    ('decisionColumns' ':'
        INDENT
            (LIST_ITEM decisionColumns+=TableColumn)+
        DEDENT
    )?
    ('rows' ':'
        INDENT
            (LIST_ITEM rows+=TableRow)+
        DEDENT
    )?
;

interface TableColumn extends IdentifiedObject {
    columnName?: string;
    dataType?: string;
}

TableColumn returns TableColumn:
    IdentifiedObjectFragment
    ('name' ':' columnName=STRING)?
    ('dataType' ':' dataType=STRING)?
;

interface TableRow extends IdentifiedObject {
    values: TableCellValue[];
}

TableRow returns TableRow:
    IdentifiedObjectFragment
    'values' ':'
        INDENT
            (LIST_ITEM values+=TableCellValue)+
        DEDENT
;

interface TableCellValue {
    columnId?: string;
    cellValue?: string;
}

TableCellValue returns TableCellValue:
    'column' ':' columnId=ID
    ('value' ':' cellValue=STRING)?
;

// ============================================================================
// Subprocess Node - 子流程节点 (允许嵌套指定页生成的路径)
// ============================================================================

interface SubprocessNode extends WorkflowNode {
    referencePath?: string;
}

SubprocessNode returns SubprocessNode:
    nodeType='subprocess' ':'
        INDENT
            NamedObjectFragment
            ('referencePath' ':' referencePath=STRING)?
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

// ============================================================================
// Concurrent Node - 并发节点 (支持并行处理的流程节点)
// ============================================================================

interface ConcurrentNode extends WorkflowNode {
    parallelBranches: ParallelBranch[];
}

ConcurrentNode returns ConcurrentNode:
    nodeType='concurrent' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('parallelBranches' ':'
                INDENT
                    (LIST_ITEM parallelBranches+=ParallelBranch)+
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

interface ParallelBranch extends IdentifiedObject {
    branchName?: string;
    nodeRefs: NodeReference[];
}

ParallelBranch returns ParallelBranch:
    IdentifiedObjectFragment
    ('name' ':' branchName=STRING)?
    ('nodes' ':'
        INDENT
            (LIST_ITEM nodeRefs+=NodeReference)+
        DEDENT
    )?
;

interface NodeReference {
    node: @WorkflowNode;
}

NodeReference returns NodeReference:
    'ref' ':' node=[WorkflowNode:IDReference]
;

// ============================================================================
// Auto Node - Auto节点 (用于自动化对接的节点)
// ============================================================================

interface AutoNode extends WorkflowNode {
    automationConfig: AutomationConfig[];
}

AutoNode returns AutoNode:
    nodeType='auto' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('automationConfig' ':'
                INDENT
                    (LIST_ITEM automationConfig+=AutomationConfig)+
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

interface AutomationConfig {
    key?: string;
    configValue?: string;
}

AutomationConfig returns AutomationConfig:
    'key' ':' key=STRING
    ('value' ':' configValue=STRING)?
;

// ============================================================================
// API Node - API节点 (用于绑定统一自动化平台单接口实例的节点)
// ============================================================================

interface ApiNode extends WorkflowNode {
    apiEndpoint?: string;
    apiConfig: ApiConfigItem[];
}

ApiNode returns ApiNode:
    nodeType='api' ':'
        INDENT
            NamedObjectFragment
            ('apiEndpoint' ':' apiEndpoint=STRING)?
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('apiConfig' ':'
                INDENT
                    (LIST_ITEM apiConfig+=ApiConfigItem)+
                DEDENT
            )?
            TestDataFragment?
            AutomationActionsFragment?
        DEDENT
;

interface ApiConfigItem {
    key?: string;
    configValue?: string;
}

ApiConfigItem returns ApiConfigItem:
    'key' ':' key=STRING
    ('value' ':' configValue=STRING)?
;

// ============================================================================
// Edges - 工作流程边
// ============================================================================

interface WorkflowEdge extends IdentifiedObject {
    source: @WorkflowNode;
    target: @WorkflowNode;
    condition?: string;
    edgeValue?: string;
    dataType?: string;
    testData: TestDataItem[];
    automationActions: AutomationActionItem[];
}

WorkflowEdge returns WorkflowEdge:
    'edge' ':'
        INDENT
            IdentifiedObjectFragment
            'source' ':' source=[WorkflowNode:IDReference]
            'target' ':' target=[WorkflowNode:IDReference]
            ('condition' ':' condition=STRING)?
            ('value' ':' edgeValue=STRING)?
            ('dataType' ':' dataType=STRING)?
            EdgeTestDataFragment?
            EdgeAutomationActionsFragment?
        DEDENT
;

fragment EdgeTestDataFragment returns WorkflowEdge:
    'testData' ':'
        INDENT
            (LIST_ITEM testData+=TestDataItem)+
        DEDENT
;

fragment EdgeAutomationActionsFragment returns WorkflowEdge:
    'automationActions' ':'
        INDENT
            (LIST_ITEM automationActions+=AutomationActionItem)+
        DEDENT
;

// ============================================================================
// Swimlanes - 泳道
// ============================================================================

interface Swimlane extends NamedObject {
    position?: Position;
    width?: number;
    height?: number;
    color?: string;
    containedNodes: SwimlaneNodeRef[];
}

Swimlane returns Swimlane:
    'swimlane' ':'
        INDENT
            NamedObjectFragment
            ('position' ':'
                INDENT
                    position=Position
                DEDENT
            )?
            ('width' ':' width=NUMBER)?
            ('height' ':' height=NUMBER)?
            ('color' ':' color=STRING)?
            ('containedNodes' ':'
                INDENT
                    (LIST_ITEM containedNodes+=SwimlaneNodeRef)+
                DEDENT
            )?
        DEDENT
;

interface SwimlaneNodeRef {
    node: @WorkflowNode;
}

SwimlaneNodeRef returns SwimlaneNodeRef:
    'ref' ':' node=[WorkflowNode:IDReference]
;

// ============================================================================
// Test Data - 测试数据
// ============================================================================

interface TestDataItem extends IdentifiedObject {
    testName?: string;
    edgeBinding?: string;
    inputData: TestDataEntry[];
    expectedOutput: TestDataEntry[];
}

fragment TestDataFragment returns WorkflowNode:
    'testData' ':'
        INDENT
            (LIST_ITEM testData+=TestDataItem)+
        DEDENT
;

TestDataItem returns TestDataItem:
    IdentifiedObjectFragment
    ('name' ':' testName=STRING)?
    ('edgeBinding' ':' edgeBinding=STRING)?
    ('inputData' ':'
        INDENT
            (LIST_ITEM inputData+=TestDataEntry)+
        DEDENT
    )?
    ('expectedOutput' ':'
        INDENT
            (LIST_ITEM expectedOutput+=TestDataEntry)+
        DEDENT
    )?
;

interface TestDataEntry {
    key?: string;
    entryValue?: string;
}

TestDataEntry returns TestDataEntry:
    'key' ':' key=STRING
    ('value' ':' entryValue=STRING)?
;

// ============================================================================
// Automation Actions - 自动化动作
// ============================================================================

interface AutomationActionItem extends IdentifiedObject {
    actionName?: string;
    actionType?: string;
    edgeBinding?: string;
    configuration: AutomationConfigEntry[];
}

fragment AutomationActionsFragment returns WorkflowNode:
    'automationActions' ':'
        INDENT
            (LIST_ITEM automationActions+=AutomationActionItem)+
        DEDENT
;

AutomationActionItem returns AutomationActionItem:
    IdentifiedObjectFragment
    ('name' ':' actionName=STRING)?
    ('actionType' ':' actionType=AutomationActionType)?
    ('edgeBinding' ':' edgeBinding=STRING)?
    ('configuration' ':'
        INDENT
            (LIST_ITEM configuration+=AutomationConfigEntry)+
        DEDENT
    )?
;

AutomationActionType returns string:
    'api_call' | 'script' | 'webhook';

interface AutomationConfigEntry {
    key?: string;
    entryValue?: string;
}

AutomationConfigEntry returns AutomationConfigEntry:
    'key' ':' key=STRING
    ('value' ':' entryValue=STRING)?
;
