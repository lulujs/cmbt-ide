/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 * Workflow Tutorial Service - 工作流程教程服务
 * 需求 8.1-8.3: 新用户的引导和教程系统
 ********************************************************************************/

import { CommandService, MessageService } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { inject, injectable } from '@theia/core/shared/inversify';

export interface TutorialStep {
   id: string;
   title: string;
   description: string;
   target?: string; // CSS selector for highlighting
   action?: string; // Command to execute
   content: string; // Markdown content
   nextStep?: string;
   prevStep?: string;
   position?: 'top' | 'bottom' | 'left' | 'right';
   skippable?: boolean;
}

export interface Tutorial {
   id: string;
   title: string;
   description: string;
   category: 'beginner' | 'intermediate' | 'advanced';
   estimatedTime: number; // in minutes
   steps: TutorialStep[];
   prerequisites?: string[];
}

/**
 * Service for managing workflow tutorials and user guidance
 * 工作流程教程和用户引导服务
 */
@injectable()
export class WorkflowTutorialService {
   private static readonly TUTORIAL_PREFERENCE_KEY = 'workflow.tutorial.completed';
   private static readonly SHOW_WELCOME_KEY = 'workflow.tutorial.showWelcome';

   private currentTutorial?: Tutorial;
   private currentStepIndex = 0;
   private tutorialOverlay?: HTMLElement;

   constructor(
      @inject(MessageService) private readonly messageService: MessageService,
      @inject(CommandService) private readonly commandService: CommandService,
      @inject(PreferenceService) private readonly preferenceService: PreferenceService,
      @inject(WindowService) private readonly windowService: WindowService
   ) {
      this.initializeTutorials();
   }

   /**
    * Initialize available tutorials
    * 初始化可用的教程
    */
   private initializeTutorials(): void {
      // Check if user should see welcome tutorial
      const showWelcome = this.preferenceService.get(WorkflowTutorialService.SHOW_WELCOME_KEY, true);
      if (showWelcome) {
         setTimeout(() => this.showWelcomeDialog(), 1000);
      }
   }

   /**
    * Show welcome dialog for new users
    * 为新用户显示欢迎对话框
    */
   private async showWelcomeDialog(): Promise<void> {
      const result = await this.messageService.info(
         '欢迎使用工作流程建模器！\n\n这是您第一次使用吗？我们可以为您提供快速入门教程。',
         '开始教程',
         '稍后提醒',
         '不再显示'
      );

      switch (result) {
         case '开始教程':
            await this.startTutorial('getting-started');
            break;
         case '稍后提醒':
            // Do nothing, will show again next time
            break;
         case '不再显示':
            await this.preferenceService.set(WorkflowTutorialService.SHOW_WELCOME_KEY, false);
            break;
      }
   }

   /**
    * Start a specific tutorial
    * 开始特定的教程
    */
   async startTutorial(tutorialId: string): Promise<void> {
      const tutorial = this.getTutorial(tutorialId);
      if (!tutorial) {
         this.messageService.error(`教程 "${tutorialId}" 不存在`);
         return;
      }

      this.currentTutorial = tutorial;
      this.currentStepIndex = 0;

      await this.showTutorialStep();
   }

   /**
    * Show current tutorial step
    * 显示当前教程步骤
    */
   private async showTutorialStep(): Promise<void> {
      if (!this.currentTutorial) return;

      const step = this.currentTutorial.steps[this.currentStepIndex];
      if (!step) {
         await this.completeTutorial();
         return;
      }

      this.createTutorialOverlay(step);

      // Execute step action if specified
      if (step.action) {
         try {
            await this.commandService.executeCommand(step.action);
         } catch (error) {
            console.warn(`Failed to execute tutorial action: ${step.action}`, error);
         }
      }
   }

   /**
    * Create tutorial overlay UI
    * 创建教程覆盖层界面
    */
   private createTutorialOverlay(step: TutorialStep): void {
      this.removeTutorialOverlay();

      const overlay = document.createElement('div');
      overlay.className = 'workflow-tutorial-overlay';
      overlay.innerHTML = `
         <div class="tutorial-backdrop"></div>
         <div class="tutorial-popup" data-position="${step.position || 'center'}">
            <div class="tutorial-header">
               <h3 class="tutorial-title">${step.title}</h3>
               <button class="tutorial-close" title="关闭教程">×</button>
            </div>
            <div class="tutorial-content">
               <div class="tutorial-description">${step.description}</div>
               <div class="tutorial-markdown">${this.renderMarkdown(step.content)}</div>
            </div>
            <div class="tutorial-footer">
               <div class="tutorial-progress">
                  步骤 ${this.currentStepIndex + 1} / ${this.currentTutorial!.steps.length}
               </div>
               <div class="tutorial-actions">
                  ${this.currentStepIndex > 0 ? '<button class="tutorial-prev">上一步</button>' : ''}
                  ${step.skippable ? '<button class="tutorial-skip">跳过</button>' : ''}
                  <button class="tutorial-next">${this.isLastStep() ? '完成' : '下一步'}</button>
               </div>
            </div>
         </div>
      `;

      // Add event listeners
      const closeBtn = overlay.querySelector('.tutorial-close') as HTMLButtonElement;
      const prevBtn = overlay.querySelector('.tutorial-prev') as HTMLButtonElement;
      const nextBtn = overlay.querySelector('.tutorial-next') as HTMLButtonElement;
      const skipBtn = overlay.querySelector('.tutorial-skip') as HTMLButtonElement;

      closeBtn?.addEventListener('click', () => this.closeTutorial());
      prevBtn?.addEventListener('click', () => this.previousStep());
      nextBtn?.addEventListener('click', () => this.nextStep());
      skipBtn?.addEventListener('click', () => this.skipStep());

      // Highlight target element if specified
      if (step.target) {
         this.highlightElement(step.target);
      }

      document.body.appendChild(overlay);
      this.tutorialOverlay = overlay;

      // Position popup
      this.positionTutorialPopup(step);
   }

   /**
    * Position tutorial popup relative to target
    * 相对于目标元素定位教程弹窗
    */
   private positionTutorialPopup(step: TutorialStep): void {
      if (!step.target || !this.tutorialOverlay) return;

      const targetElement = document.querySelector(step.target);
      const popup = this.tutorialOverlay.querySelector('.tutorial-popup') as HTMLElement;

      if (!targetElement || !popup) return;

      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (step.position) {
         case 'top':
            top = targetRect.top - popupRect.height - 10;
            left = targetRect.left + (targetRect.width - popupRect.width) / 2;
            break;
         case 'bottom':
            top = targetRect.bottom + 10;
            left = targetRect.left + (targetRect.width - popupRect.width) / 2;
            break;
         case 'left':
            top = targetRect.top + (targetRect.height - popupRect.height) / 2;
            left = targetRect.left - popupRect.width - 10;
            break;
         case 'right':
            top = targetRect.top + (targetRect.height - popupRect.height) / 2;
            left = targetRect.right + 10;
            break;
         default:
            // Center on screen
            top = (window.innerHeight - popupRect.height) / 2;
            left = (window.innerWidth - popupRect.width) / 2;
      }

      // Ensure popup stays within viewport
      top = Math.max(10, Math.min(top, window.innerHeight - popupRect.height - 10));
      left = Math.max(10, Math.min(left, window.innerWidth - popupRect.width - 10));

      popup.style.position = 'fixed';
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
   }

   /**
    * Highlight target element
    * 高亮目标元素
    */
   private highlightElement(selector: string): void {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return;

      element.classList.add('tutorial-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
   }

   /**
    * Remove element highlighting
    * 移除元素高亮
    */
   private removeHighlighting(): void {
      const highlighted = document.querySelectorAll('.tutorial-highlight');
      highlighted.forEach(el => el.classList.remove('tutorial-highlight'));
   }

   /**
    * Move to next tutorial step
    * 移动到下一个教程步骤
    */
   private async nextStep(): Promise<void> {
      if (!this.currentTutorial) return;

      if (this.isLastStep()) {
         await this.completeTutorial();
      } else {
         this.currentStepIndex++;
         await this.showTutorialStep();
      }
   }

   /**
    * Move to previous tutorial step
    * 移动到上一个教程步骤
    */
   private async previousStep(): Promise<void> {
      if (this.currentStepIndex > 0) {
         this.currentStepIndex--;
         await this.showTutorialStep();
      }
   }

   /**
    * Skip current step
    * 跳过当前步骤
    */
   private async skipStep(): Promise<void> {
      await this.nextStep();
   }

   /**
    * Check if current step is the last one
    * 检查当前步骤是否为最后一步
    */
   private isLastStep(): boolean {
      return this.currentTutorial ? this.currentStepIndex >= this.currentTutorial.steps.length - 1 : true;
   }

   /**
    * Complete current tutorial
    * 完成当前教程
    */
   private async completeTutorial(): Promise<void> {
      if (!this.currentTutorial) return;

      // Mark tutorial as completed
      const completed = this.preferenceService.get<string[]>(WorkflowTutorialService.TUTORIAL_PREFERENCE_KEY, []);
      if (!completed.includes(this.currentTutorial.id)) {
         completed.push(this.currentTutorial.id);
         await this.preferenceService.set(WorkflowTutorialService.TUTORIAL_PREFERENCE_KEY, completed);
      }

      this.messageService.info(`恭喜！您已完成"${this.currentTutorial.title}"教程。`);
      this.closeTutorial();
   }

   /**
    * Close tutorial
    * 关闭教程
    */
   private closeTutorial(): void {
      this.removeTutorialOverlay();
      this.removeHighlighting();
      this.currentTutorial = undefined;
      this.currentStepIndex = 0;
   }

   /**
    * Remove tutorial overlay
    * 移除教程覆盖层
    */
   private removeTutorialOverlay(): void {
      if (this.tutorialOverlay) {
         this.tutorialOverlay.remove();
         this.tutorialOverlay = undefined;
      }
   }

   /**
    * Render markdown content
    * 渲染Markdown内容
    */
   private renderMarkdown(content: string): string {
      // Simple markdown rendering - in a real implementation, use a proper markdown library
      return content
         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
         .replace(/\*(.*?)\*/g, '<em>$1</em>')
         .replace(/`(.*?)`/g, '<code>$1</code>')
         .replace(/\n/g, '<br>');
   }

   /**
    * Get tutorial by ID
    * 根据ID获取教程
    */
   private getTutorial(id: string): Tutorial | undefined {
      return this.getAvailableTutorials().find(t => t.id === id);
   }

   /**
    * Get all available tutorials
    * 获取所有可用的教程
    */
   getAvailableTutorials(): Tutorial[] {
      return [
         {
            id: 'getting-started',
            title: '快速入门',
            description: '学习工作流程建模的基础知识',
            category: 'beginner',
            estimatedTime: 10,
            steps: [
               {
                  id: 'welcome',
                  title: '欢迎使用工作流程建模器',
                  description: '让我们开始您的工作流程建模之旅！',
                  content: `
**工作流程建模器**是一个强大的业务流程设计工具。

您可以使用三种方式来创建工作流程：
- **文本编辑**: 使用DSL语言编写
- **图形编辑**: 拖拽节点创建流程图
- **表单编辑**: 使用结构化表单

让我们开始创建您的第一个工作流程！
                  `,
                  nextStep: 'create-workflow',
                  skippable: true
               },
               {
                  id: 'create-workflow',
                  title: '创建新的工作流程',
                  description: '首先，让我们创建一个新的工作流程文件',
                  target: '.theia-main-menu-bar',
                  action: 'workbench.action.showCommands',
                  content: `
点击菜单栏或使用快捷键 **Ctrl+Shift+P** 打开命令面板。

然后输入 "New Workflow" 来创建新的工作流程文件。
                  `,
                  position: 'bottom',
                  nextStep: 'add-begin-node'
               },
               {
                  id: 'add-begin-node',
                  title: '添加开始节点',
                  description: '每个工作流程都需要一个开始节点',
                  content: `
在文本编辑器中输入以下代码来创建开始节点：

\`\`\`
begin StartProcess {
  name: "开始处理"
}
\`\`\`

**开始节点**是工作流程的起点，它没有输入边，通常有一个输出边。
                  `,
                  nextStep: 'add-process-node'
               },
               {
                  id: 'add-process-node',
                  title: '添加过程节点',
                  description: '添加一个处理业务逻辑的过程节点',
                  content: `
继续添加一个过程节点：

\`\`\`
process ValidateData {
  name: "验证数据"
  description: "验证输入数据的完整性"
}
\`\`\`

**过程节点**用于执行具体的业务逻辑，只能有一条输出边。
                  `,
                  nextStep: 'add-end-node'
               },
               {
                  id: 'add-end-node',
                  title: '添加结束节点',
                  description: '添加一个结束节点来完成工作流程',
                  content: `
最后添加结束节点：

\`\`\`
end FinishProcess {
  name: "完成处理"
  expectedValue: "completed"
}
\`\`\`

**结束节点**标记工作流程的终点，必须指定预期值。
                  `,
                  nextStep: 'connect-nodes'
               },
               {
                  id: 'connect-nodes',
                  title: '连接节点',
                  description: '使用边来连接工作流程节点',
                  content: `
使用 \`flow\` 语句连接节点：

\`\`\`
flow StartProcess -> ValidateData
flow ValidateData -> FinishProcess
\`\`\`

现在您已经创建了一个完整的工作流程！
                  `,
                  nextStep: 'switch-to-diagram'
               },
               {
                  id: 'switch-to-diagram',
                  title: '切换到图形视图',
                  description: '查看工作流程的图形表示',
                  target: '.workflow-editor-tab[data-mode="diagram"]',
                  content: `
点击 **图形** 标签页来查看您刚创建的工作流程的可视化表示。

您可以在不同的编辑模式之间自由切换，所有更改都会自动同步。
                  `,
                  position: 'bottom',
                  nextStep: 'congratulations'
               },
               {
                  id: 'congratulations',
                  title: '恭喜！',
                  description: '您已经完成了第一个工作流程',
                  content: `
🎉 **恭喜您完成了快速入门教程！**

您已经学会了：
- ✅ 创建工作流程文件
- ✅ 添加开始、过程和结束节点
- ✅ 使用边连接节点
- ✅ 在不同编辑模式间切换

**下一步建议：**
- 尝试添加更多节点类型（分支、决策表等）
- 探索表单编辑模式
- 查看完整的文档和示例

继续探索工作流程建模的强大功能吧！
                  `,
                  skippable: false
               }
            ]
         },
         {
            id: 'advanced-features',
            title: '高级功能',
            description: '学习决策表、泳道和并发处理等高级功能',
            category: 'advanced',
            estimatedTime: 20,
            prerequisites: ['getting-started'],
            steps: [
               {
                  id: 'decision-tables',
                  title: '决策表',
                  description: '学习如何使用决策表处理复杂的业务规则',
                  content: `
**决策表**是处理复杂决策逻辑的强大工具。

它使用类似Excel的表格形式来定义多条件、多输出的决策规则。

让我们创建一个风险评估的决策表...
                  `
               }
               // More advanced steps...
            ]
         }
      ];
   }

   /**
    * Show tutorial selection dialog
    * 显示教程选择对话框
    */
   async showTutorialSelection(): Promise<void> {
      const tutorials = this.getAvailableTutorials();
      const completed = this.preferenceService.get<string[]>(WorkflowTutorialService.TUTORIAL_PREFERENCE_KEY, []);

      const options = tutorials.map(tutorial => {
         const isCompleted = completed.includes(tutorial.id);
         const status = isCompleted ? '✅' : '📚';
         return `${status} ${tutorial.title} (${tutorial.estimatedTime}分钟)`;
      });

      const result = await this.messageService.info('选择要开始的教程：', ...options, '取消');

      if (result && result !== '取消') {
         const selectedIndex = options.indexOf(result);
         if (selectedIndex >= 0) {
            await this.startTutorial(tutorials[selectedIndex].id);
         }
      }
   }

   /**
    * Check if user has completed a tutorial
    * 检查用户是否已完成教程
    */
   hasTutorialCompleted(tutorialId: string): boolean {
      const completed = this.preferenceService.get<string[]>(WorkflowTutorialService.TUTORIAL_PREFERENCE_KEY, []);
      return completed.includes(tutorialId);
   }

   /**
    * Reset tutorial progress
    * 重置教程进度
    */
   async resetTutorialProgress(): Promise<void> {
      await this.preferenceService.set(WorkflowTutorialService.TUTORIAL_PREFERENCE_KEY, []);
      await this.preferenceService.set(WorkflowTutorialService.SHOW_WELCOME_KEY, true);
      this.messageService.info('教程进度已重置');
   }
}
