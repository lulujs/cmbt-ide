import { GEdge, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

/**
 * 工作流程边视图
 * 
 * 渲染标准的工作流程连接线
 */
@injectable()
export class WorkflowEdgeView {
    
    render(edge: GEdge, context: RenderingContext): VNode {
        const path = this.createEdgePath(edge);
        
        return svg('g', {
            class: 'workflow-edge'
        }, [
            // 主路径
            svg('path', {
                d: path,
                class: 'edge-path',
                fill: 'none',
                stroke: '#666',
                'stroke-width': 2,
                'marker-end': 'url(#arrowhead)'
            }),
            
            // 选择区域（更宽的透明路径，便于选择）
            svg('path', {
                d: path,
                class: 'edge-selection-area',
                fill: 'none',
                stroke: 'transparent',
                'stroke-width': 10
            }),
            
            // 渲染边标签
            ...this.renderEdgeLabels(edge)
        ]);
    }
    
    /**
     * 创建边的路径
     */
    private createEdgePath(edge: GEdge): string {
        const routingPoints = edge.routingPoints || [];
        
        if (routingPoints.length === 0) {
            // 直线连接
            return this.createStraightPath(edge);
        } else {
            // 带路由点的路径
            return this.createRoutedPath(edge, routingPoints);
        }
    }
    
    /**
     * 创建直线路径
     */
    private createStraightPath(edge: GEdge): string {
        const source = this.getEdgeEndpoint(edge, 'source');
        const target = this.getEdgeEndpoint(edge, 'target');
        
        return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }
    
    /**
     * 创建带路由点的路径
     */
    private createRoutedPath(edge: GEdge, routingPoints: { x: number, y: number }[]): string {
        const source = this.getEdgeEndpoint(edge, 'source');
        const target = this.getEdgeEndpoint(edge, 'target');
        
        let path = `M ${source.x} ${source.y}`;
        
        // 添加路由点
        for (const point of routingPoints) {
            path += ` L ${point.x} ${point.y}`;
        }
        
        // 连接到目标
        path += ` L ${target.x} ${target.y}`;
        
        return path;
    }
    
    /**
     * 获取边的端点坐标
     */
    private getEdgeEndpoint(edge: GEdge, type: 'source' | 'target'): { x: number, y: number } {
        // 这里应该根据实际的节点位置和大小计算连接点
        // 暂时返回模拟坐标
        if (type === 'source') {
            return { x: 0, y: 0 };
        } else {
            return { x: 100, y: 100 };
        }
    }
    
    /**
     * 渲染边标签
     */
    private renderEdgeLabels(edge: GEdge): VNode[] {
        const labels = edge.children.filter(child => child.type === 'label:edge');
        
        return labels.map(label => {
            const position = this.calculateLabelPosition(edge, label as any);
            
            return svg('g', {
                transform: `translate(${position.x}, ${position.y})`
            }, [
                // 标签背景
                svg('rect', {
                    x: -20,
                    y: -8,
                    width: 40,
                    height: 16,
                    rx: 3,
                    ry: 3,
                    class: 'edge-label-bg'
                }),
                
                // 标签文本
                svg('text', {
                    x: 0,
                    y: 4,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: 'edge-label-text'
                }, (label as any).text || '')
            ]);
        });
    }
    
    /**
     * 计算标签位置
     */
    private calculateLabelPosition(edge: GEdge, label: any): { x: number, y: number } {
        const routingPoints = edge.routingPoints || [];
        const source = this.getEdgeEndpoint(edge, 'source');
        const target = this.getEdgeEndpoint(edge, 'target');
        
        if (routingPoints.length === 0) {
            // 直线的中点
            return {
                x: (source.x + target.x) / 2,
                y: (source.y + target.y) / 2 - 10
            };
        } else {
            // 路由点的中点
            const midIndex = Math.floor(routingPoints.length / 2);
            const midPoint = routingPoints[midIndex];
            return {
                x: midPoint.x,
                y: midPoint.y - 10
            };
        }
    }
}