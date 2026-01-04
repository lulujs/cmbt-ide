/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Args, DefaultTypes } from '@eclipse-glsp/protocol';

// System Diagram
export const ENTITY_NODE_TYPE = DefaultTypes.NODE + ':entity';
export const RELATIONSHIP_EDGE_TYPE = DefaultTypes.EDGE + ':relationship';
export const INHERITANCE_EDGE_TYPE = DefaultTypes.EDGE + ':inheritance';
export const LABEL_ENTITY = DefaultTypes.LABEL + ':entity';

// Mapping Diagram
export const SOURCE_OBJECT_NODE_TYPE = DefaultTypes.NODE + ':source-object';
export const SOURCE_NUMBER_NODE_TYPE = DefaultTypes.NODE + ':source-number';
export const SOURCE_STRING_NODE_TYPE = DefaultTypes.NODE + ':source-string';
export const TARGET_OBJECT_NODE_TYPE = DefaultTypes.NODE + ':target-object';
export const TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE = DefaultTypes.EDGE + ':target-attribute-mapping';
export const ATTRIBUTE_COMPARTMENT_TYPE = DefaultTypes.COMPARTMENT + ':attribute';

// Workflow Diagram - Swimlane Types
export const SWIMLANE_NODE_TYPE = DefaultTypes.NODE + ':swimlane';
export const SWIMLANE_HEADER_TYPE = DefaultTypes.COMPARTMENT + ':swimlane-header';
export const SWIMLANE_CONTENT_TYPE = DefaultTypes.COMPARTMENT + ':swimlane-content';
export const SWIMLANE_LABEL_TYPE = DefaultTypes.LABEL + ':swimlane';

// Workflow Diagram - Concurrent Process Types
export const CONCURRENT_START_NODE_TYPE = DefaultTypes.NODE + ':concurrent-start';
export const CONCURRENT_END_NODE_TYPE = DefaultTypes.NODE + ':concurrent-end';
export const CONCURRENT_BRANCH_EDGE_TYPE = DefaultTypes.EDGE + ':concurrent-branch';
export const CONCURRENT_CONTAINER_TYPE = DefaultTypes.COMPARTMENT + ':concurrent-container';
export const CONCURRENT_LABEL_TYPE = DefaultTypes.LABEL + ':concurrent';

// Concurrent Process Args
export const CONCURRENT_BRANCH_COUNT = 'concurrent-branch-count';
export const CONCURRENT_PROCESS_ID = 'concurrent-process-id';
export const CONCURRENT_BRANCH_ID = 'concurrent-branch-id';

// Workflow Diagram - Node Types
export const WORKFLOW_BEGIN_NODE_TYPE = DefaultTypes.NODE + ':workflow-begin';
export const WORKFLOW_END_NODE_TYPE = DefaultTypes.NODE + ':workflow-end';
export const WORKFLOW_EXCEPTION_NODE_TYPE = DefaultTypes.NODE + ':workflow-exception';
export const WORKFLOW_PROCESS_NODE_TYPE = DefaultTypes.NODE + ':workflow-process';
export const WORKFLOW_DECISION_NODE_TYPE = DefaultTypes.NODE + ':workflow-decision';
export const WORKFLOW_DECISION_TABLE_NODE_TYPE = DefaultTypes.NODE + ':workflow-decision-table';
export const WORKFLOW_SUBPROCESS_NODE_TYPE = DefaultTypes.NODE + ':workflow-subprocess';
export const WORKFLOW_CONCURRENT_NODE_TYPE = DefaultTypes.NODE + ':workflow-concurrent';
export const WORKFLOW_AUTO_NODE_TYPE = DefaultTypes.NODE + ':workflow-auto';
export const WORKFLOW_API_NODE_TYPE = DefaultTypes.NODE + ':workflow-api';

// Workflow Diagram - Edge Types
export const WORKFLOW_EDGE_TYPE = DefaultTypes.EDGE + ':workflow-flow';

// Workflow Diagram - Label Types
export const WORKFLOW_NODE_LABEL_TYPE = DefaultTypes.LABEL + ':workflow-node';
export const WORKFLOW_EDGE_LABEL_TYPE = DefaultTypes.LABEL + ':workflow-edge';

// Workflow Node Args
export const WORKFLOW_NODE_TYPE_ARG = 'workflow-node-type';
export const WORKFLOW_EXPECTED_VALUE_ARG = 'workflow-expected-value';
export const WORKFLOW_REFERENCE_PATH_ARG = 'workflow-reference-path';
export const WORKFLOW_IS_REFERENCE_ARG = 'workflow-is-reference';
export const WORKFLOW_SOURCE_NODE_ID_ARG = 'workflow-source-node-id';

// Args
export const REFERENCE_CONTAINER_TYPE = 'reference-container-type';
export const REFERENCE_PROPERTY = 'reference-property';
export const REFERENCE_VALUE = 'reference-value';

// Swimlane Args
export const SWIMLANE_ORIENTATION = 'swimlane-orientation';
export const SWIMLANE_COLOR = 'swimlane-color';

export type RenderProps = Record<string, string | number | boolean | undefined> & {
   theme: 'light' | 'dark' | 'hc' | 'hcLight'; // supported ThemeType of Theia
};

export namespace RenderProps {
   export function key(name: string): string {
      return 'render-prop-' + name;
   }

   export function read(args: Args): Partial<RenderProps> {
      return Object.keys(args).reduce((renderProps, propKey) => {
         if (propKey.startsWith('render-prop-')) {
            renderProps[propKey.substring('render-prop-'.length)] = args[propKey];
         }
         return renderProps;
      }, {} as Args);
   }
   export const TARGET_ATTRIBUTE_IDX_NAME = 'attributeId';
   export const TARGET_ATTRIBUTE_IDX = RenderProps.key(TARGET_ATTRIBUTE_IDX_NAME);

   export const TARGET_ATTRIBUTE_MAPPING_IDX_NAME = 'mappingIndex';
   export const TARGET_ATTRIBUTE_MAPPING_IDX = RenderProps.key(TARGET_ATTRIBUTE_MAPPING_IDX_NAME);

   export const SOURCE_OBJECT_IDX_NAME = 'sourceObjectIndex';
   export const SOURCE_OBJECT_IDX = RenderProps.key(SOURCE_OBJECT_IDX_NAME);
}
