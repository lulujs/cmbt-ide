/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { codiconCSSString } from '@eclipse-glsp/client';
import { GLSPDiagramManager } from '@eclipse-glsp/theia-integration';
import { OpenWithHandler } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { WorkflowDiagramLanguage } from '../../common/crossmodel-diagram-language';

/**
 * 工作流程图管理器 - 管理工作流程图的打开和显示
 * Workflow diagram manager - manages opening and displaying workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramManager extends GLSPDiagramManager implements OpenWithHandler {
   static readonly ID = 'workflow-diagram-manager';

   get label(): string {
      return WorkflowDiagramLanguage.label;
   }

   override get iconClass(): string {
      return WorkflowDiagramLanguage.iconClass ?? codiconCSSString('workflow');
   }

   override get fileExtensions(): string[] {
      return WorkflowDiagramLanguage.fileExtensions;
   }

   override get diagramType(): string {
      return WorkflowDiagramLanguage.diagramType;
   }

   override get contributionId(): string {
      return WorkflowDiagramLanguage.contributionId;
   }

   override get id(): string {
      return WorkflowDiagramManager.ID;
   }
}
