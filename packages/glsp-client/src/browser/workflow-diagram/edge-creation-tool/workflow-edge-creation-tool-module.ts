/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { FeatureModule, edgeCreationToolModule, viewportModule } from '@eclipse-glsp/client';

export const workflowEdgeCreationToolModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      // Use default edge creation tool from GLSP
      // The edgeCreationToolModule is included via requires below
   },
   { requires: [edgeCreationToolModule, viewportModule] }
);
