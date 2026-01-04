/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { WorkflowModel } from '../../../language-server/generated/ast.js';
import { CrossModelState } from '../../common/cross-model-state.js';
import { WorkflowModelIndex } from './workflow-model-index.js';

/**
 * 工作流程模型状态 - 管理工作流程图的语义模型状态
 * Workflow model state - manages semantic model state for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowModelState extends CrossModelState {
   declare readonly index: WorkflowModelIndex;

   /**
    * 获取工作流程模型
    * Get workflow model
    */
   get workflowModel(): WorkflowModel | undefined {
      return this.semanticRoot.workflowModel;
   }

   /**
    * 检查是否有有效的工作流程模型
    * Check if there is a valid workflow model
    */
   hasWorkflowModel(): boolean {
      return this.workflowModel !== undefined;
   }
}
