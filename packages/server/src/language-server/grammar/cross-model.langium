grammar CrossModel

import 'datamodel'
import 'entity'
import 'relationship'
import 'system-diagram'
import 'mapping'
import 'workflow'

entry CrossModelRoot:
    (datamodel=DataModel | 
    entity=LogicalEntity | 
    relationship=Relationship | 
    systemDiagram=SystemDiagram |
    mapping=Mapping |
    workflowModel=WorkflowModel)?;
