import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { CircularNodeView } from './base/circular-node-view';

/**
 * 结束节点视图
 * 
 * 渲染为红色圆形，带有停止图标
 */
@injectable()
export class EndNodeView extends CircularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const radius = this.getRadius(node);
        const center = this.getCenter(node);
        
        return svg('g', {
            class: 'end-node'
        }, [
            // 外圆
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius,
                class: 'end-node-circle'
            }),
            
            // 内圆（稍小）
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius - 2,
                class: 'end-node-inner'
            }),
            
            // 停止图标（正方形）
            svg('rect', {
                x: center.x - radius * 0.3,
                y: center.y - radius * 0.3,
                width: radius * 0.6,
                height: radius * 0.6,
                class: 'end-node-icon'
            }),
            
            // 节点标签
            ...this.renderNodeLabel(node, center, radius)
        ]);
    }
    
    /**
     * 渲染节点标签
     */
    private renderNodeLabel(
        node: GNode, 
        center: { x: number, y: number }, 
        radius: number
    ): VNode[] {
        const label = node.children.find(child => child.type === 'label:node');
        if (!label) return [];
        
        return [
            svg('text', {
                x: center.x,
                y: center.y + radius + 20,
                'text-anchor': 'middle',
                class: 'node-label'
            }, (label as any).text || '结束')
        ];
    }
}