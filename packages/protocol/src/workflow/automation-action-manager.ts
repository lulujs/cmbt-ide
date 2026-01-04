/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { WorkflowEdge } from './edge';
import { WorkflowModel, getOutgoingEdges } from './model';
import { WorkflowNode } from './node';
import { AutomationAction, AutomationActionType } from './types';

/**
 * 自动化动作验证结果接口
 * Automation action validation result interface
 */
export interface AutomationActionValidationResult {
   valid: boolean;
   errors: string[];
}

/**
 * 自动化动作执行结果接口
 * Automation action execution result interface
 */
export interface AutomationActionExecutionResult {
   actionId: string;
   success: boolean;
   response?: unknown;
   errors?: string[];
   executionTime?: number;
}

/**
 * API调用配置接口
 * API call configuration interface
 */
export interface ApiCallConfiguration {
   url: string;
   method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
   headers?: Record<string, string>;
   body?: unknown;
   timeout?: number;
}

/**
 * 脚本配置接口
 * Script configuration interface
 */
export interface ScriptConfiguration {
   language: 'javascript' | 'python' | 'shell';
   code: string;
   timeout?: number;
}

/**
 * Webhook配置接口
 * Webhook configuration interface
 */
export interface WebhookConfiguration {
   url: string;
   method: 'GET' | 'POST';
   headers?: Record<string, string>;
   payload?: unknown;
   retryCount?: number;
}

/**
 * 生成唯一ID
 * Generate unique ID
 */
function generateId(): string {
   return `aa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 自动化动作管理器类
 * Automation action manager class
 */
export class AutomationActionManager {
   /**
    * 创建新的自动化动作
    * Create new automation action
    */
   static createAutomationAction(
      name: string,
      actionType: AutomationActionType,
      edgeBinding: string,
      configuration: Record<string, unknown> = {}
   ): AutomationAction {
      return {
         id: generateId(),
         name,
         actionType,
         configuration,
         edgeBinding
      };
   }

   /**
    * 创建API调用动作
    * Create API call action
    */
   static createApiCallAction(name: string, edgeBinding: string, config: ApiCallConfiguration): AutomationAction {
      return this.createAutomationAction(name, 'api_call', edgeBinding, config as unknown as Record<string, unknown>);
   }

   /**
    * 创建脚本动作
    * Create script action
    */
   static createScriptAction(name: string, edgeBinding: string, config: ScriptConfiguration): AutomationAction {
      return this.createAutomationAction(name, 'script', edgeBinding, config as unknown as Record<string, unknown>);
   }

   /**
    * 创建Webhook动作
    * Create webhook action
    */
   static createWebhookAction(name: string, edgeBinding: string, config: WebhookConfiguration): AutomationAction {
      return this.createAutomationAction(name, 'webhook', edgeBinding, config as unknown as Record<string, unknown>);
   }

   /**
    * 为节点添加自动化动作
    * Add automation action to node
    */
   static addActionToNode(node: WorkflowNode, action: AutomationAction): WorkflowNode {
      const existingActions = node.automationActions || [];
      return {
         ...node,
         automationActions: [...existingActions, action]
      };
   }

   /**
    * 从节点移除自动化动作
    * Remove automation action from node
    */
   static removeActionFromNode(node: WorkflowNode, actionId: string): WorkflowNode {
      if (!node.automationActions) {
         return node;
      }
      return {
         ...node,
         automationActions: node.automationActions.filter(a => a.id !== actionId)
      };
   }

   /**
    * 更新节点的自动化动作
    * Update automation action in node
    */
   static updateActionInNode(node: WorkflowNode, actionId: string, updates: Partial<Omit<AutomationAction, 'id'>>): WorkflowNode {
      if (!node.automationActions) {
         return node;
      }
      return {
         ...node,
         automationActions: node.automationActions.map(a => (a.id === actionId ? { ...a, ...updates } : a))
      };
   }

   /**
    * 获取节点的所有自动化动作
    * Get all automation actions for a node
    */
   static getActionsForNode(node: WorkflowNode): AutomationAction[] {
      return node.automationActions || [];
   }

   /**
    * 获取绑定到特定边的自动化动作
    * Get automation actions bound to a specific edge
    */
   static getActionsForEdge(node: WorkflowNode, edgeId: string): AutomationAction[] {
      if (!node.automationActions) {
         return [];
      }
      return node.automationActions.filter(a => a.edgeBinding === edgeId);
   }

   /**
    * 为边添加自动化动作
    * Add automation action to edge
    */
   static addActionToEdge(edge: WorkflowEdge, action: AutomationAction): WorkflowEdge {
      const existingActions = edge.automationActions || [];
      return {
         ...edge,
         automationActions: [...existingActions, { ...action, edgeBinding: edge.id }]
      };
   }

   /**
    * 从边移除自动化动作
    * Remove automation action from edge
    */
   static removeActionFromEdge(edge: WorkflowEdge, actionId: string): WorkflowEdge {
      if (!edge.automationActions) {
         return edge;
      }
      return {
         ...edge,
         automationActions: edge.automationActions.filter(a => a.id !== actionId)
      };
   }

   /**
    * 验证自动化动作
    * Validate automation action
    */
   static validateAction(action: AutomationAction): AutomationActionValidationResult {
      const errors: string[] = [];

      if (!action.id || action.id.trim() === '') {
         errors.push('Action ID is required');
      }

      if (!action.name || action.name.trim() === '') {
         errors.push('Action name is required');
      }

      if (!action.edgeBinding || action.edgeBinding.trim() === '') {
         errors.push('Edge binding is required');
      }

      const validActionTypes: AutomationActionType[] = ['api_call', 'script', 'webhook'];
      if (!validActionTypes.includes(action.actionType)) {
         errors.push(`Invalid action type: ${action.actionType}`);
      }

      // 根据动作类型验证配置
      const configErrors = this.validateActionConfiguration(action);
      errors.push(...configErrors);

      return {
         valid: errors.length === 0,
         errors
      };
   }

   /**
    * 验证动作配置
    * Validate action configuration
    */
   private static validateActionConfiguration(action: AutomationAction): string[] {
      const errors: string[] = [];
      const config = action.configuration;

      switch (action.actionType) {
         case 'api_call':
            if (!config.url) {
               errors.push('API call action requires a URL');
            }
            if (!config.method) {
               errors.push('API call action requires a method');
            }
            break;

         case 'script':
            if (!config.code) {
               errors.push('Script action requires code');
            }
            if (!config.language) {
               errors.push('Script action requires a language');
            }
            break;

         case 'webhook':
            if (!config.url) {
               errors.push('Webhook action requires a URL');
            }
            break;
      }

      return errors;
   }

   /**
    * 验证自动化动作与边的绑定
    * Validate automation action binding to edge
    */
   static validateEdgeBinding(model: WorkflowModel, nodeId: string, action: AutomationAction): AutomationActionValidationResult {
      const errors: string[] = [];

      // 检查节点是否存在
      const node = model.nodes.get(nodeId);
      if (!node) {
         errors.push(`Node with ID '${nodeId}' not found`);
         return { valid: false, errors };
      }

      // 获取节点的出边
      const outgoingEdges = getOutgoingEdges(model, nodeId);

      // 检查边是否存在
      const boundEdge = outgoingEdges.find(edge => edge.id === action.edgeBinding);
      if (!boundEdge) {
         errors.push(`Edge with ID '${action.edgeBinding}' is not an outgoing edge of node '${nodeId}'`);
      }

      return {
         valid: errors.length === 0,
         errors
      };
   }

   /**
    * 执行自动化动作（模拟执行）
    * Execute automation action (simulated execution)
    */
   static executeAction(
      action: AutomationAction,
      executor?: (action: AutomationAction) => Promise<unknown>
   ): Promise<AutomationActionExecutionResult> {
      const startTime = Date.now();

      return new Promise(async resolve => {
         try {
            // 如果提供了执行器，使用它来执行
            const response = executor ? await executor(action) : this.simulateExecution(action);

            resolve({
               actionId: action.id,
               success: true,
               response,
               executionTime: Date.now() - startTime
            });
         } catch (error) {
            resolve({
               actionId: action.id,
               success: false,
               errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
               executionTime: Date.now() - startTime
            });
         }
      });
   }

   /**
    * 模拟执行动作
    * Simulate action execution
    */
   private static simulateExecution(action: AutomationAction): unknown {
      switch (action.actionType) {
         case 'api_call':
            return { status: 200, message: 'Simulated API call success' };
         case 'script':
            return { status: 'completed', message: 'Simulated script execution success' };
         case 'webhook':
            return { status: 'delivered', message: 'Simulated webhook delivery success' };
         default:
            return { status: 'unknown', message: 'Unknown action type' };
      }
   }

   /**
    * 批量执行节点的所有自动化动作
    * Execute all automation actions for a node
    */
   static async executeAllActionsForNode(
      node: WorkflowNode,
      executor?: (action: AutomationAction) => Promise<unknown>
   ): Promise<AutomationActionExecutionResult[]> {
      const actions = this.getActionsForNode(node);
      const results = await Promise.all(actions.map(a => this.executeAction(a, executor)));
      return results;
   }

   /**
    * 执行绑定到特定边的自动化动作
    * Execute automation actions bound to a specific edge
    */
   static async executeActionsForEdge(
      node: WorkflowNode,
      edgeId: string,
      executor?: (action: AutomationAction) => Promise<unknown>
   ): Promise<AutomationActionExecutionResult[]> {
      const actions = this.getActionsForEdge(node, edgeId);
      const results = await Promise.all(actions.map(a => this.executeAction(a, executor)));
      return results;
   }

   /**
    * 克隆自动化动作（生成新ID）
    * Clone automation action (with new ID)
    */
   static cloneAction(action: AutomationAction, newEdgeBinding?: string): AutomationAction {
      return {
         ...action,
         id: generateId(),
         configuration: { ...action.configuration },
         edgeBinding: newEdgeBinding || action.edgeBinding
      };
   }

   /**
    * 批量绑定自动化动作到边
    * Batch bind automation actions to edges
    */
   static batchBindActionsToEdge(actions: AutomationAction[], edgeId: string): AutomationAction[] {
      return actions.map(a => ({
         ...a,
         edgeBinding: edgeId
      }));
   }

   /**
    * 按类型获取自动化动作
    * Get automation actions by type
    */
   static getActionsByType(node: WorkflowNode, actionType: AutomationActionType): AutomationAction[] {
      const actions = this.getActionsForNode(node);
      return actions.filter(a => a.actionType === actionType);
   }
}
