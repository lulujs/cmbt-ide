import { GNode, IView, RenderingContext, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

/**
 * 圆形节点视图基类
 * 
 * 为所有圆形节点（开始、结束、异常）提供通用功能
 */
@injectable()
export abstract class CircularNodeView implements IView {
    
    abstract render(node: GNode, context: RenderingContext): VNode;
    
    /**
     * 获取圆形节点的半径
     */
    protected getRadius(node: GNode): number {
        return Math.min(node.size.width, node.size.height) / 2;
    }
    
    /**
     * 获取圆形节点的中心点
     */
    protected getCenter(node: GNode): { x: number, y: number } {
        return {
            x: node.size.width / 2,
            y: node.size.height / 2
        };
    }
    
    /**
     * 检查点是否在圆形内
     */
    protected isPointInside(node: GNode, point: { x: number, y: number }): boolean {
        const center = this.getCenter(node);
        const radius = this.getRadius(node);
        const distance = Math.sqrt(
            Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
        );
        return distance <= radius;
    }
    
    /**
     * 获取圆形边界上的连接点
     */
    protected getConnectionPoint(
        node: GNode, 
        direction: 'top' | 'right' | 'bottom' | 'left'
    ): { x: number, y: number } {
        const center = this.getCenter(node);
        const radius = this.getRadius(node);
        
        switch (direction) {
            case 'top':
                return { x: center.x, y: center.y - radius };
            case 'right':
                return { x: center.x + radius, y: center.y };
            case 'bottom':
                return { x: center.x, y: center.y + radius };
            case 'left':
                return { x: center.x - radius, y: center.y };
            default:
                return center;
        }
    }
}