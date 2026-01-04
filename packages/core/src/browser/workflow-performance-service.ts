/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 * Workflow Performance Service - 工作流程性能优化服务
 * 需求: 所有需求的性能方面 - 优化性能和响应性
 ********************************************************************************/

import { MessageService } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';

export interface PerformanceMetrics {
   renderTime: number;
   syncTime: number;
   memoryUsage: number;
   nodeCount: number;
   edgeCount: number;
   lastUpdate: number;
}

export interface PerformanceThresholds {
   maxRenderTime: number;
   maxSyncTime: number;
   maxMemoryUsage: number;
   maxNodeCount: number;
   maxEdgeCount: number;
}

export interface LazyLoadConfig {
   enabled: boolean;
   chunkSize: number;
   viewportBuffer: number;
   preloadDistance: number;
}

/**
 * Service for monitoring and optimizing workflow performance
 * 工作流程性能监控和优化服务
 */
@injectable()
export class WorkflowPerformanceService {
   private static readonly PERFORMANCE_PREFERENCE_KEY = 'workflow.performance';
   private static readonly LAZY_LOAD_PREFERENCE_KEY = 'workflow.lazyLoad';

   private metrics: PerformanceMetrics = {
      renderTime: 0,
      syncTime: 0,
      memoryUsage: 0,
      nodeCount: 0,
      edgeCount: 0,
      lastUpdate: Date.now()
   };

   private thresholds: PerformanceThresholds = {
      maxRenderTime: 100, // ms
      maxSyncTime: 50, // ms
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxNodeCount: 1000,
      maxEdgeCount: 2000
   };

   private lazyLoadConfig: LazyLoadConfig = {
      enabled: true,
      chunkSize: 50,
      viewportBuffer: 200,
      preloadDistance: 500
   };

   private performanceObserver?: PerformanceObserver;
   private memoryMonitorInterval?: NodeJS.Timeout;
   private renderQueue: Array<() => void> = [];
   private isProcessingQueue = false;

   constructor(
      @inject(MessageService) private readonly messageService: MessageService,
      @inject(PreferenceService) private readonly preferenceService: PreferenceService
   ) {
      this.initializePerformanceMonitoring();
      this.loadPreferences();
   }

   /**
    * Initialize performance monitoring
    * 初始化性能监控
    */
   private initializePerformanceMonitoring(): void {
      // Initialize Performance Observer for measuring render times
      if ('PerformanceObserver' in window) {
         this.performanceObserver = new PerformanceObserver(list => {
            const entries = list.getEntries();
            entries.forEach(entry => {
               if (entry.name.startsWith('workflow-render')) {
                  this.metrics.renderTime = entry.duration;
               } else if (entry.name.startsWith('workflow-sync')) {
                  this.metrics.syncTime = entry.duration;
               }
            });
         });

         this.performanceObserver.observe({ entryTypes: ['measure'] });
      }

      // Monitor memory usage
      this.startMemoryMonitoring();

      // Monitor for performance issues
      this.startPerformanceAnalysis();
   }

   /**
    * Start memory usage monitoring
    * 开始内存使用监控
    */
   private startMemoryMonitoring(): void {
      if ('memory' in performance) {
         this.memoryMonitorInterval = setInterval(() => {
            const memory = (performance as any).memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize;
            this.checkMemoryThreshold();
         }, 5000); // Check every 5 seconds
      }
   }

   /**
    * Start performance analysis
    * 开始性能分析
    */
   private startPerformanceAnalysis(): void {
      // Monitor for long tasks
      if ('PerformanceObserver' in window) {
         const longTaskObserver = new PerformanceObserver(list => {
            const entries = list.getEntries();
            entries.forEach(entry => {
               if (entry.duration > 50) {
                  // Tasks longer than 50ms
                  console.warn(`Long task detected: ${entry.duration}ms`);
                  this.suggestOptimization('long-task', entry.duration);
               }
            });
         });

         try {
            longTaskObserver.observe({ entryTypes: ['longtask'] });
         } catch (e) {
            // longtask not supported in all browsers
         }
      }
   }

   /**
    * Load performance preferences
    * 加载性能偏好设置
    */
   private async loadPreferences(): Promise<void> {
      const performancePrefs = this.preferenceService.get(WorkflowPerformanceService.PERFORMANCE_PREFERENCE_KEY, this.thresholds);
      this.thresholds = { ...this.thresholds, ...performancePrefs };

      const lazyLoadPrefs = this.preferenceService.get(WorkflowPerformanceService.LAZY_LOAD_PREFERENCE_KEY, this.lazyLoadConfig);
      this.lazyLoadConfig = { ...this.lazyLoadConfig, ...lazyLoadPrefs };
   }

   /**
    * Measure render performance
    * 测量渲染性能
    */
   measureRenderPerformance<T>(name: string, operation: () => T): T {
      const startMark = `${name}-start`;
      const endMark = `${name}-end`;
      const measureName = `workflow-render-${name}`;

      performance.mark(startMark);
      const result = operation();
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      return result;
   }

   /**
    * Measure sync performance
    * 测量同步性能
    */
   measureSyncPerformance<T>(name: string, operation: () => T): T {
      const startMark = `${name}-sync-start`;
      const endMark = `${name}-sync-end`;
      const measureName = `workflow-sync-${name}`;

      performance.mark(startMark);
      const result = operation();
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      return result;
   }

   /**
    * Queue render operation for batching
    * 将渲染操作加入队列进行批处理
    */
   queueRender(operation: () => void): void {
      this.renderQueue.push(operation);

      if (!this.isProcessingQueue) {
         this.processRenderQueue();
      }
   }

   /**
    * Process render queue with batching
    * 批处理渲染队列
    */
   private async processRenderQueue(): Promise<void> {
      if (this.isProcessingQueue || this.renderQueue.length === 0) {
         return;
      }

      this.isProcessingQueue = true;

      // Use requestAnimationFrame for smooth rendering
      await new Promise(resolve => requestAnimationFrame(resolve));

      const batchSize = Math.min(this.renderQueue.length, 10);
      const batch = this.renderQueue.splice(0, batchSize);

      try {
         batch.forEach(operation => operation());
      } catch (error) {
         console.error('Error processing render queue:', error);
      }

      this.isProcessingQueue = false;

      // Continue processing if there are more items
      if (this.renderQueue.length > 0) {
         setTimeout(() => this.processRenderQueue(), 0);
      }
   }

   /**
    * Implement lazy loading for large workflows
    * 为大型工作流程实现懒加载
    */
   createLazyLoader<T>(items: T[], renderItem: (item: T, index: number) => HTMLElement, container: HTMLElement): LazyLoader<T> {
      return new LazyLoader(items, renderItem, container, this.lazyLoadConfig);
   }

   /**
    * Optimize large workflow rendering
    * 优化大型工作流程渲染
    */
   optimizeLargeWorkflow(nodeCount: number, edgeCount: number): OptimizationSuggestions {
      const suggestions: OptimizationSuggestions = {
         enableLazyLoading: false,
         enableVirtualization: false,
         reduceDetailLevel: false,
         enableCaching: false,
         suggestions: []
      };

      if (nodeCount > this.thresholds.maxNodeCount) {
         suggestions.enableLazyLoading = true;
         suggestions.enableVirtualization = true;
         suggestions.suggestions.push({
            type: 'performance',
            message: `工作流程包含 ${nodeCount} 个节点，建议启用懒加载和虚拟化`,
            action: 'enable-lazy-loading'
         });
      }

      if (edgeCount > this.thresholds.maxEdgeCount) {
         suggestions.reduceDetailLevel = true;
         suggestions.suggestions.push({
            type: 'performance',
            message: `工作流程包含 ${edgeCount} 条边，建议降低详细级别`,
            action: 'reduce-detail-level'
         });
      }

      if (nodeCount > 500 || edgeCount > 1000) {
         suggestions.enableCaching = true;
         suggestions.suggestions.push({
            type: 'performance',
            message: '建议启用渲染缓存以提高性能',
            action: 'enable-caching'
         });
      }

      return suggestions;
   }

   /**
    * Check memory usage threshold
    * 检查内存使用阈值
    */
   private checkMemoryThreshold(): void {
      if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
         this.suggestOptimization('memory', this.metrics.memoryUsage);
      }
   }

   /**
    * Suggest performance optimizations
    * 建议性能优化
    */
   private suggestOptimization(type: string, value: number): void {
      switch (type) {
         case 'memory':
            this.messageService.warn(`内存使用量较高 (${Math.round(value / 1024 / 1024)}MB)，建议关闭不必要的编辑器标签页或重启应用`);
            break;
         case 'long-task':
            console.warn(`检测到长时间任务 (${Math.round(value)}ms)，可能影响用户体验`);
            break;
         case 'render':
            if (value > this.thresholds.maxRenderTime) {
               console.warn(`渲染时间过长 (${Math.round(value)}ms)，建议启用性能优化`);
            }
            break;
      }
   }

   /**
    * Get current performance metrics
    * 获取当前性能指标
    */
   getMetrics(): PerformanceMetrics {
      return { ...this.metrics };
   }

   /**
    * Update workflow statistics
    * 更新工作流程统计信息
    */
   updateWorkflowStats(nodeCount: number, edgeCount: number): void {
      this.metrics.nodeCount = nodeCount;
      this.metrics.edgeCount = edgeCount;
      this.metrics.lastUpdate = Date.now();
   }

   /**
    * Enable performance optimizations
    * 启用性能优化
    */
   async enableOptimizations(optimizations: string[]): Promise<void> {
      const updates: Partial<LazyLoadConfig> = {};

      if (optimizations.includes('lazy-loading')) {
         updates.enabled = true;
      }

      if (optimizations.includes('reduce-chunk-size')) {
         updates.chunkSize = Math.max(10, this.lazyLoadConfig.chunkSize / 2);
      }

      if (optimizations.includes('increase-buffer')) {
         updates.viewportBuffer = this.lazyLoadConfig.viewportBuffer * 1.5;
      }

      this.lazyLoadConfig = { ...this.lazyLoadConfig, ...updates };
      await this.preferenceService.set(WorkflowPerformanceService.LAZY_LOAD_PREFERENCE_KEY, this.lazyLoadConfig);

      this.messageService.info('性能优化已启用');
   }

   /**
    * Generate performance report
    * 生成性能报告
    */
   generatePerformanceReport(): PerformanceReport {
      const report: PerformanceReport = {
         timestamp: Date.now(),
         metrics: this.getMetrics(),
         thresholds: this.thresholds,
         issues: [],
         recommendations: []
      };

      // Check for performance issues
      if (this.metrics.renderTime > this.thresholds.maxRenderTime) {
         report.issues.push({
            type: 'render-performance',
            severity: 'warning',
            message: `渲染时间 ${Math.round(this.metrics.renderTime)}ms 超过阈值 ${this.thresholds.maxRenderTime}ms`
         });
         report.recommendations.push('启用懒加载和虚拟化');
      }

      if (this.metrics.syncTime > this.thresholds.maxSyncTime) {
         report.issues.push({
            type: 'sync-performance',
            severity: 'warning',
            message: `同步时间 ${Math.round(this.metrics.syncTime)}ms 超过阈值 ${this.thresholds.maxSyncTime}ms`
         });
         report.recommendations.push('优化数据同步机制');
      }

      if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
         report.issues.push({
            type: 'memory-usage',
            severity: 'error',
            message: `内存使用 ${Math.round(this.metrics.memoryUsage / 1024 / 1024)}MB 超过阈值 ${Math.round(this.thresholds.maxMemoryUsage / 1024 / 1024)}MB`
         });
         report.recommendations.push('清理内存或重启应用');
      }

      return report;
   }

   /**
    * Cleanup resources
    * 清理资源
    */
   dispose(): void {
      if (this.performanceObserver) {
         this.performanceObserver.disconnect();
      }

      if (this.memoryMonitorInterval) {
         clearInterval(this.memoryMonitorInterval);
      }
   }
}

/**
 * Lazy loader implementation for large datasets
 * 大数据集的懒加载实现
 */
export class LazyLoader<T> {
   private visibleItems: Set<number> = new Set();
   private renderedElements: Map<number, HTMLElement> = new Map();
   private intersectionObserver?: IntersectionObserver;

   constructor(
      private items: T[],
      private renderItem: (item: T, index: number) => HTMLElement,
      private container: HTMLElement,
      private config: LazyLoadConfig
   ) {
      this.initializeIntersectionObserver();
      this.renderInitialItems();
   }

   private initializeIntersectionObserver(): void {
      if ('IntersectionObserver' in window) {
         this.intersectionObserver = new IntersectionObserver(
            entries => {
               entries.forEach(entry => {
                  const index = parseInt(entry.target.getAttribute('data-index') || '0');

                  if (entry.isIntersecting) {
                     this.loadItem(index);
                  } else {
                     this.unloadItem(index);
                  }
               });
            },
            {
               rootMargin: `${this.config.viewportBuffer}px`,
               threshold: 0.1
            }
         );
      }
   }

   private renderInitialItems(): void {
      const initialCount = Math.min(this.config.chunkSize, this.items.length);

      for (let i = 0; i < initialCount; i++) {
         this.loadItem(i);
      }

      // Create placeholder elements for remaining items
      for (let i = initialCount; i < this.items.length; i++) {
         const placeholder = this.createPlaceholder(i);
         this.container.appendChild(placeholder);

         if (this.intersectionObserver) {
            this.intersectionObserver.observe(placeholder);
         }
      }
   }

   private createPlaceholder(index: number): HTMLElement {
      const placeholder = document.createElement('div');
      placeholder.className = 'lazy-load-placeholder';
      placeholder.setAttribute('data-index', index.toString());
      placeholder.style.height = '50px'; // Estimated height
      placeholder.style.background = 'var(--theia-editor-background)';
      placeholder.style.border = '1px dashed var(--theia-panel-border)';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.color = 'var(--theia-descriptionForeground)';
      placeholder.textContent = '加载中...';
      return placeholder;
   }

   private loadItem(index: number): void {
      if (this.visibleItems.has(index) || index >= this.items.length) {
         return;
      }

      const item = this.items[index];
      const element = this.renderItem(item, index);
      element.setAttribute('data-index', index.toString());

      // Replace placeholder with actual element
      const placeholder = this.container.querySelector(`[data-index="${index}"]`);
      if (placeholder) {
         this.container.replaceChild(element, placeholder);
      } else {
         this.container.appendChild(element);
      }

      this.visibleItems.add(index);
      this.renderedElements.set(index, element);

      // Preload nearby items
      this.preloadNearbyItems(index);
   }

   private unloadItem(index: number): void {
      if (!this.visibleItems.has(index)) {
         return;
      }

      const element = this.renderedElements.get(index);
      if (element) {
         const placeholder = this.createPlaceholder(index);
         this.container.replaceChild(placeholder, element);

         if (this.intersectionObserver) {
            this.intersectionObserver.observe(placeholder);
         }
      }

      this.visibleItems.delete(index);
      this.renderedElements.delete(index);
   }

   private preloadNearbyItems(centerIndex: number): void {
      const preloadCount = Math.floor(this.config.preloadDistance / 50); // Assuming 50px per item
      const start = Math.max(0, centerIndex - preloadCount);
      const end = Math.min(this.items.length - 1, centerIndex + preloadCount);

      for (let i = start; i <= end; i++) {
         if (!this.visibleItems.has(i)) {
            setTimeout(() => this.loadItem(i), 0);
         }
      }
   }

   public updateItems(newItems: T[]): void {
      this.items = newItems;
      this.visibleItems.clear();
      this.renderedElements.clear();
      this.container.innerHTML = '';
      this.renderInitialItems();
   }

   public dispose(): void {
      if (this.intersectionObserver) {
         this.intersectionObserver.disconnect();
      }
      this.visibleItems.clear();
      this.renderedElements.clear();
   }
}

export interface OptimizationSuggestions {
   enableLazyLoading: boolean;
   enableVirtualization: boolean;
   reduceDetailLevel: boolean;
   enableCaching: boolean;
   suggestions: Array<{
      type: 'performance' | 'memory' | 'rendering';
      message: string;
      action: string;
   }>;
}

export interface PerformanceReport {
   timestamp: number;
   metrics: PerformanceMetrics;
   thresholds: PerformanceThresholds;
   issues: Array<{
      type: string;
      severity: 'info' | 'warning' | 'error';
      message: string;
   }>;
   recommendations: string[];
}
