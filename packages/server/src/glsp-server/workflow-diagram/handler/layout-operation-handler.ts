/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Command, JsonOperationHandler, LayoutOperation, MaybePromise } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程图布局操作处理器
 * Workflow diagram layout operation handler
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramLayoutOperationHandler extends JsonOperationHandler {
   override operationType = LayoutOperation.KIND;

   declare protected modelState: WorkflowModelState;

   override createCommand(_operation: LayoutOperation): MaybePromise<Command | undefined> {
      // 工作流程图使用手动布局，此处不执行自动布局
      // Workflow diagrams use manual layout, no automatic layout is performed here
      return undefined;
   }
}
