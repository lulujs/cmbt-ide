/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowValidationErrors } from '@crossmodel/protocol';
import { LangiumDocument } from 'langium';
import { CodeAction, CodeActionKind, CodeActionParams, Diagnostic, TextEdit } from 'vscode-languageserver-protocol';

/**
 * 工作流程代码动作提供器
 * Workflow code action provider for auto-fix suggestions
 */
export class WorkflowCodeActionProvider {
   /**
    * 获取代码动作
    * Get code actions for workflow validation errors
    */
   getCodeActions(document: LangiumDocument, params: CodeActionParams): CodeAction[] {
      const result: CodeAction[] = [];

      for (const diagnostic of params.context.diagnostics) {
         const actions = this.getActionsForDiagnostic(diagnostic, document);
         result.push(...actions);
      }

      return result;
   }

   /**
    * 根据诊断获取代码动作
    * Get code actions for a specific diagnostic
    */
   private getActionsForDiagnostic(diagnostic: Diagnostic, document: LangiumDocument): CodeAction[] {
      const code = diagnostic.data?.code as string | undefined;
      if (!code) {
         return [];
      }

      const actions: (CodeAction | undefined)[] = [];

      switch (code) {
         case WorkflowValidationErrors.WorkflowMissingName:
            actions.push(this.createAddWorkflowNameAction(diagnostic, document));
            break;

         case WorkflowValidationErrors.DecisionNodeInsufficientBranches:
            actions.push(this.createAddDefaultBranchesAction(diagnostic));
            break;

         case WorkflowValidationErrors.DecisionNodeDuplicateBranchValues:
            actions.push(this.createFixDuplicateBranchValuesAction(diagnostic));
            break;

         case WorkflowValidationErrors.ProcessNodeMultipleOutgoingEdges:
            actions.push(this.createConvertToDecisionNodeAction(diagnostic));
            break;

         case WorkflowValidationErrors.EndNodeMissingExpectedValue:
         case WorkflowValidationErrors.ExceptionNodeMissingExpectedValue:
            actions.push(this.createAddExpectedValueAction(diagnostic));
            break;

         case WorkflowValidationErrors.BeginNodeMissingName:
         case WorkflowValidationErrors.EndNodeMissingName:
         case WorkflowValidationErrors.ExceptionNodeMissingName:
         case WorkflowValidationErrors.ProcessNodeMissingName:
         case WorkflowValidationErrors.DecisionNodeMissingName:
         case WorkflowValidationErrors.DecisionTableMissingName:
         case WorkflowValidationErrors.SubprocessNodeMissingName:
         case WorkflowValidationErrors.ConcurrentNodeMissingName:
         case WorkflowValidationErrors.AutoNodeMissingName:
         case WorkflowValidationErrors.ApiNodeMissingName:
            actions.push(this.createAddNodeNameAction(diagnostic, code));
            break;

         case WorkflowValidationErrors.WorkflowMissingBeginNode:
            actions.push(this.createAddBeginNodeAction(diagnostic));
            break;

         case WorkflowValidationErrors.WorkflowMissingEndNode:
            actions.push(this.createAddEndNodeAction(diagnostic));
            break;
      }

      return actions.filter((a): a is CodeAction => a !== undefined);
   }

   /**
    * 创建添加工作流程名称的动作
    * Create action to add workflow name
    */
   private createAddWorkflowNameAction(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
      return {
         title: '添加工作流程名称 (Add workflow name)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic],
         edit: {
            changes: {
               [document.uri.toString()]: [TextEdit.insert(diagnostic.range.start, 'name: "MyWorkflow" ')]
            }
         }
      };
   }

   /**
    * 创建添加默认分支的动作
    * Create action to add default branches
    */
   private createAddDefaultBranchesAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '添加默认分支 (Add default branches)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic],
         isPreferred: true
      };
   }

   /**
    * 创建修复重复分支值的动作
    * Create action to fix duplicate branch values
    */
   private createFixDuplicateBranchValuesAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '修复重复的分支值 (Fix duplicate branch values)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic]
      };
   }

   /**
    * 创建转换为分支节点的动作
    * Create action to convert process node to decision node
    */
   private createConvertToDecisionNodeAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '转换为分支节点 (Convert to decision node)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic]
      };
   }

   /**
    * 创建添加预期值的动作
    * Create action to add expected value
    */
   private createAddExpectedValueAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '添加预期值 (Add expected value)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic],
         isPreferred: true
      };
   }

   /**
    * 创建添加节点名称的动作
    * Create action to add node name
    */
   private createAddNodeNameAction(diagnostic: Diagnostic, code: string): CodeAction {
      const nodeType = WorkflowValidationErrors.getNodeTypeFromCode(code);
      const defaultName = this.getDefaultNodeName(nodeType);

      return {
         title: `添加节点名称 (Add node name: "${defaultName}")`,
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic]
      };
   }

   /**
    * 创建添加开始节点的动作
    * Create action to add begin node
    */
   private createAddBeginNodeAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '添加开始节点 (Add begin node)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic],
         isPreferred: true
      };
   }

   /**
    * 创建添加结束节点的动作
    * Create action to add end node
    */
   private createAddEndNodeAction(diagnostic: Diagnostic): CodeAction {
      return {
         title: '添加结束节点 (Add end node)',
         kind: CodeActionKind.QuickFix,
         diagnostics: [diagnostic],
         isPreferred: true
      };
   }

   /**
    * 获取默认节点名称
    * Get default node name based on type
    */
   private getDefaultNodeName(nodeType: string | undefined): string {
      const defaultNames: Record<string, string> = {
         begin: 'Start',
         end: 'End',
         exception: 'Exception',
         process: 'Process',
         decision: 'Decision',
         'decision-table': 'DecisionTable',
         subprocess: 'Subprocess',
         concurrent: 'Concurrent',
         auto: 'Auto',
         api: 'API'
      };
      return defaultNames[nodeType || ''] || 'Node';
   }
}

/**
 * 工作流程验证状态接口
 * Workflow validation status interface
 */
export interface WorkflowValidationStatus {
   isValid: boolean;
   errorCount: number;
   warningCount: number;
   infoCount: number;
   lastValidated: Date;
}

/**
 * 创建验证状态
 * Create validation status
 */
export function createValidationStatus(errorCount: number, warningCount: number, infoCount: number): WorkflowValidationStatus {
   return {
      isValid: errorCount === 0,
      errorCount,
      warningCount,
      infoCount,
      lastValidated: new Date()
   };
}
