import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { CircularNodeView } from './base/circular-node-view';

/**
 * 开始节点视图
 * 
 * 渲染为绿色圆形，带有播放图标
 */
@injectable()
export class BeginNodeView extends CircularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const radius = Math.min(node.size.width, node.size.height) / 2;
        const center = { x: node.size.width / 2, y: node.size.height / 2 };
        
        return svg('g', {
            class: 'begin-node'
        }, [
            // 外圆
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius,
                class: 'begin-node-circle'
            }),
            
            // 内圆（稍小）
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius - 2,
                class: 'begin-node-inner'
            }),
            
            // 播放图标
            svg('polygon', {
                points: this.getPlayIconPoints(center, radius * 0.4),
                class: 'begin-node-icon'
            }),
            
            // 节点标签
            ...this.renderNodeLabel(node, center)
        ]);
    }
    
    /**
     * 获取播放图标的点坐标
     */
    private getPlayIconPoints(center: { x: number, y: number }, size: number): string {
        const points = [
            { x: center.x - size * 0.3, y: center.y - size * 0.5 },
            { x: center.x + size * 0.5, y: center.y },
            { x: center.x - size * 0.3, y: center.y + size * 0.5 }
        ];
        
        return points.map(p => `${p.x},${p.y}`).join(' ');
    }
    
    /**
     * 渲染节点标签
     */
    private renderNodeLabel(node: GNode, center: { x: number, y: number }): VNode[] {
        const label = node.children.find(child => child.type === 'label:node');
        if (!label) return [];
        
        return [
            svg('text', {
                x: center.x,
                y: center.y + node.size.height / 2 + 20,
                'text-anchor': 'middle',
                class: 'node-label'
            }, (label as any).text || '开始')
        ];
    }
}