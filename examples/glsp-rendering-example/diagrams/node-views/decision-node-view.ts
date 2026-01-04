import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

/**
 * 决策节点视图
 * 
 * 渲染为黄色菱形，带有问号图标
 */
@injectable()
export class DecisionNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const { width, height } = node.size;
        const center = { x: width / 2, y: height / 2 };
        
        return svg('g', {
            class: 'decision-node'
        }, [
            // 菱形主体
            svg('polygon', {
                points: this.getDiamondPoints(width, height),
                class: 'decision-node-diamond'
            }),
            
            // 问号图标
            svg('g', {
                transform: `translate(${center.x}, ${center.y})`
            }, [
                this.renderQuestionIcon()
            ]),
            
            // 节点标签
            ...this.renderNodeLabel(node, center)
        ]);
    }
    
    /**
     * 获取菱形的点坐标
     */
    private getDiamondPoints(width: number, height: number): string {
        const points = [
            { x: width / 2, y: 0 },        // 顶点
            { x: width, y: height / 2 },   // 右点
            { x: width / 2, y: height },   // 底点
            { x: 0, y: height / 2 }        // 左点
        ];
        
        return points.map(p => `${p.x},${p.y}`).join(' ');
    }
    
    /**
     * 渲染问号图标
     */
    private renderQuestionIcon(): VNode {
        return svg('g', {
            class: 'question-icon'
        }, [
            // 问号的弧形部分
            svg('path', {
                d: 'M -6,-8 Q -6,-12 -2,-12 Q 2,-12 2,-8 Q 2,-4 -2,-2 L -2,2',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round'
            }),
            
            // 问号的点
            svg('circle', {
                cx: -2,
                cy: 6,
                r: 1.5,
                fill: 'currentColor'
            })
        ]);
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
            }, (label as any).text || '决策')
        ];
    }
    
    /**
     * 获取菱形边界上的连接点
     */
    getConnectionPoint(
        node: GNode, 
        direction: 'top' | 'right' | 'bottom' | 'left'
    ): { x: number, y: number } {
        const { width, height } = node.size;
        
        switch (direction) {
            case 'top':
                return { x: width / 2, y: 0 };
            case 'right':
                return { x: width, y: height / 2 };
            case 'bottom':
                return { x: width / 2, y: height };
            case 'left':
                return { x: 0, y: height / 2 };
            default:
                return { x: width / 2, y: height / 2 };
        }
    }
}