/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   ContainerContext,
   DiagramConfiguration,
   GLSPDiagramWidget,
   GLSPTheiaFrontendModule,
   registerDiagramManager
} from '@eclipse-glsp/theia-integration';

import { WorkflowDiagramLanguage } from '../../common/crossmodel-diagram-language';
import { WorkflowDiagramConfiguration } from './workflow-diagram-configuration';
import { WorkflowDiagramManager } from './workflow-diagram-manager';
import { WorkflowDiagramWidget } from './workflow-diagram-widget';

/**
 * 工作流程图前端模块 - 配置工作流程图的前端组件
 * Workflow diagram frontend module - configures frontend components for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
export class WorkflowDiagramFrontendModule extends GLSPTheiaFrontendModule {
   readonly diagramLanguage = WorkflowDiagramLanguage;

   // Theia commands are shared among diagram modules so we want to avoid double registration
   protected override enableLayoutCommands = false;
   protected override enableMarkerNavigationCommands = false;

   bindDiagramConfiguration(context: ContainerContext): void {
      context.bind(DiagramConfiguration).to(WorkflowDiagramConfiguration);
   }

   override bindGLSPClientContribution(context: ContainerContext): void {
      // DO NOT BIND ANOTHER GLSP CLIENT CONTRIBUTION, WE ONLY NEED ONE PER SERVER AND WE DO IT IN THE SYSTEM DIAGRAM LANGUAGE
   }

   override bindDiagramWidgetFactory(context: ContainerContext): void {
      super.bindDiagramWidgetFactory(context);
      context.rebind(GLSPDiagramWidget).to(WorkflowDiagramWidget);
   }

   override configureDiagramManager(context: ContainerContext): void {
      context.bind(WorkflowDiagramManager).toSelf().inSingletonScope();
      registerDiagramManager(context.bind, WorkflowDiagramManager, false);
   }
}

export default new WorkflowDiagramFrontendModule();
