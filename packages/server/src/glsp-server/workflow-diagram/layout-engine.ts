/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GModelRoot, LayoutEngine, MaybePromise, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { WorkflowModelState } from './model/workflow-model-state.js';

/**
 * 工作流程图布局引擎
 * Workflow diagram layout engine
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramLayoutEngine implements LayoutEngine {
   @inject(ModelState) protected modelState: WorkflowModelState;

   /**
    * 执行布局计算
    * Perform layout calculation
    */
   layout(): MaybePromise<GModelRoot> {
      // 工作流程图使用手动布局，不执行自动布局
      // Workflow diagrams use manual layout, no automatic layout is performed
      return this.modelState.root;
   }
}
