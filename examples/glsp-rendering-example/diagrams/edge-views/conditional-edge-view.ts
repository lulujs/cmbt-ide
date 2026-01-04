import { GEdge, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { WorkflowEdgeView } from './workflow-edge-view';

/**
 * 条件边视图
 * 
 * 渲染带条件标签的边，用于决策节点的输出
 */
@injectable()
export class ConditionalEdgeView extends WorkflowEdgeView {
    
    render(edge: GEdge, context: RenderingContext): VNode {
        const path = this.createEdgePath(edge);
        const isDefaultBranch = this.isDefaultBranch(edge);
        
        return svg('g', {
            class: `conditional-edge ${isDefaultBranch ? 'default-branch' : ''}`
        }, [
            // 主路径
            svg('path', {
                d: path,
                class: 'edge-path',
                fill: 'none',
                stroke: isDefaultBranch ? '#ff9800' : '#2196f3',
                'stroke-width': 2,
                'stroke-dasharray': isDefaultBranch ? '5,5' : 'none',
                'marker-end': 'url(#arrowhead-conditional)'
            }),
            
            // 选择区域
            svg('path', {
                d: path,
                class: 'edge-selection-area',
                fill: 'none',
                stroke: 'transparent',
                'stroke-width': 12
            }),
            
            // 条件标签
            ...this.renderConditionalLabel(edge),
            
            // 默认分支指示器
            ...(isDefaultBranch ? this.renderDefaultIndicator(edge) : [])
        ]);
    }
    
    /**
     * 判断是否为默认分支
     */
    private isDefaultBranch(edge: GEdge): boolean {
        const edgeData = (edge as any).edgeData;
        return edgeData?.isDefault === true;
    }
    
    /**
     * 渲染条件标签
     */
    private renderConditionalLabel(edge: GEdge): VNode[] {
        const labels = edge.children.filter(child => child.type === 'label:edge');
        
        return labels.map(label => {
            const position = this.calculateLabelPosition(edge, label as any);
            const labelText = (label as any).text || '';
            const isDefaultBranch = this.isDefaultBranch(edge);
            
            return svg('g', {
                transform: `translate(${position.x}, ${position.y})`,
                class: 'conditional-label'
            }, [
                // 标签背景
                svg('rect', {
                    x: -labelText.length * 4 - 6,
                    y: -10,
                    width: labelText.length * 8 + 12,
                    height: 20,
                    rx: 10,
                    ry: 10,
                    class: `conditional-label-bg ${isDefaultBranch ? 'default' : 'normal'}`
                }),
                
                // 标签文本
                svg('text', {
                    x: 0,
                    y: 4,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: 'conditional-label-text'
                }, labelText),
                
                // 条件图标
                svg('g', {
                    transform: `translate(${labelText.length * 4 + 15}, 0)`
                }, [
                    this.renderConditionIcon(isDefaultBranch)
                ])
            ]);
        });
    }
    
    /**
     * 渲染条件图标
     */
    private renderConditionIcon(isDefault: boolean): VNode {
        if (isDefault) {
            // 默认分支图标（星号）
            return svg('g', {
                class: 'default-icon'
            }, [
                svg('polygon', {
                    points: '0,-6 2,-2 6,-2 3,1 4,5 0,3 -4,5 -3,1 -6,-2 -2,-2',
                    fill: '#ff9800'
                })
            ]);
        } else {
            // 条件分支图标（问号）
            return svg('g', {
                class: 'condition-icon'
            }, [
                svg('circle', {
                    cx: 0,
                    cy: 0,
                    r: 6,
                    fill: '#2196f3'
                }),
                
                svg('text', {
                    x: 0,
                    y: 2,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: 'white',
                    'font-size': '8px',
                    'font-weight': 'bold'
                }, '?')
            ]);
        }
    }
    
    /**
     * 渲染默认分支指示器
     */
    private renderDefaultIndicator(edge: GEdge): VNode[] {
        const source = this.getEdgeEndpoint(edge, 'source');
        
        return [
            svg('g', {
                transform: `translate(${source.x + 10}, ${source.y - 10})`,
                class: 'default-indicator'
            }, [
                // 指示器背景
                svg('circle', {
                    cx: 0,
                    cy: 0,
                    r: 8,
                    fill: '#ff9800',
                    opacity: 0.8
                }),
                
                // "D" 字母（表示 Default）
                svg('text', {
                    x: 0,
                    y: 3,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    fill: 'white',
                    'font-size': '10px',
                    'font-weight': 'bold'
                }, 'D')
            ])
        ];
    }
    
    /**
     * 创建边的路径（重写以支持条件边的特殊样式）
     */
    protected createEdgePath(edge: GEdge): string {
        const routingPoints = edge.routingPoints || [];
        const isDefault = this.isDefaultBranch(edge);
        
        if (routingPoints.length === 0) {
            return this.createStraightConditionalPath(edge, isDefault);
        } else {
            return this.createRoutedConditionalPath(edge, routingPoints, isDefault);
        }
    }
    
    /**
     * 创建直线条件路径
     */
    private createStraightConditionalPath(edge: GEdge, isDefault: boolean): string {
        const source = this.getEdgeEndpoint(edge, 'source');
        const target = this.getEdgeEndpoint(edge, 'target');
        
        if (isDefault) {
            // 默认分支使用稍微弯曲的路径
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2 + 20;
            return `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`;
        } else {
            // 普通条件分支使用直线
            return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
        }
    }
    
    /**
     * 创建带路由点的条件路径
     */
    private createRoutedConditionalPath(
        edge: GEdge, 
        routingPoints: { x: number, y: number }[], 
        isDefault: boolean
    ): string {
        const source = this.getEdgeEndpoint(edge, 'source');
        const target = this.getEdgeEndpoint(edge, 'target');
        
        let path = `M ${source.x} ${source.y}`;
        
        // 添加路由点
        for (let i = 0; i < routingPoints.length; i++) {
            const point = routingPoints[i];
            if (isDefault && i === 0) {
                // 默认分支的第一段使用曲线
                path += ` Q ${point.x} ${point.y + 10} ${point.x} ${point.y}`;
            } else {
                path += ` L ${point.x} ${point.y}`;
            }
        }
        
        // 连接到目标
        path += ` L ${target.x} ${target.y}`;
        
        return path;
    }
}