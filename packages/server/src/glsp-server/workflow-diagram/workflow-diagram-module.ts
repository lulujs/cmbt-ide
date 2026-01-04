/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   BindingTarget,
   ContextActionsProvider,
   DiagramConfiguration,
   DiagramModule,
   EdgeCreationChecker,
   GModelFactory,
   GModelIndex,
   InstanceMultiBinding,
   LayoutEngine,
   LayoutOperationHandler,
   ModelState,
   ModelSubmissionHandler,
   MultiBinding,
   OperationHandlerConstructor,
   SourceModelStorage,
   ToolPaletteItemProvider,
   bindAsService
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ShowPropertiesContextMenuProvider } from '../common/context-menu/show-properties-context-menu-provider.js';
import { CrossModelIndex } from '../common/cross-model-index.js';
import { CrossModelState } from '../common/cross-model-state.js';
import { CrossModelSubmissionHandler } from '../common/cross-model-submission-handler.js';
import { WorkflowEdgeCreationChecker } from './edge-checker/workflow-edge-checker.js';
import { WorkflowDiagramApplyLabelEditOperationHandler } from './handler/apply-edit-operation-handler.js';
import { WorkflowDiagramChangeBoundsOperationHandler } from './handler/change-bounds-operation-handler.js';
import { WorkflowDiagramCreateEdgeOperationHandler } from './handler/create-edge-operation-handler.js';
import { WorkflowDiagramCreateNodeOperationHandler } from './handler/create-node-operation-handler.js';
import { WorkflowDiagramCreateSwimlaneOperationHandler } from './handler/create-swimlane-operation-handler.js';
import { WorkflowDiagramDeleteOperationHandler } from './handler/delete-operation-handler.js';
import { WorkflowDiagramLayoutOperationHandler } from './handler/layout-operation-handler.js';
import { WorkflowDiagramLayoutEngine } from './layout-engine.js';
import { WorkflowDiagramGModelFactory } from './model/workflow-diagram-gmodel-factory.js';
import { WorkflowModelIndex } from './model/workflow-model-index.js';
import { WorkflowModelState } from './model/workflow-model-state.js';
import { WorkflowToolPaletteProvider } from './tool-palette/workflow-tool-palette-provider.js';
import { WorkflowDiagramConfiguration } from './workflow-diagram-configuration.js';
import { WorkflowStorage } from './workflow-storage.js';

/**
 * 工作流程图模块 - 提供工作流程图的配置
 * Workflow diagram module - provides configuration for workflow diagrams
 * 需求 8.2: 提供可视化的流程图编辑器
 */
@injectable()
export class WorkflowDiagramModule extends DiagramModule {
   readonly diagramType = 'workflow-diagram';

   protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
      return WorkflowDiagramConfiguration;
   }

   protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
      return WorkflowStorage;
   }

   protected override bindModelSubmissionHandler(): BindingTarget<ModelSubmissionHandler> {
      return CrossModelSubmissionHandler;
   }

   protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
      super.configureOperationHandlers(binding);
      binding.add(WorkflowDiagramChangeBoundsOperationHandler);
      binding.add(WorkflowDiagramCreateNodeOperationHandler);
      binding.add(WorkflowDiagramCreateEdgeOperationHandler);
      binding.add(WorkflowDiagramCreateSwimlaneOperationHandler);
      binding.add(WorkflowDiagramDeleteOperationHandler);
      binding.add(WorkflowDiagramApplyLabelEditOperationHandler);
      binding.rebind(LayoutOperationHandler, WorkflowDiagramLayoutOperationHandler);
   }

   protected override configureContextActionProviders(binding: MultiBinding<ContextActionsProvider>): void {
      super.configureContextActionProviders(binding);
      binding.add(ShowPropertiesContextMenuProvider);
   }

   protected override bindLayoutEngine(): BindingTarget<LayoutEngine> | undefined {
      return WorkflowDiagramLayoutEngine;
   }

   protected override bindGModelIndex(): BindingTarget<GModelIndex> {
      bindAsService(this.context, CrossModelIndex, WorkflowModelIndex);
      return { service: WorkflowModelIndex };
   }

   protected bindModelState(): BindingTarget<ModelState> {
      bindAsService(this.context, CrossModelState, WorkflowModelState);
      return { service: WorkflowModelState };
   }

   protected bindGModelFactory(): BindingTarget<GModelFactory> {
      return WorkflowDiagramGModelFactory;
   }

   protected override bindToolPaletteItemProvider(): BindingTarget<ToolPaletteItemProvider> | undefined {
      return WorkflowToolPaletteProvider;
   }

   protected override bindEdgeCreationChecker(): BindingTarget<EdgeCreationChecker> | undefined {
      return WorkflowEdgeCreationChecker;
   }
}
