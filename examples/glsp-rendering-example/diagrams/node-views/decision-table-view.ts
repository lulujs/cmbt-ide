import { GNode, RenderingContext, svg, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { RectangularNodeView } from './base/rectangular-node-view';

/**
 * 决策表节点视图
 * 
 * 渲染为橙色矩形，带有表格图标和规则指示器
 */
@injectable()
export class DecisionTableView extends RectangularNodeView {
    
    render(node: GNode, context: RenderingContext): VNode {
        const { width, height } = node.size;
        
        return svg('g', {
            class: 'decision-table-node'
        }, [
            // 主矩形
            svg('rect', {
                x: 0,
                y: 0,
                width: width,
                height: height,
                rx: 5,
                ry: 5,
                class: 'decision-table-rect'
            }),
            
            // 表格图标
            svg('g', {
                transform: `translate(8, 8)`
            }, [
                this.renderTableIcon()
            ]),
            
            // 规则数量指示器
            svg('g', {
                transform: `translate(${width - 30}, 8)`
            }, [
                this.renderRuleIndicator(node)
            ]),
            
            // 节点标签
            ...this.renderNodeLabel(node)
        ]);
    }
    
    /**
     * 渲染表格图标
     */
    private renderTableIcon(): VNode {
        return svg('g', {
            class: 'table-icon'
        }, [
            // 表格外框
            svg('rect', {
                x: 0,
                y: 0,
                width: 16,
                height: 12,
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 1
            }),
            
            // 水平分割线
            svg('line', {
                x1: 0,
                y1: 4,
                x2: 16,
                y2: 4,
                stroke: 'currentColor',
                'stroke-width': 1
            }),
            
            svg('line', {
                x1: 0,
                y1: 8,
                x2: 16,
                y2: 8,
                stroke: 'currentColor',
                'stroke-width': 1
            }),
            
            // 垂直分割线
            svg('line', {
                x1: 5,
                y1: 0,
                x2: 5,
                y2: 12,
                stroke: 'currentColor',
                'stroke-width': 1
            }),
            
            svg('line', {
                x1: 11,
                y1: 0,
                x2: 11,
                y2: 12,
                stroke: 'currentColor',
                'stroke-width': 1
            })
        ]);
    }
    
    /**
     * 渲染规则数量指示器
     */
    private renderRuleIndicator(node: GNode): VNode {
        // 从节点数据中获取规则数量（这里使用模拟数据）
        const ruleCount = this.getRuleCount(node);
        
        return svg('g', {
            class: 'rule-indicator'
        }, [
            // 背景圆圈
            svg('circle', {
                cx: 10,
                cy: 6,
                r: 8,
                class: 'rule-indicator-bg'
            }),
            
            // 规则数量文本
            svg('text', {
                x: 10,
                y: 6,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'rule-indicator-text'
            }, ruleCount.toString())
        ]);
    }
    
    /**
     * 获取决策表的规则数量
     */
    private getRuleCount(node: GNode): number {
        // 这里应该从实际的节点数据中获取规则数量
        // 暂时返回模拟数据
        const nodeData = (node as any).nodeData;
        if (nodeData && nodeData.tableData && nodeData.tableData.rows) {
            return nodeData.tableData.rows.length;
        }
        return 4; // 默认值
    }
    
    /**
     * 渲染节点标签
     */
    private renderNodeLabel(node: GNode): VNode[] {
        const label = node.children.find(child => child.type === 'label:node');
        if (!label) return [];
        
        const { width, height } = node.size;
        
        return [
            // 主标签
            svg('text', {
                x: width / 2,
                y: height / 2 + 4,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'node-label'
            }, (label as any).text || '决策表'),
            
            // 副标签（显示类型）
            svg('text', {
                x: width / 2,
                y: height / 2 + 18,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'node-sublabel'
            }, 'Decision Table')
        ];
    }
    
    /**
     * 渲染决策表预览（当节点较大时）
     */
    private renderTablePreview(node: GNode): VNode[] {
        const { width, height } = node.size;
        
        // 只有当节点足够大时才显示预览
        if (width < 200 || height < 100) {
            return [];
        }
        
        const tableX = 20;
        const tableY = 40;
        const tableWidth = width - 40;
        const tableHeight = height - 60;
        
        return [
            svg('g', {
                class: 'table-preview'
            }, [
                // 表格背景
                svg('rect', {
                    x: tableX,
                    y: tableY,
                    width: tableWidth,
                    height: tableHeight,
                    fill: 'rgba(255, 255, 255, 0.8)',
                    stroke: '#ccc',
                    'stroke-width': 1,
                    rx: 2
                }),
                
                // 表头
                svg('rect', {
                    x: tableX,
                    y: tableY,
                    width: tableWidth,
                    height: 20,
                    fill: 'rgba(0, 0, 0, 0.1)'
                }),
                
                // 表格线条
                ...this.renderTableGrid(tableX, tableY, tableWidth, tableHeight)
            ])
        ];
    }
    
    /**
     * 渲染表格网格
     */
    private renderTableGrid(x: number, y: number, width: number, height: number): VNode[] {
        const lines: VNode[] = [];
        const rowHeight = 20;
        const colWidth = width / 4;
        
        // 水平线
        for (let i = 1; i < height / rowHeight; i++) {
            lines.push(
                svg('line', {
                    x1: x,
                    y1: y + i * rowHeight,
                    x2: x + width,
                    y2: y + i * rowHeight,
                    stroke: '#ddd',
                    'stroke-width': 1
                })
            );
        }
        
        // 垂直线
        for (let i = 1; i < 4; i++) {
            lines.push(
                svg('line', {
                    x1: x + i * colWidth,
                    y1: y,
                    x2: x + i * colWidth,
                    y2: y + height,
                    stroke: '#ddd',
                    'stroke-width': 1
                })
            );
        }
        
        return lines;
    }
}