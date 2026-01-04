/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelFileExtensions, ModelStructure } from '@crossmodel/protocol';
import { URI, UriUtils } from 'langium';

/**
 * 工作流程项目信息接口
 * Workflow project information interface
 */
export interface WorkflowProjectInfo {
   id: string;
   name: string;
   directory: string;
   workflowFilePaths: string[];
   createdAt: string;
   updatedAt: string;
   version: string;
   description?: string;
   author?: string;
   tags?: string[];
}

/**
 * 工作流程项目创建参数
 * Workflow project creation parameters
 */
export interface CreateWorkflowProjectParams {
   name: string;
   directory: string;
   description?: string;
   author?: string;
   tags?: string[];
   template?: WorkflowProjectTemplate;
}

/**
 * 工作流程项目模板类型
 * Workflow project template types
 */
export type WorkflowProjectTemplate = 'empty' | 'basic' | 'approval' | 'parallel';

/**
 * 工作流程项目模板信息
 * Workflow project template information
 */
export interface WorkflowTemplateInfo {
   id: WorkflowProjectTemplate;
   name: string;
   description: string;
   icon: string;
}

/**
 * 可用的工作流程项目模板
 * Available workflow project templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplateInfo[] = [
   {
      id: 'empty',
      name: '空白项目',
      description: '创建一个空白的工作流程项目，从零开始设计您的业务流程',
      icon: 'file'
   },
   {
      id: 'basic',
      name: '基础流程',
      description: '包含开始、过程和结束节点的基础工作流程模板',
      icon: 'workflow'
   },
   {
      id: 'approval',
      name: '审批流程',
      description: '包含分支决策的审批工作流程模板，适用于审批场景',
      icon: 'checklist'
   },
   {
      id: 'parallel',
      name: '并行流程',
      description: '包含并发处理的工作流程模板，适用于并行任务场景',
      icon: 'split-horizontal'
   }
];

/**
 * 工作流程项目管理器
 * Workflow project manager
 *
 * Handles workflow-specific project operations including:
 * - Project creation with templates
 * - Project structure initialization
 * - Workflow file management
 * - Project statistics and analysis
 */
export class WorkflowProjectManager {
   /**
    * 获取可用的工作流程模板
    * Get available workflow templates
    */
   getAvailableTemplates(): WorkflowTemplateInfo[] {
      return WORKFLOW_TEMPLATES;
   }

   /**
    * 生成工作流程项目结构
    * Generate workflow project structure
    */
   generateProjectStructure(params: CreateWorkflowProjectParams): WorkflowProjectStructure {
      const now = new Date().toISOString();
      const projectId = this.generateProjectId(params.name);

      const structure: WorkflowProjectStructure = {
         projectInfo: {
            id: projectId,
            name: params.name,
            directory: params.directory,
            workflowFilePaths: [],
            createdAt: now,
            updatedAt: now,
            version: '1.0.0',
            description: params.description,
            author: params.author,
            tags: params.tags
         },
         files: []
      };

      // Add datamodel.cm file
      structure.files.push({
         path: 'datamodel.cm',
         content: this.generateDataModelContent(params)
      });

      // Add workflows folder
      structure.files.push({
         path: ModelStructure.WorkflowDiagram.FOLDER + '/.gitkeep',
         content: ''
      });

      // Add template-specific files
      if (params.template && params.template !== 'empty') {
         const templateFiles = this.generateTemplateFiles(params.template, projectId);
         structure.files.push(...templateFiles);
         structure.projectInfo.workflowFilePaths = templateFiles
            .filter(f => f.path.endsWith(ModelFileExtensions.WorkflowDiagram))
            .map(f => f.path);
      }

      return structure;
   }

   /**
    * 生成项目ID
    * Generate project ID
    */
   private generateProjectId(name: string): string {
      return name
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '_')
         .replace(/^_+|_+$/g, '');
   }

   /**
    * 生成 datamodel.cm 内容
    * Generate datamodel.cm content
    */
   private generateDataModelContent(params: CreateWorkflowProjectParams): string {
      const lines: string[] = [
         'datamodel:',
         `    id: ${this.generateProjectId(params.name)}`,
         `    name: "${params.name}"`,
         '    type: logical',
         '    version: 1.0.0'
      ];

      if (params.description) {
         lines.push(`    description: "${params.description}"`);
      }

      return lines.join('\n');
   }

   /**
    * 生成模板文件
    * Generate template files
    */
   private generateTemplateFiles(template: WorkflowProjectTemplate, projectId: string): ProjectFile[] {
      const files: ProjectFile[] = [];
      const workflowFolder = ModelStructure.WorkflowDiagram.FOLDER;

      switch (template) {
         case 'basic':
            files.push({
               path: `${workflowFolder}/BasicWorkflow${ModelFileExtensions.WorkflowDiagram}`,
               content: this.generateBasicWorkflowContent(projectId)
            });
            break;
         case 'approval':
            files.push({
               path: `${workflowFolder}/ApprovalWorkflow${ModelFileExtensions.WorkflowDiagram}`,
               content: this.generateApprovalWorkflowContent(projectId)
            });
            break;
         case 'parallel':
            files.push({
               path: `${workflowFolder}/ParallelWorkflow${ModelFileExtensions.WorkflowDiagram}`,
               content: this.generateParallelWorkflowContent(projectId)
            });
            break;
      }

      return files;
   }

   /**
    * 生成基础工作流程内容
    * Generate basic workflow content
    */
   private generateBasicWorkflowContent(projectId: string): string {
      return `workflow:
    id: ${projectId}_basic_workflow
    name: "基础工作流程"
    metadata:
        version: "1.0.0"
    nodes:
        - begin:
            id: start_node
            name: "开始"
            position:
                x: 100
                y: 100
        - process:
            id: process_node
            name: "处理步骤"
            position:
                x: 300
                y: 100
        - end:
            id: end_node
            name: "结束"
            expectedValue: "success"
            position:
                x: 500
                y: 100
    edges:
        - edge:
            id: edge_1
            source: start_node
            target: process_node
        - edge:
            id: edge_2
            source: process_node
            target: end_node
`;
   }

   /**
    * 生成审批工作流程内容
    * Generate approval workflow content
    */
   private generateApprovalWorkflowContent(projectId: string): string {
      return `workflow:
    id: ${projectId}_approval_workflow
    name: "审批工作流程"
    metadata:
        version: "1.0.0"
    nodes:
        - begin:
            id: start_node
            name: "提交申请"
            position:
                x: 100
                y: 200
        - process:
            id: review_node
            name: "审核"
            position:
                x: 300
                y: 200
        - decision:
            id: decision_node
            name: "审批决策"
            position:
                x: 500
                y: 200
            branches:
                - id: approve_branch
                  value: "approved"
                - id: reject_branch
                  value: "rejected"
                  isDefault: true
        - end:
            id: approved_end
            name: "审批通过"
            expectedValue: "approved"
            position:
                x: 700
                y: 100
        - end:
            id: rejected_end
            name: "审批拒绝"
            expectedValue: "rejected"
            position:
                x: 700
                y: 300
    edges:
        - edge:
            id: edge_1
            source: start_node
            target: review_node
        - edge:
            id: edge_2
            source: review_node
            target: decision_node
        - edge:
            id: edge_3
            source: decision_node
            target: approved_end
            value: "approved"
        - edge:
            id: edge_4
            source: decision_node
            target: rejected_end
            value: "rejected"
`;
   }

   /**
    * 生成并行工作流程内容
    * Generate parallel workflow content
    */
   private generateParallelWorkflowContent(projectId: string): string {
      return `workflow:
    id: ${projectId}_parallel_workflow
    name: "并行工作流程"
    metadata:
        version: "1.0.0"
    nodes:
        - begin:
            id: start_node
            name: "开始"
            position:
                x: 100
                y: 200
        - concurrent:
            id: parallel_start
            name: "并行开始"
            position:
                x: 300
                y: 200
            parallelBranches:
                - id: branch_1
                  name: "分支1"
                - id: branch_2
                  name: "分支2"
        - process:
            id: task_1
            name: "任务1"
            position:
                x: 500
                y: 100
        - process:
            id: task_2
            name: "任务2"
            position:
                x: 500
                y: 300
        - concurrent:
            id: parallel_end
            name: "并行结束"
            position:
                x: 700
                y: 200
        - end:
            id: end_node
            name: "结束"
            expectedValue: "success"
            position:
                x: 900
                y: 200
    edges:
        - edge:
            id: edge_1
            source: start_node
            target: parallel_start
        - edge:
            id: edge_2
            source: parallel_start
            target: task_1
        - edge:
            id: edge_3
            source: parallel_start
            target: task_2
        - edge:
            id: edge_4
            source: task_1
            target: parallel_end
        - edge:
            id: edge_5
            source: task_2
            target: parallel_end
        - edge:
            id: edge_6
            source: parallel_end
            target: end_node
`;
   }

   /**
    * 计算工作流程项目统计信息
    * Calculate workflow project statistics
    */
   calculateProjectStatistics(projectInfo: WorkflowProjectInfo): WorkflowProjectStatistics {
      return {
         totalWorkflows: projectInfo.workflowFilePaths.length,
         lastUpdated: projectInfo.updatedAt,
         version: projectInfo.version
      };
   }

   /**
    * 验证工作流程文件路径
    * Validate workflow file path
    */
   isValidWorkflowPath(uri: URI): boolean {
      const path = uri.path;
      return ModelFileExtensions.isWorkflowDiagramFile(path);
   }

   /**
    * 获取工作流程文件夹路径
    * Get workflow folder path
    */
   getWorkflowFolderPath(projectDirectory: URI): URI {
      return UriUtils.joinPath(projectDirectory, ModelStructure.WorkflowDiagram.FOLDER);
   }
}

/**
 * 工作流程项目结构
 * Workflow project structure
 */
export interface WorkflowProjectStructure {
   projectInfo: WorkflowProjectInfo;
   files: ProjectFile[];
}

/**
 * 项目文件
 * Project file
 */
export interface ProjectFile {
   path: string;
   content: string;
}

/**
 * 工作流程项目统计信息
 * Workflow project statistics
 */
export interface WorkflowProjectStatistics {
   totalWorkflows: number;
   lastUpdated: string;
   version: string;
}
