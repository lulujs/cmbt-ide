import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { RectangularNodeView } from './base/rectangular-node-view';

/**
 * 处理节点视图
 * 
 * 渲染为蓝色矩形，带有齿轮图标
 */
@injectable()
export class ProcessNodeView extends RectangularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const { width, height } = node.size;
        
        return svg('g', {
            class: 'process-node'
        }, [
            // 主矩形
            svg('rect', {
                x: 0,
                y: 0,
                width: width,
                height: height,
                rx: 5,
                ry: 5,
                class: 'process-node-rect'
            }),
            
            // 齿轮图标
            svg('g', {
                transform: `translate(${width - 25}, 8)`
            }, [
                this.renderGearIcon()
            ]),
            
            // 节点标签
            ...this.renderNodeLabel(node)
        ]);
    }
    
    /**
     * 渲染齿轮图标
     */
    private renderGearIcon(): VNode {
        return svg('g', {
            class: 'gear-icon'
        }, [
            // 外齿轮
            svg('circle', {
                cx: 8,
                cy: 8,
                r: 7,
                class: 'gear-outer'
            }),
            
            // 内齿轮
            svg('circle', {
                cx: 8,
                cy: 8,
                r: 3,
                class: 'gear-inner'
            }),
            
            // 齿轮齿
            ...this.renderGearTeeth()
        ]);
    }
    
    /**
     * 渲染齿轮的齿
     */
    private renderGearTeeth(): VNode[] {
        const teeth: VNode[] = [];
        const center = { x: 8, y: 8 };
        const outerRadius = 7;
        const innerRadius = 5;
        const teethCount = 8;
        
        for (let i = 0; i < teethCount; i++) {
            const angle = (i * 2 * Math.PI) / teethCount;
            const x1 = center.x + Math.cos(angle) * innerRadius;
            const y1 = center.y + Math.sin(angle) * innerRadius;
            const x2 = center.x + Math.cos(angle) * outerRadius;
            const y2 = center.y + Math.sin(angle) * outerRadius;
            
            teeth.push(
                svg('line', {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2,
                    class: 'gear-tooth'
                })
            );
        }
        
        return teeth;
    }
    
    /**
     * 渲染节点标签
     */
    private renderNodeLabel(node: GNode): VNode[] {
        const label = node.children.find(child => child.type === 'label:node');
        if (!label) return [];
        
        return [
            svg('text', {
                x: node.size.width / 2,
                y: node.size.height / 2 + 4,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'node-label'
            }, (label as any).text || '处理')
        ];
    }
}