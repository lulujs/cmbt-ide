// GLSP 工作流程渲染配置示例
import {
    Dimension,
    GEdge,
    GLabel,
    GModelFactory,
    GModelRoot,
    GNode,
    GPort,
    Point
} from '@eclipse-glsp/server';
import { WorkflowEdge, WorkflowModel, WorkflowNode } from '../language-server/generated/ast';

/**
 * GLSP 模型工厂 - 将 DSL 模型转换为 GLSP 图形模型
 */
export class WorkflowGModelFactory implements GModelFactory {
    
    /**
     * 创建 GLSP 图形模型
     */
    create(model: WorkflowModel): GModelRoot {
        const root = GModelRoot.builder()
            .id(model.id)
            .type('graph')
            .canvasBounds({ x: 0, y: 0, width: 2000, height: 1500 })
            .build();

        // 渲染所有节点
        for (const node of model.nodes) {
            const gNode = this.createGNode(node);
            root.children.push(gNode);
        }

        // 渲染所有边
        for (const edge of model.edges) {
            const gEdge = this.createGEdge(edge, model);
            root.children.push(gEdge);
        }

        // 渲染泳道（如果存在）
        if (model.swimlanes) {
            for (const swimlane of model.swimlanes) {
                const gSwimlane = this.createGSwimlane(swimlane);
                root.children.push(gSwimlane);
            }
        }

        return root;
    }

    /**
     * 创建节点的图形表示
     */
    private createGNode(node: WorkflowNode): GNode {
        const nodeType = this.getNodeType(node);
        const size = this.getNodeSize(node);
        const position = node.position ? 
            { x: node.position.x, y: node.position.y } : 
            { x: 100, y: 100 };

        const nodeBuilder = GNode.builder()
            .id(node.id)
            .type(nodeType)
            .position(position)
            .size(size)
            .addCssClass(this.getNodeCssClass(node));

        // 添加节点标签
        const label = GLabel.builder()
            .id(`${node.id}_label`)
            .type('label:node')
            .text(node.name)
            .position(this.getLabelPosition(nodeType, size))
            .build();
        
        nodeBuilder.add(label);

        // 为节点添加连接端口
        const ports = this.createNodePorts(node, nodeType);
        ports.forEach(port => nodeBuilder.add(port));

        // 添加特殊属性（如决策表图标）
        if (node.$type === 'DecisionTableNode') {
            const icon = this.createDecisionTableIcon(node.id);
            nodeBuilder.add(icon);
        }

        return nodeBuilder.build();
    }

    /**
     * 创建边的图形表示
     */
    private createGEdge(edge: WorkflowEdge, model: WorkflowModel): GEdge {
        const edgeBuilder = GEdge.builder()
            .id(edge.id)
            .type('edge:workflow')
            .sourceId(edge.source)
            .targetId(edge.target)
            .addCssClass('workflow-edge');

        // 添加边标签（如果有条件值）
        if (edge.value) {
            const label = GLabel.builder()
                .id(`${edge.id}_label`)
                .type('label:edge')
                .text(edge.value)
                .edgePlacement({
                    position: 0.5,
                    side: 'top',
                    rotate: false
                })
                .build();
            
            edgeBuilder.add(label);
        }

        // 设置路由点（如果有）
        if (edge.routingPoints && edge.routingPoints.length > 0) {
            edgeBuilder.routingPoints(edge.routingPoints);
        }

        return edgeBuilder.build();
    }

    /**
     * 创建泳道的图形表示
     */
    private createGSwimlane(swimlane: any): GNode {
        const swimlaneBuilder = GNode.builder()
            .id(swimlane.id)
            .type('swimlane')
            .position({ x: swimlane.position.x, y: swimlane.position.y })
            .size({ width: swimlane.width, height: swimlane.height })
            .addCssClass('swimlane')
            .addCssClass(`swimlane-${swimlane.id}`);

        // 添加泳道标题
        const title = GLabel.builder()
            .id(`${swimlane.id}_title`)
            .type('label:swimlane')
            .text(swimlane.name)
            .position({ x: 10, y: 10 })
            .build();
        
        swimlaneBuilder.add(title);

        return swimlaneBuilder.build();
    }

    /**
     * 获取节点类型
     */
    private getNodeType(node: WorkflowNode): string {
        const typeMap = {
            'BeginNode': 'node:begin',
            'EndNode': 'node:end',
            'ExceptionNode': 'node:exception',
            'ProcessNode': 'node:process',
            'DecisionNode': 'node:decision',
            'DecisionTableNode': 'node:decision-table',
            'ConcurrentNode': 'node:concurrent',
            'SubprocessNode': 'node:subprocess',
            'AutoNode': 'node:auto',
            'ApiNode': 'node:api'
        };
        
        return typeMap[node.$type] || 'node:default';
    }

    /**
     * 获取节点尺寸
     */
    private getNodeSize(node: WorkflowNode): Dimension {
        const sizeMap = {
            'BeginNode': { width: 60, height: 60 },
            'EndNode': { width: 60, height: 60 },
            'ExceptionNode': { width: 60, height: 60 },
            'ProcessNode': { width: 120, height: 60 },
            'DecisionNode': { width: 100, height: 80 },
            'DecisionTableNode': { width: 140, height: 80 },
            'ConcurrentNode': { width: 30, height: 120 },
            'SubprocessNode': { width: 140, height: 80 },
            'AutoNode': { width: 120, height: 60 },
            'ApiNode': { width: 120, height: 60 }
        };
        
        return sizeMap[node.$type] || { width: 120, height: 60 };
    }

    /**
     * 获取节点CSS类
     */
    private getNodeCssClass(node: WorkflowNode): string {
        const classMap = {
            'BeginNode': 'begin-node',
            'EndNode': 'end-node',
            'ExceptionNode': 'exception-node',
            'ProcessNode': 'process-node',
            'DecisionNode': 'decision-node',
            'DecisionTableNode': 'decision-table-node',
            'ConcurrentNode': 'concurrent-node',
            'SubprocessNode': 'subprocess-node',
            'AutoNode': 'auto-node',
            'ApiNode': 'api-node'
        };
        
        return classMap[node.$type] || 'default-node';
    }

    /**
     * 获取标签位置
     */
    private getLabelPosition(nodeType: string, size: Dimension): Point {
        if (nodeType === 'node:begin' || nodeType === 'node:end' || nodeType === 'node:exception') {
            // 圆形节点，标签居中
            return { x: size.width / 2, y: size.height / 2 + 4 };
        } else if (nodeType === 'node:decision') {
            // 菱形节点，标签居中
            return { x: size.width / 2, y: size.height / 2 + 4 };
        } else {
            // 矩形节点，标签居中
            return { x: size.width / 2, y: size.height / 2 + 4 };
        }
    }

    /**
     * 创建节点连接端口
     */
    private createNodePorts(node: WorkflowNode, nodeType: string): GPort[] {
        const ports: GPort[] = [];
        const size = this.getNodeSize(node);

        // 输入端口（除了开始节点）
        if (nodeType !== 'node:begin') {
            ports.push(
                GPort.builder()
                    .id(`${node.id}_input`)
                    .type('port:input')
                    .position({ x: 0, y: size.height / 2 })
                    .build()
            );
        }

        // 输出端口（除了结束节点和异常节点）
        if (nodeType !== 'node:end' && nodeType !== 'node:exception') {
            ports.push(
                GPort.builder()
                    .id(`${node.id}_output`)
                    .type('port:output')
                    .position({ x: size.width, y: size.height / 2 })
                    .build()
            );
        }

        // 决策节点的多个输出端口
        if (nodeType === 'node:decision' && node.$type === 'DecisionNode') {
            const branches = (node as any).branches || [];
            branches.forEach((branch: any, index: number) => {
                ports.push(
                    GPort.builder()
                        .id(`${node.id}_output_${branch.id}`)
                        .type('port:output')
                        .position({ 
                            x: size.width, 
                            y: (size.height / (branches.length + 1)) * (index + 1) 
                        })
                        .build()
                );
            });
        }

        return ports;
    }

    /**
     * 创建决策表图标
     */
    private createDecisionTableIcon(nodeId: string): GNode {
        return GNode.builder()
            .id(`${nodeId}_table_icon`)
            .type('icon:table')
            .position({ x: 5, y: 5 })
            .size({ width: 16, height: 16 })
            .addCssClass('table-icon')
            .build();
    }
}

/**
 * 节点类型配置
 */
export const NODE_TYPE_CONFIG = {
    'node:begin': {
        name: '开始节点',
        icon: '●',
        color: '#4caf50',
        shape: 'circle'
    },
    'node:end': {
        name: '结束节点',
        icon: '●',
        color: '#f44336',
        shape: 'circle'
    },
    'node:exception': {
        name: '异常节点',
        icon: '⚠',
        color: '#ff5722',
        shape: 'circle'
    },
    'node:process': {
        name: '处理节点',
        icon: '□',
        color: '#2196f3',
        shape: 'rectangle'
    },
    'node:decision': {
        name: '决策节点',
        icon: '◇',
        color: '#ffeb3b',
        shape: 'diamond'
    },
    'node:decision-table': {
        name: '决策表节点',
        icon: '⊞',
        color: '#ff9800',
        shape: 'rectangle'
    },
    'node:concurrent': {
        name: '并行节点',
        icon: '‖',
        color: '#4caf50',
        shape: 'rectangle'
    },
    'node:subprocess': {
        name: '子流程节点',
        icon: '⊕',
        color: '#9c27b0',
        shape: 'rectangle'
    },
    'node:auto': {
        name: '自动化节点',
        icon: '⚙',
        color: '#607d8b',
        shape: 'rectangle'
    },
    'node:api': {
        name: 'API节点',
        icon: '☁',
        color: '#795548',
        shape: 'rectangle'
    }
};

/**
 * 工具栏配置
 */
export const TOOLBAR_CONFIG = [
    {
        id: 'select',
        name: '选择',
        icon: '↖',
        action: 'select-tool'
    },
    {
        id: 'create-begin',
        name: '开始节点',
        icon: '●',
        action: 'create-node',
        nodeType: 'node:begin'
    },
    {
        id: 'create-process',
        name: '处理节点',
        icon: '□',
        action: 'create-node',
        nodeType: 'node:process'
    },
    {
        id: 'create-decision',
        name: '决策节点',
        icon: '◇',
        action: 'create-node',
        nodeType: 'node:decision'
    },
    {
        id: 'create-decision-table',
        name: '决策表节点',
        icon: '⊞',
        action: 'create-node',
        nodeType: 'node:decision-table'
    },
    {
        id: 'create-end',
        name: '结束节点',
        icon: '●',
        action: 'create-node',
        nodeType: 'node:end'
    },
    {
        id: 'create-edge',
        name: '连接线',
        icon: '→',
        action: 'create-edge'
    },
    {
        id: 'delete',
        name: '删除',
        icon: '🗑',
        action: 'delete-element'
    }
];

/**
 * 渲染主题配置
 */
export const RENDERING_THEME = {
    colors: {
        primary: '#2196f3',
        secondary: '#ff9800',
        success: '#4caf50',
        warning: '#ffeb3b',
        error: '#f44336',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333'
    },
    fonts: {
        nodeLabel: {
            family: 'Arial, sans-serif',
            size: '12px',
            weight: 'bold'
        },
        edgeLabel: {
            family: 'Arial, sans-serif',
            size: '10px',
            weight: 'normal'
        }
    },
    spacing: {
        nodeMargin: 20,
        edgeMargin: 10,
        labelPadding: 4
    }
};