import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { CircularNodeView } from './base/circular-node-view';

/**
 * 异常节点视图
 * 
 * 渲染为红色圆形，带有警告图标
 */
@injectable()
export class ExceptionNodeView extends CircularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const radius = this.getRadius(node);
        const center = this.getCenter(node);
        
        return svg('g', {
            class: 'exception-node'
        }, [
            // 外圆
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius,
                class: 'exception-node-circle'
            }),
            
            // 内圆（稍小）
            svg('circle', {
                cx: center.x,
                cy: center.y,
                r: radius - 2,
                class: 'exception-node-inner'
            }),
            
            // 警告图标
            svg('g', {
                transform: `translate(${center.x}, ${center.y})`
            }, [
                this.renderWarningIcon()
            ]),
            
            // 错误代码显示
            ...this.renderErrorCode(node, center, radius),
            
            // 节点标签
            ...this.renderNodeLabel(node, center, radius)
        ]);
    }
    
    /**
     * 渲染警告图标
     */
    private renderWarningIcon(): VNode {
        return svg('g', {
            class: 'warning-icon'
        }, [
            // 三角形外框
            svg('polygon', {
                points: '0,-12 -10,8 10,8',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 2,
                'stroke-linejoin': 'round'
            }),
            
            // 感叹号的竖线
            svg('line', {
                x1: 0,
                y1: -6,
                x2: 0,
                y2: 2,
                stroke: 'currentColor',
                'stroke-width': 2,
                'stroke-linecap': 'round'
            }),
            
            // 感叹号的点
            svg('circle', {
                cx: 0,
                cy: 6,
                r: 1.5,
                fill: 'currentColor'
            })
        ]);
    }
    
    /**
     * 渲染错误代码
     */
    private renderErrorCode(
        node: GNode, 
        center: { x: number, y: number }, 
        radius: number
    ): VNode[] {
        const nodeData = (node as any).nodeData;
        const errorCode = nodeData?.errorCode;
        
        if (!errorCode) return [];
        
        return [
            svg('text', {
                x: center.x,
                y: center.y + radius + 35,
                'text-anchor': 'middle',
                class: 'error-code'
            }, errorCode)
        ];
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
            }, (label as any).text || '异常')
        ];
    }
    
    /**
     * 渲染脉冲动画效果（表示错误状态）
     */
    private renderPulseEffect(center: { x: number, y: number }, radius: number): VNode {
        return svg('circle', {
            cx: center.x,
            cy: center.y,
            r: radius + 5,
            class: 'exception-pulse',
            fill: 'none',
            stroke: '#f44336',
            'stroke-width': 2,
            opacity: 0.6
        }, [
            // CSS动画将在主题文件中定义
            svg('animate', {
                attributeName: 'r',
                values: `${radius + 5};${radius + 15};${radius + 5}`,
                dur: '2s',
                repeatCount: 'indefinite'
            }),
            
            svg('animate', {
                attributeName: 'opacity',
                values: '0.6;0;0.6',
                dur: '2s',
                repeatCount: 'indefinite'
            })
        ]);
    }
}