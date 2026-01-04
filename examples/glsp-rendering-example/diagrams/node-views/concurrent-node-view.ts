import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { RectangularNodeView } from './base/rectangular-node-view';

/**
 * 并行节点视图
 * 
 * 渲染为绿色矩形，带有并行线图标
 */
@injectable()
export class ConcurrentNodeView extends RectangularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const { width, height } = node.size;
        const nodeType = this.getConcurrentNodeType(node);
        
        return svg('g', {
            class: `concurrent-node concurrent-${nodeType}`
        }, [
            // 主矩形
            svg('rect', {
                x: 0,
                y: 0,
                width: width,
                height: height,
                rx: 3,
                ry: 3,
                class: 'concurrent-node-rect'
            }),
            
            // 并行线图标
            svg('g', {
                transform: `translate(${width / 2}, ${height / 2})`
            }, [
                this.renderParallelIcon(nodeType)
            ]),
            
            // 节点标签
            ...this.renderNodeLabel(node, nodeType)
        ]);
    }
    
    /**
     * 获取并行节点类型（开始或结束）
     */
    private getConcurrentNodeType(node: GNode): 'start' | 'end' {
        // 根据节点的连接情况或属性判断是开始还是结束
        // 这里使用简单的启发式方法
        const nodeData = (node as any).nodeData;
        if (nodeData && nodeData.parallelBranches) {
            return 'start';
        }
        return 'end';
    }
    
    /**
     * 渲染并行线图标
     */
    private renderParallelIcon(nodeType: 'start' | 'end'): VNode {
        if (nodeType === 'start') {
            return this.renderForkIcon();
        } else {
            return this.renderJoinIcon();
        }
    }
    
    /**
     * 渲染分叉图标（并行开始）
     */
    private renderForkIcon(): VNode {
        return svg('g', {
            class: 'fork-icon'
        }, [
            // 输入线
            svg('line', {
                x1: -15,
                y1: 0,
                x2: -5,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 分叉点
            svg('circle', {
                cx: -5,
                cy: 0,
                r: 2,
                fill: 'currentColor'
            }),
            
            // 输出线1
            svg('line', {
                x1: -5,
                y1: 0,
                x2: 10,
                y2: -8,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 输出线2
            svg('line', {
                x1: -5,
                y1: 0,
                x2: 10,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 输出线3
            svg('line', {
                x1: -5,
                y1: 0,
                x2: 10,
                y2: 8,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 箭头
            svg('polygon', {
                points: '10,-8 15,-8 12,-5',
                fill: 'currentColor'
            }),
            
            svg('polygon', {
                points: '10,0 15,0 12,3',
                fill: 'currentColor'
            }),
            
            svg('polygon', {
                points: '10,8 15,8 12,11',
                fill: 'currentColor'
            })
        ]);
    }
    
    /**
     * 渲染汇合图标（并行结束）
     */
    private renderJoinIcon(): VNode {
        return svg('g', {
            class: 'join-icon'
        }, [
            // 输入线1
            svg('line', {
                x1: -10,
                y1: -8,
                x2: 5,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 输入线2
            svg('line', {
                x1: -10,
                y1: 0,
                x2: 5,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 输入线3
            svg('line', {
                x1: -10,
                y1: 8,
                x2: 5,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 汇合点
            svg('circle', {
                cx: 5,
                cy: 0,
                r: 2,
                fill: 'currentColor'
            }),
            
            // 输出线
            svg('line', {
                x1: 5,
                y1: 0,
                x2: 15,
                y2: 0,
                stroke: 'currentColor',
                'stroke-width': 2
            }),
            
            // 箭头
            svg('polygon', {
                points: '15,0 20,0 17,3',
                fill: 'currentColor'
            })
        ]);
    }
    
    /**
     * 渲染节点标签
     */
    private renderNodeLabel(node: GNode, nodeType: 'start' | 'end'): VNode[] {
        const label = node.children.find(child => child.type === 'label:node');
        if (!label) return [];
        
        const { width, height } = node.size;
        const defaultText = nodeType === 'start' ? '并行开始' : '并行结束';
        
        return [
            svg('text', {
                x: width / 2,
                y: height + 15,
                'text-anchor': 'middle',
                class: 'node-label'
            }, (label as any).text || defaultText)
        ];
    }
    
    /**
     * 渲染分支指示器（仅用于并行开始节点）
     */
    private renderBranchIndicators(node: GNode): VNode[] {
        const nodeData = (node as any).nodeData;
        if (!nodeData || !nodeData.parallelBranches) {
            return [];
        }
        
        const branches = nodeData.parallelBranches;
        const { width, height } = node.size;
        const indicators: VNode[] = [];
        
        branches.forEach((branch: any, index: number) => {
            const y = (height / (branches.length + 1)) * (index + 1);
            
            indicators.push(
                svg('g', {
                    transform: `translate(${width + 10}, ${y})`
                }, [
                    svg('circle', {
                        cx: 0,
                        cy: 0,
                        r: 3,
                        class: 'branch-indicator'
                    }),
                    
                    svg('text', {
                        x: 10,
                        y: 4,
                        class: 'branch-label'
                    }, branch.name || `分支${index + 1}`)
                ])
            );
        });
        
        return indicators;
    }
}