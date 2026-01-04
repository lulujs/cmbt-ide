/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

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
 * 工作流程项目统计信息
 * Workflow project statistics
 */
export interface WorkflowProjectStatistics {
   totalWorkflows: number;
   totalNodes: number;
   totalEdges: number;
   totalSwimlanes: number;
   nodeTypeDistribution: Record<string, number>;
   lastUpdated: string;
   version: string;
}

/**
 * 工作流程项目配置选项
 * Workflow project configuration options
 */
export interface WorkflowProjectConfig {
   /** 是否启用自动保存 */
   autoSave: boolean;
   /** 自动保存间隔（毫秒） */
   autoSaveInterval: number;
   /** 是否启用版本控制 */
   versionControl: boolean;
   /** 默认工作流程模板 */
   defaultTemplate: WorkflowProjectTemplate;
   /** 是否显示网格 */
   showGrid: boolean;
   /** 网格大小 */
   gridSize: number;
   /** 是否启用对齐到网格 */
   snapToGrid: boolean;
   /** 默认节点宽度 */
   defaultNodeWidth: number;
   /** 默认节点高度 */
   defaultNodeHeight: number;
}

/**
 * 默认工作流程项目配置
 * Default workflow project configuration
 */
export const DEFAULT_WORKFLOW_PROJECT_CONFIG: WorkflowProjectConfig = {
   autoSave: true,
   autoSaveInterval: 30000, // 30 seconds
   versionControl: true,
   defaultTemplate: 'empty',
   showGrid: true,
   gridSize: 20,
   snapToGrid: true,
   defaultNodeWidth: 150,
   defaultNodeHeight: 60
};

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
 * 工作流程项目分析结果
 * Workflow project analysis result
 */
export interface WorkflowProjectAnalysis {
   /** 项目健康度评分 (0-100) */
   healthScore: number;
   /** 发现的问题 */
   issues: WorkflowIssue[];
   /** 优化建议 */
   suggestions: WorkflowSuggestion[];
   /** 复杂度指标 */
   complexity: WorkflowComplexity;
}

/**
 * 工作流程问题
 * Workflow issue
 */
export interface WorkflowIssue {
   severity: 'error' | 'warning' | 'info';
   message: string;
   location?: string;
   code?: string;
}

/**
 * 工作流程优化建议
 * Workflow suggestion
 */
export interface WorkflowSuggestion {
   type: 'performance' | 'readability' | 'maintainability';
   message: string;
   priority: 'high' | 'medium' | 'low';
}

/**
 * 工作流程复杂度指标
 * Workflow complexity metrics
 */
export interface WorkflowComplexity {
   /** 圈复杂度 */
   cyclomaticComplexity: number;
   /** 嵌套深度 */
   nestingDepth: number;
   /** 分支因子 */
   branchingFactor: number;
   /** 路径数量 */
   pathCount: number;
}
