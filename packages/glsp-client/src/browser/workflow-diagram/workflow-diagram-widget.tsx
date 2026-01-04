/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { GLSPDiagramWidget } from '@eclipse-glsp/theia-integration';
import { injectable } from '@theia/core/shared/inversify';

/**
 * 工作流程图组件 - 工作流程图的主要编辑器组件
 * Workflow diagram widget - main editor widget for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramWidget extends GLSPDiagramWidget {
   // 继承GLSPDiagramWidget的所有功能
   // 可以在此添加工作流程图特有的功能
}
