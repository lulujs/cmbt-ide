/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { FeatureModule, NodeCreationTool, nodeCreationToolModule, viewportModule } from '@eclipse-glsp/client';
import { WorkflowNodeCreationTool } from './workflow-node-creation-tool';

/**
 * 工作流节点创建工具模块
 * Workflow node creation tool module
 */
export const workflowNodeCreationModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      context.rebind(NodeCreationTool).to(WorkflowNodeCreationTool).inSingletonScope();
   },
   { requires: [nodeCreationToolModule, viewportModule] }
);
