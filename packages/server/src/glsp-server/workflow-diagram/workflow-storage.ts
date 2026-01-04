/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   Action,
   ActionDispatcher,
   ClientSession,
   ClientSessionListener,
   ClientSessionManager,
   CommandStack,
   DefaultCommandStack,
   DisposableCollection,
   EditMode,
   GLSPServerError,
   Logger,
   MaybePromise,
   ModelSubmissionHandler,
   RequestModelAction,
   SOURCE_URI_ARG,
   SaveModelAction,
   SetEditModeAction,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { inject, injectable, postConstruct } from 'inversify';
import { AstUtils } from 'langium';
import debounce from 'p-debounce';
import { DiagnosticSeverity } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';
import { CrossModelRoot } from '../../language-server/generated/ast.js';
import { AstCrossModelDocument } from '../../model-server/open-text-document-manager.js';
import { WorkflowModelState } from './model/workflow-model-state.js';

/**
 * 工作流程存储 - 处理工作流程模型的加载和保存
 * Workflow storage - handles loading and saving of workflow models
 * 需求 8.4: 保持数据同步
 * 需求 8.5: 实时更新其他建模方式的显示
 */
@injectable()
export class WorkflowStorage implements SourceModelStorage, ClientSessionListener {
   @inject(Logger) protected logger!: Logger;
   @inject(WorkflowModelState) protected state!: WorkflowModelState;
   @inject(ClientSessionManager) protected sessionManager!: ClientSessionManager;
   @inject(ModelSubmissionHandler) protected submissionHandler!: ModelSubmissionHandler;
   @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;
   @inject(CommandStack) protected commandStack!: DefaultCommandStack;

   protected toDispose = new DisposableCollection();

   @postConstruct()
   protected init(): void {
      this.sessionManager.addListener(this, this.state.clientId);
   }

   /**
    * 加载源模型
    * Load source model
    */
   async loadSourceModel(action: RequestModelAction): Promise<void> {
      const sourceUri = this.getSourceUri(action);
      const rootUri = URI.file(sourceUri).toString();
      const document = await this.update(rootUri);

      if (!document) {
         this.logger.error('Could not load workflow model from ' + rootUri);
         return;
      }

      // 注册模型更新监听器
      this.toDispose.push(await this.state.modelService.open({ uri: rootUri, clientId: this.state.clientId }));
      this.toDispose.push(
         this.state.modelService.onModelUpdated(rootUri, async event => {
            if (this.state.clientId !== event.sourceClientId || event.reason !== 'changed') {
               const result = await this.updateAndSubmit(rootUri, event.document);
               this.actionDispatcher.dispatchAll(result);
            }
         }),
         this.state.modelService.onModelSaved(rootUri, async event => {
            if (this.state.clientId !== event.sourceClientId) {
               this.commandStack.saveIsDone();
            }
         })
      );

      this.logger.info('Workflow model loaded successfully from ' + rootUri);
   }

   /**
    * 更新模型
    * Update model
    */
   protected async update(uri: string, document?: AstCrossModelDocument): Promise<AstCrossModelDocument | undefined> {
      const doc = document ?? (await this.state.modelService.request(uri));

      if (doc) {
         this.state.setSemanticRoot(uri, doc.root);
         const actions = await this.updateEditMode(doc);
         if (actions.length > 0) {
            setTimeout(() => this.actionDispatcher.dispatchAll(actions), 0);
         }
      } else {
         this.logger.error('Could not find workflow model for ' + uri);
      }

      return doc;
   }

   /**
    * 更新编辑模式
    * Update edit mode
    */
   protected async updateEditMode(document: AstCrossModelDocument): Promise<Action[]> {
      const actions: Action[] = [];
      const prevEditMode = this.state.editMode;

      // 检查是否有错误诊断
      const hasErrors = document.diagnostics.filter(diagnostic => diagnostic.severity === DiagnosticSeverity.Error).length > 0;

      this.state.editMode = hasErrors ? EditMode.READONLY : EditMode.EDITABLE;

      if (prevEditMode !== this.state.editMode) {
         actions.push(SetEditModeAction.create(this.state.editMode));
      }

      return actions;
   }

   /**
    * 更新并提交模型（防抖处理）
    * Update and submit model (with debounce)
    */
   protected updateAndSubmit = debounce(async (rootUri: string, document: AstCrossModelDocument): Promise<Action[]> => {
      await this.update(rootUri, document);
      return [...(await this.submissionHandler.submitModel('external')), ...(await this.updateEditMode(document))];
   }, 250);

   /**
    * 保存源模型
    * Save source model
    */
   saveSourceModel(action: SaveModelAction): MaybePromise<void> {
      const saveUri = this.getFileUri(action);

      // 保存主文档
      this.state.modelService.save({
         uri: saveUri,
         model: this.state.semanticRoot,
         clientId: this.state.clientId
      });

      // 保存所有引用的文档
      AstUtils.streamReferences(this.state.semanticRoot)
         .map(refInfo => refInfo.reference.ref)
         .nonNullable()
         .map(ref => AstUtils.findRootNode(ref) as CrossModelRoot)
         .forEach(root =>
            this.state.modelService.save({
               uri: root.$document!.uri.toString(),
               model: root,
               clientId: this.state.clientId
            })
         );

      this.logger.info('Workflow model saved to ' + saveUri);
   }

   /**
    * 会话销毁时清理资源
    * Clean up resources when session is disposed
    */
   sessionDisposed(_clientSession: ClientSession): void {
      this.toDispose.dispose();
   }

   /**
    * 获取源URI
    * Get source URI
    */
   protected getSourceUri(action: RequestModelAction): string {
      const sourceUri = action.options?.[SOURCE_URI_ARG];
      if (typeof sourceUri !== 'string') {
         throw new GLSPServerError(`Invalid RequestModelAction! Missing argument with key '${SOURCE_URI_ARG}'`);
      }
      return sourceUri;
   }

   /**
    * 获取文件URI
    * Get file URI
    */
   protected getFileUri(action: SaveModelAction): string {
      const uri = action.fileUri ?? this.state.get(SOURCE_URI_ARG);
      if (!uri) {
         throw new GLSPServerError('Could not derive fileUri for saving the current source model');
      }
      return uri;
   }
}
