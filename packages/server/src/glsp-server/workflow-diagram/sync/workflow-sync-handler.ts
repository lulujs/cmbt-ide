/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Action, ActionDispatcher, DisposableCollection, Logger, ModelSubmissionHandler } from '@eclipse-glsp/server';
import { inject, injectable, postConstruct } from 'inversify';
import { WorkflowModelState } from '../model/workflow-model-state.js';

/**
 * 工作流程同步处理器 - 处理图形编辑器与语言服务器之间的数据同步
 * Workflow sync handler - handles data synchronization between graphical editor and language server
 * 需求 8.4: 保持数据同步
 */
@injectable()
export class WorkflowSyncHandler {
   @inject(Logger) protected logger!: Logger;
   @inject(WorkflowModelState) protected modelState!: WorkflowModelState;
   @inject(ModelSubmissionHandler) protected submissionHandler!: ModelSubmissionHandler;
   @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

   protected toDispose = new DisposableCollection();
   protected isSyncing = false;
   protected pendingSync: Promise<void> | undefined;

   @postConstruct()
   protected init(): void {
      // 初始化同步处理器
      this.logger.info('WorkflowSyncHandler initialized');
   }

   /**
    * 同步图形模型到语义模型
    * Sync graphical model to semantic model
    */
   async syncGraphToSemantic(): Promise<Action[]> {
      if (this.isSyncing) {
         this.logger.debug('Sync already in progress, skipping');
         return [];
      }

      try {
         this.isSyncing = true;
         await this.modelState.ready();
         return await this.submissionHandler.submitModel('operation');
      } catch (error) {
         this.logger.error('Error syncing graph to semantic model:', error);
         return [];
      } finally {
         this.isSyncing = false;
      }
   }

   /**
    * 同步语义模型到图形模型
    * Sync semantic model to graphical model
    */
   async syncSemanticToGraph(): Promise<Action[]> {
      if (this.isSyncing) {
         this.logger.debug('Sync already in progress, skipping');
         return [];
      }

      try {
         this.isSyncing = true;
         await this.modelState.ready();
         return await this.submissionHandler.submitModel('external');
      } catch (error) {
         this.logger.error('Error syncing semantic to graph model:', error);
         return [];
      } finally {
         this.isSyncing = false;
      }
   }

   /**
    * 处理冲突解决
    * Handle conflict resolution
    */
   async resolveConflict(preferSource: 'graph' | 'semantic'): Promise<Action[]> {
      this.logger.info(`Resolving conflict, preferring ${preferSource} model`);

      if (preferSource === 'graph') {
         // 图形模型优先 - 重新提交图形模型
         return this.syncGraphToSemantic();
      } else {
         // 语义模型优先 - 重新加载语义模型
         return this.syncSemanticToGraph();
      }
   }

   /**
    * 检查是否有未同步的更改
    * Check if there are unsynchronized changes
    */
   hasUnsyncedChanges(): boolean {
      // 检查命令栈是否有未保存的更改
      return false; // 简化实现，实际应检查命令栈状态
   }

   /**
    * 获取同步状态
    * Get sync status
    */
   getSyncStatus(): SyncStatus {
      return {
         isSyncing: this.isSyncing,
         hasUnsyncedChanges: this.hasUnsyncedChanges(),
         lastSyncTime: new Date()
      };
   }

   /**
    * 清理资源
    * Dispose resources
    */
   dispose(): void {
      this.toDispose.dispose();
   }
}

/**
 * 同步状态接口
 * Sync status interface
 */
export interface SyncStatus {
   isSyncing: boolean;
   hasUnsyncedChanges: boolean;
   lastSyncTime: Date;
}
