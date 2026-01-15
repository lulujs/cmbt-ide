/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   WORKFLOW_API_NODE_TYPE,
   WORKFLOW_AUTO_NODE_TYPE,
   WORKFLOW_BEGIN_NODE_TYPE,
   WORKFLOW_CONCURRENT_NODE_TYPE,
   WORKFLOW_DECISION_NODE_TYPE,
   WORKFLOW_DECISION_TABLE_NODE_TYPE,
   WORKFLOW_EDGE_LABEL_TYPE,
   WORKFLOW_EDGE_TYPE,
   WORKFLOW_END_NODE_TYPE,
   WORKFLOW_EXCEPTION_NODE_TYPE,
   WORKFLOW_EXPECTED_VALUE_ARG,
   WORKFLOW_NODE_LABEL_TYPE,
   WORKFLOW_NODE_TYPE_ARG,
   WORKFLOW_PROCESS_NODE_TYPE,
   WORKFLOW_REFERENCE_PATH_ARG,
   WORKFLOW_SUBPROCESS_NODE_TYPE
} from '@crossmodel/protocol';
import {
   Args,
   ArgsAware,
   BoundsAware,
   Dimension,
   EditableLabel,
   GChildElement,
   GEdge,
   GLabel,
   GModelElement,
   Hoverable,
   isEditableLabel,
   RectangularNode,
   Selectable,
   WithEditableLabel
} from '@eclipse-glsp/client';
import { Deletable } from 'sprotty';
import { findElementBy } from './swimlane-model';

/**
 * 工作流程节点基类
 * Base class for workflow nodes
 */
abstract class BaseWorkflowNode extends RectangularNode implements WithEditableLabel, ArgsAware, Deletable {
   args?: Args;

   get nodeType(): string | undefined {
      return this.args?.[WORKFLOW_NODE_TYPE_ARG] as string | undefined;
   }

   get editableLabel(): (GChildElement & EditableLabel) | undefined {
      return findElementBy(this, isEditableLabel) as (GChildElement & EditableLabel) | undefined;
   }
}

// ============= 开始节点 =============
export class WorkflowBeginNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 60, height: 60 };

   static is(element?: GModelElement): element is WorkflowBeginNode {
      return !!element && element.type === WORKFLOW_BEGIN_NODE_TYPE;
   }
}

// ============= 结束节点 =============
export class WorkflowEndNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 60, height: 60 };

   get expectedValue(): string | undefined {
      return this.args?.[WORKFLOW_EXPECTED_VALUE_ARG] as string | undefined;
   }

   static is(element?: GModelElement): element is WorkflowEndNode {
      return !!element && element.type === WORKFLOW_END_NODE_TYPE;
   }
}

// ============= 异常节点 =============
export class WorkflowExceptionNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 60, height: 60 };

   get expectedValue(): string | undefined {
      return this.args?.[WORKFLOW_EXPECTED_VALUE_ARG] as string | undefined;
   }

   static is(element?: GModelElement): element is WorkflowExceptionNode {
      return !!element && element.type === WORKFLOW_EXCEPTION_NODE_TYPE;
   }
}

// ============= 过程节点 =============
export class WorkflowProcessNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 120, height: 60 };

   static is(element?: GModelElement): element is WorkflowProcessNode {
      return !!element && element.type === WORKFLOW_PROCESS_NODE_TYPE;
   }
}

// ============= 分支节点 =============
export class WorkflowDecisionNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 80, height: 80 };

   static is(element?: GModelElement): element is WorkflowDecisionNode {
      return !!element && element.type === WORKFLOW_DECISION_NODE_TYPE;
   }
}

// ============= 决策表节点 =============
export class WorkflowDecisionTableNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 200, height: 120 };

   static is(element?: GModelElement): element is WorkflowDecisionTableNode {
      return !!element && element.type === WORKFLOW_DECISION_TABLE_NODE_TYPE;
   }
}

// ============= 子流程节点 =============
export class WorkflowSubprocessNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 140, height: 80 };

   get referencePath(): string | undefined {
      return this.args?.[WORKFLOW_REFERENCE_PATH_ARG] as string | undefined;
   }

   static is(element?: GModelElement): element is WorkflowSubprocessNode {
      return !!element && element.type === WORKFLOW_SUBPROCESS_NODE_TYPE;
   }
}

// ============= 并发节点 =============
export class WorkflowConcurrentNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 160, height: 100 };

   static is(element?: GModelElement): element is WorkflowConcurrentNode {
      return !!element && element.type === WORKFLOW_CONCURRENT_NODE_TYPE;
   }
}

// ============= Auto节点 =============
export class WorkflowAutoNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 120, height: 60 };

   static is(element?: GModelElement): element is WorkflowAutoNode {
      return !!element && element.type === WORKFLOW_AUTO_NODE_TYPE;
   }
}

// ============= API节点 =============
export class WorkflowApiNode extends BaseWorkflowNode {
   static readonly DEFAULT_SIZE = { width: 120, height: 60 };

   static is(element?: GModelElement): element is WorkflowApiNode {
      return !!element && element.type === WORKFLOW_API_NODE_TYPE;
   }
}

// ============= 工作流程边 =============
export class WorkflowEdge extends GEdge implements ArgsAware, Deletable {
   override args?: Args;

   get edgeValue(): string | undefined {
      return this.args?.['edgeValue'] as string | undefined;
   }

   get condition(): string | undefined {
      return this.args?.['condition'] as string | undefined;
   }

   get dataType(): string | undefined {
      return this.args?.['dataType'] as string | undefined;
   }

   static is(element?: GModelElement): element is WorkflowEdge {
      return !!element && element.type === WORKFLOW_EDGE_TYPE;
   }
}

// ============= 工作流程节点标签 =============
export class WorkflowNodeLabel extends GLabel implements EditableLabel {
   editControlPositionCorrection = {
      x: -5,
      y: -3
   };

   get editControlDimension(): Dimension {
      const parentBounds = (this.parent as any as BoundsAware).bounds;
      return {
         width: parentBounds?.width ? parentBounds.width - 10 : this.bounds.width,
         height: parentBounds?.height ? parentBounds.height : 24
      };
   }

   static is(element?: GModelElement): element is WorkflowNodeLabel {
      return !!element && element.type === WORKFLOW_NODE_LABEL_TYPE;
   }
}

// ============= 工作流程边标签 =============
export class WorkflowEdgeLabel extends GLabel implements Hoverable, Selectable {
   hoverFeedback = false;
   override selected = false;

   static is(element?: GModelElement): element is WorkflowEdgeLabel {
      return !!element && element.type === WORKFLOW_EDGE_LABEL_TYPE;
   }
}

/**
 * 检查元素是否为工作流程节点
 * Check if element is a workflow node
 */
export function isWorkflowNode(element?: GModelElement): boolean {
   return (
      WorkflowBeginNode.is(element) ||
      WorkflowEndNode.is(element) ||
      WorkflowExceptionNode.is(element) ||
      WorkflowProcessNode.is(element) ||
      WorkflowDecisionNode.is(element) ||
      WorkflowDecisionTableNode.is(element) ||
      WorkflowSubprocessNode.is(element) ||
      WorkflowConcurrentNode.is(element) ||
      WorkflowAutoNode.is(element) ||
      WorkflowApiNode.is(element)
   );
}
