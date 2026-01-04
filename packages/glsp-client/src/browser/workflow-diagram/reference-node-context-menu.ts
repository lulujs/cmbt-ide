/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Action, Args, GModelElement, GModelRoot, LabeledAction, Point } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';

/**
 * 创建引用节点的动作
 * Action to create a reference node
 */
export interface CreateReferenceNodeAction extends Action {
   kind: typeof CreateReferenceNodeAction.KIND;
   sourceNodeId: string;
   position?: Point;
}

export namespace CreateReferenceNodeAction {
   export const KIND = 'createReferenceNode';

   export function is(action: Action): action is CreateReferenceNodeAction {
      return action.kind === KIND;
   }

   export function create(sourceNodeId: string, position?: Point): CreateReferenceNodeAction {
      return {
         kind: KIND,
         sourceNodeId,
         position
      };
   }
}

/**
 * 批量创建引用节点的动作
 * Action to create multiple reference nodes
 */
export interface CreateBatchReferenceNodesAction extends Action {
   kind: typeof CreateBatchReferenceNodesAction.KIND;
   sourceNodeIds: string[];
}

export namespace CreateBatchReferenceNodesAction {
   export const KIND = 'createBatchReferenceNodes';

   export function is(action: Action): action is CreateBatchReferenceNodesAction {
      return action.kind === KIND;
   }

   export function create(sourceNodeIds: string[]): CreateBatchReferenceNodesAction {
      return {
         kind: KIND,
         sourceNodeIds
      };
   }
}

/**
 * 引用节点类型常量
 * Reference node type constants
 * 需求 4.1: 支持引用的节点类型
 */
export const REFERENCEABLE_NODE_TYPES = ['begin', 'end', 'process', 'decision', 'decision_table', 'auto', 'exception'];

/**
 * 检查节点是否支持创建引用
 * Check if a node supports reference creation
 */
export function isReferenceableNode(element: GModelElement): boolean {
   const nodeType = element.type?.toLowerCase() || '';
   return REFERENCEABLE_NODE_TYPES.some(type => nodeType.includes(type));
}

/**
 * 检查节点是否是引用节点
 * Check if a node is a reference node
 */
export function isReferenceNode(element: GModelElement): boolean {
   // Check if the element has reference-specific properties
   const args = (element as unknown as { args?: Args }).args;
   return args?.isReference === true;
}

/**
 * 获取引用节点的上下文菜单项
 * Get context menu items for reference nodes
 * 需求 4.1: 右键点击支持引用的节点时显示创建引用选项
 */
@injectable()
export class ReferenceNodeContextMenuItemProvider {
   /**
    * 获取上下文菜单项
    * Get context menu items
    */
   async getItems(root: Readonly<GModelRoot>, lastMousePosition?: Point): Promise<LabeledAction[]> {
      const items: LabeledAction[] = [];
      const selectedElements = this.getSelectedElements(root);

      if (selectedElements.length === 0) {
         return items;
      }

      // Filter to only referenceable nodes that are not already references
      const referenceableNodes = selectedElements.filter(element => isReferenceableNode(element) && !isReferenceNode(element));

      if (referenceableNodes.length === 0) {
         return items;
      }

      // Single node selection - show "Create Reference" option
      if (referenceableNodes.length === 1) {
         items.push({
            label: '创建引用 (Create Reference)',
            actions: [CreateReferenceNodeAction.create(referenceableNodes[0].id, lastMousePosition)],
            icon: 'codicon codicon-references'
         });
      }

      // Multiple node selection - show "Create Batch References" option
      if (referenceableNodes.length > 1) {
         items.push({
            label: `批量创建引用 (Create ${referenceableNodes.length} References)`,
            actions: [CreateBatchReferenceNodesAction.create(referenceableNodes.map(n => n.id))],
            icon: 'codicon codicon-references'
         });
      }

      return items;
   }

   /**
    * 获取选中的元素
    * Get selected elements from the model root
    */
   protected getSelectedElements(root: Readonly<GModelRoot>): GModelElement[] {
      const selected: GModelElement[] = [];

      const collectSelected = (element: GModelElement): void => {
         if ((element as unknown as { selected?: boolean }).selected) {
            selected.push(element);
         }
         const children = (element as unknown as { children?: GModelElement[] }).children;
         if (children) {
            children.forEach((child: GModelElement) => collectSelected(child));
         }
      };

      collectSelected(root);
      return selected;
   }
}
