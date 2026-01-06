/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Grammar } from 'langium';
import { collectAst } from 'langium/grammar';
import { Serializer } from '../model-server/serializer.js';
import { CrossModelSerializer } from './cross-model-serializer.js';
import { CrossModelRoot, isWorkflowModel } from './generated/ast.js';
import { WorkflowSerializer } from './workflow/workflow-serializer.js';

/**
 * 智能序列化器 - 根据模型类型选择合适的序列化器
 * Smart serializer that chooses the appropriate serializer based on model type
 */
export class SmartSerializer implements Serializer<CrossModelRoot> {
   private crossModelSerializer: CrossModelSerializer;
   private workflowSerializer: WorkflowSerializer;

   constructor(grammar: Grammar) {
      const astTypes = collectAst(grammar);
      this.crossModelSerializer = new CrossModelSerializer(grammar, astTypes);
      this.workflowSerializer = new WorkflowSerializer(grammar, astTypes);
   }

   serialize(root: CrossModelRoot): string {
      // 如果是工作流模型，使用专门的工作流序列化器
      if (root.workflowModel && isWorkflowModel(root.workflowModel)) {
         return this.workflowSerializer.serialize(root.workflowModel);
      }
      
      // 否则使用通用的序列化器
      return this.crossModelSerializer.serialize(root);
   }
}