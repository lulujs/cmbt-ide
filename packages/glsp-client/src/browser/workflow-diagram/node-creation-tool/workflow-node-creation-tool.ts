/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   Disposable,
   DisposableCollection,
   GModelElement,
   GhostElement,
   NodeCreationTool,
   NodeCreationToolMouseListener
} from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';

/**
 * 工作流节点创建工具
 * Workflow node creation tool
 */
@injectable()
export class WorkflowNodeCreationTool extends NodeCreationTool {
   override enable(): void {
      super.enable();
   }

   override disable(): void {
      super.disable();
   }

   protected override createNodeCreationListener(ghostElement: GhostElement): Disposable {
      const toolListener = new WorkflowNodeCreationToolMouseListener(this.triggerAction, this, ghostElement);
      return new DisposableCollection(toolListener, this.mouseTool.registerListener(toolListener));
   }
}

/**
 * 工作流节点创建工具鼠标监听器
 * Workflow node creation tool mouse listener
 */
export class WorkflowNodeCreationToolMouseListener extends NodeCreationToolMouseListener {
   protected override tool: WorkflowNodeCreationTool;

   /**
    * 启用连续模式 - 允许连续创建多个节点
    * Enable continuous mode - allows creating multiple nodes continuously
    */
   protected override isContinuousMode(_ctx: GModelElement, _event: MouseEvent): boolean {
      return false; // 工作流图默认不使用连续模式
   }

   /**
    * 只处理鼠标主键点击
    * Only handle main mouse button clicks
    */
   override nonDraggingMouseUp(ctx: GModelElement, event: MouseEvent): import('@eclipse-glsp/client').Action[] {
      // 只处理鼠标主键
      if (event.button !== 0) {
         return [];
      }
      const result = super.nonDraggingMouseUp(ctx, event);
      return result;
   }

   protected override getCreateOperation(ctx: GModelElement, event: MouseEvent, insert: any): import('@eclipse-glsp/client').Action {
      const result = super.getCreateOperation(ctx, event, insert);
      return result;
   }
}
