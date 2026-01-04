import { GNode, IView, RenderingContext, VNode } from '@eclipse-glsp/client';
import { injectable } from 'inversify';

/**
 * 矩形节点视图基类
 * 
 * 为所有矩形节点提供通用功能
 */
@injectable()
export abstract class RectangularNodeView implements IView {
    
    abstract render(node: GNode, context: RenderingContext): VNode;
    
    /**
     * 检查点是否在矩形内
     */
    protected isPointInside(node: GNode, point: { x: number, y: number }): boolean {
        return point.x >= 0 && 
               point.x <= node.size.width && 
               point.y >= 0 && 
               point.y <= node.size.height;
    }
    
    /**
     * 获取矩形边界上的连接点
     */
    protected getConnectionPoint(
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
    
    /**
     * 获取矩形的中心点
     */
    protected getCenter(node: GNode): { x: number, y: number } {
        return {
            x: node.size.width / 2,
            y: node.size.height / 2
        };
    }
    
    /**
     * 获取矩形的角点
     */
    protected getCorners(node: GNode): {
        topLeft: { x: number, y: number },
        topRight: { x: number, y: number },
        bottomLeft: { x: number, y: number },
        bottomRight: { x: number, y: number }
    } {
        const { width, height } = node.size;
        return {
            topLeft: { x: 0, y: 0 },
            topRight: { x: width, y: 0 },
            bottomLeft: { x: 0, y: height },
            bottomRight: { x: width, y: height }
        };
    }
}