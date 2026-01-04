/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Position } from './types';

/**
 * 泳道属性接口
 * Swimlane properties interface
 */
export interface SwimlaneProperties {
   description?: string;
   color?: string;
   orientation?: 'horizontal' | 'vertical';
   [key: string]: unknown;
}

/**
 * 泳道尺寸接口
 * Swimlane size interface
 */
export interface SwimlaneSize {
   width: number;
   height: number;
}

/**
 * 泳道接口 - 可容纳节点的容器
 * Swimlane interface - container that can hold nodes
 */
export interface Swimlane {
   id: string;
   name: string;
   position: Position;
   size: SwimlaneSize;
   properties: SwimlaneProperties;
   containedNodes: string[]; // 包含的节点ID列表
}

/**
 * 创建泳道参数接口
 * Create swimlane parameters interface
 */
export interface CreateSwimlaneParams {
   id?: string;
   name: string;
   position?: Position;
   size?: SwimlaneSize;
   properties?: SwimlaneProperties;
}

/**
 * 泳道验证结果接口
 * Swimlane validation result interface
 */
export interface SwimlaneValidationResult {
   isValid: boolean;
   errors: string[];
   warnings?: string[];
}

/**
 * 泳道移动选项接口
 * Swimlane move options interface
 */
export interface SwimlaneMoveOptions {
   moveContainedNodes?: boolean;
}

/**
 * 泳道删除选项接口
 * Swimlane delete options interface
 */
export interface SwimlaneDeleteOptions {
   deleteContainedNodes?: boolean;
}

/**
 * 节点归属变更结果接口
 * Node assignment change result interface
 */
export interface NodeAssignmentResult {
   success: boolean;
   previousSwimlaneId?: string;
   newSwimlaneId?: string;
   nodeId: string;
   error?: string;
}

/**
 * 创建泳道
 * Create swimlane
 */
export function createSwimlane(id: string, params: CreateSwimlaneParams): Swimlane {
   return {
      id,
      name: params.name,
      position: params.position ?? { x: 0, y: 0 },
      size: params.size ?? { width: 400, height: 300 },
      properties: params.properties ?? {},
      containedNodes: []
   };
}

/**
 * 将节点添加到泳道
 * Add node to swimlane
 */
export function addNodeToSwimlane(swimlane: Swimlane, nodeId: string): Swimlane {
   if (!swimlane.containedNodes.includes(nodeId)) {
      return {
         ...swimlane,
         containedNodes: [...swimlane.containedNodes, nodeId]
      };
   }
   return swimlane;
}

/**
 * 从泳道移除节点
 * Remove node from swimlane
 */
export function removeNodeFromSwimlane(swimlane: Swimlane, nodeId: string): Swimlane {
   return {
      ...swimlane,
      containedNodes: swimlane.containedNodes.filter(id => id !== nodeId)
   };
}

/**
 * 检查节点是否在泳道中
 * Check if node is in swimlane
 */
export function isNodeInSwimlane(swimlane: Swimlane, nodeId: string): boolean {
   return swimlane.containedNodes.includes(nodeId);
}

/**
 * 获取节点所属的泳道
 * Get swimlane that contains the node
 */
export function findSwimlaneForNode(swimlanes: Swimlane[], nodeId: string): Swimlane | undefined {
   return swimlanes.find(swimlane => swimlane.containedNodes.includes(nodeId));
}

/**
 * 泳道管理器类
 * Swimlane manager class - 需求 3.1-3.4
 */
export class SwimlaneManager {
   private swimlane: Swimlane;

   constructor(params: CreateSwimlaneParams) {
      this.swimlane = createSwimlane(params.id ?? SwimlaneManager.generateSwimlaneId(), params);
   }

   private static swimlaneIdCounter = 0;

   /**
    * 生成唯一的泳道ID
    * Generate unique swimlane ID
    */
   static generateSwimlaneId(prefix: string = 'swimlane'): string {
      return `${prefix}_${++this.swimlaneIdCounter}`;
   }

   /**
    * 重置泳道ID计数器
    * Reset swimlane ID counter
    */
   static resetIdCounter(): void {
      this.swimlaneIdCounter = 0;
   }

   /**
    * 设置泳道ID计数器
    * Set swimlane ID counter
    */
   static setIdCounter(value: number): void {
      this.swimlaneIdCounter = value;
   }

   /**
    * 获取泳道
    * Get the swimlane
    */
   getSwimlane(): Swimlane {
      return this.swimlane;
   }

   /**
    * 获取泳道ID
    * Get swimlane ID
    */
   getId(): string {
      return this.swimlane.id;
   }

   /**
    * 获取泳道名称
    * Get swimlane name
    */
   getName(): string {
      return this.swimlane.name;
   }

   /**
    * 更新泳道名称
    * Update swimlane name
    */
   updateName(name: string): void {
      this.swimlane.name = name;
   }

   /**
    * 获取泳道位置
    * Get swimlane position
    */
   getPosition(): Position {
      return this.swimlane.position;
   }

   /**
    * 更新泳道位置
    * Update swimlane position - 需求 3.3
    */
   updatePosition(position: Position): void {
      this.swimlane.position = position;
   }

   /**
    * 获取泳道尺寸
    * Get swimlane size
    */
   getSize(): SwimlaneSize {
      return this.swimlane.size;
   }

   /**
    * 更新泳道尺寸
    * Update swimlane size
    */
   updateSize(size: SwimlaneSize): void {
      this.swimlane.size = size;
   }

   /**
    * 获取泳道属性
    * Get swimlane properties
    */
   getProperties(): SwimlaneProperties {
      return this.swimlane.properties;
   }

   /**
    * 更新泳道属性
    * Update swimlane properties
    */
   updateProperties(properties: Partial<SwimlaneProperties>): void {
      this.swimlane.properties = { ...this.swimlane.properties, ...properties };
   }

   /**
    * 获取包含的节点ID列表
    * Get contained node IDs
    */
   getContainedNodes(): string[] {
      return [...this.swimlane.containedNodes];
   }

   /**
    * 获取包含的节点数量
    * Get contained node count
    */
   getNodeCount(): number {
      return this.swimlane.containedNodes.length;
   }

   /**
    * 检查泳道是否为空
    * Check if swimlane is empty
    */
   isEmpty(): boolean {
      return this.swimlane.containedNodes.length === 0;
   }

   /**
    * 添加节点到泳道
    * Add node to swimlane - 需求 3.2: 将节点归属到该泳道
    * 属性 11: 节点泳道归属
    */
   addNode(nodeId: string): boolean {
      if (!this.swimlane.containedNodes.includes(nodeId)) {
         this.swimlane.containedNodes.push(nodeId);
         return true;
      }
      return false;
   }

   /**
    * 批量添加节点到泳道
    * Add multiple nodes to swimlane
    */
   addNodes(nodeIds: string[]): string[] {
      const addedNodes: string[] = [];
      for (const nodeId of nodeIds) {
         if (this.addNode(nodeId)) {
            addedNodes.push(nodeId);
         }
      }
      return addedNodes;
   }

   /**
    * 从泳道移除节点
    * Remove node from swimlane
    */
   removeNode(nodeId: string): boolean {
      const index = this.swimlane.containedNodes.indexOf(nodeId);
      if (index > -1) {
         this.swimlane.containedNodes.splice(index, 1);
         return true;
      }
      return false;
   }

   /**
    * 批量从泳道移除节点
    * Remove multiple nodes from swimlane
    */
   removeNodes(nodeIds: string[]): string[] {
      const removedNodes: string[] = [];
      for (const nodeId of nodeIds) {
         if (this.removeNode(nodeId)) {
            removedNodes.push(nodeId);
         }
      }
      return removedNodes;
   }

   /**
    * 清空泳道中的所有节点
    * Clear all nodes from swimlane
    */
   clearNodes(): string[] {
      const removedNodes = [...this.swimlane.containedNodes];
      this.swimlane.containedNodes = [];
      return removedNodes;
   }

   /**
    * 检查节点是否在泳道中
    * Check if node is in swimlane
    */
   containsNode(nodeId: string): boolean {
      return this.swimlane.containedNodes.includes(nodeId);
   }

   /**
    * 检查点是否在泳道边界内
    * Check if a point is within swimlane bounds
    */
   containsPoint(point: Position): boolean {
      const { x, y } = this.swimlane.position;
      const { width, height } = this.swimlane.size;
      return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
   }

   /**
    * 验证泳道
    * Validate swimlane - 属性 10: 泳道容器属性
    */
   validate(): SwimlaneValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 验证名称
      if (!this.swimlane.name || this.swimlane.name.trim() === '') {
         warnings.push(`泳道应该有一个名称 (Swimlane should have a name)`);
      }

      // 验证尺寸
      if (this.swimlane.size.width <= 0) {
         errors.push(`泳道 "${this.swimlane.name}" 的宽度必须大于0 (Swimlane width must be greater than 0)`);
      }
      if (this.swimlane.size.height <= 0) {
         errors.push(`泳道 "${this.swimlane.name}" 的高度必须大于0 (Swimlane height must be greater than 0)`);
      }

      // 验证包含的节点ID是否有重复
      const uniqueNodes = new Set(this.swimlane.containedNodes);
      if (uniqueNodes.size !== this.swimlane.containedNodes.length) {
         errors.push(`泳道 "${this.swimlane.name}" 包含重复的节点ID (Swimlane contains duplicate node IDs)`);
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings: warnings.length > 0 ? warnings : undefined
      };
   }

   /**
    * 克隆泳道（不包含节点）
    * Clone swimlane (without nodes)
    */
   clone(newId?: string): SwimlaneManager {
      const clonedManager = new SwimlaneManager({
         id: newId ?? SwimlaneManager.generateSwimlaneId(),
         name: `${this.swimlane.name} (Copy)`,
         position: { ...this.swimlane.position },
         size: { ...this.swimlane.size },
         properties: { ...this.swimlane.properties }
      });
      return clonedManager;
   }

   /**
    * 克隆泳道（包含节点）
    * Clone swimlane (with nodes)
    */
   cloneWithNodes(newId?: string): SwimlaneManager {
      const clonedManager = this.clone(newId);
      clonedManager.addNodes([...this.swimlane.containedNodes]);
      return clonedManager;
   }
}

/**
 * 泳道集合管理器 - 管理多个泳道和节点归属关系
 * Swimlane collection manager - manages multiple swimlanes and node assignments
 */
export class SwimlaneCollectionManager {
   private swimlanes: Map<string, SwimlaneManager> = new Map();
   private nodeToSwimlane: Map<string, string> = new Map(); // nodeId -> swimlaneId

   /**
    * 创建新泳道
    * Create new swimlane - 需求 3.1: 创建一个可容纳节点的泳道容器
    * 属性 10: 泳道容器属性
    */
   createSwimlane(params: CreateSwimlaneParams): SwimlaneManager {
      const manager = new SwimlaneManager(params);
      this.swimlanes.set(manager.getId(), manager);
      return manager;
   }

   /**
    * 获取泳道
    * Get swimlane by ID
    */
   getSwimlane(swimlaneId: string): SwimlaneManager | undefined {
      return this.swimlanes.get(swimlaneId);
   }

   /**
    * 获取所有泳道
    * Get all swimlanes
    */
   getAllSwimlanes(): SwimlaneManager[] {
      return Array.from(this.swimlanes.values());
   }

   /**
    * 获取所有泳道数据
    * Get all swimlane data
    */
   getAllSwimlaneData(): Swimlane[] {
      return this.getAllSwimlanes().map(manager => manager.getSwimlane());
   }

   /**
    * 获取泳道数量
    * Get swimlane count
    */
   getSwimlaneCount(): number {
      return this.swimlanes.size;
   }

   /**
    * 删除泳道
    * Delete swimlane - 需求 3.4: 询问是否同时删除泳道内的节点
    */
   deleteSwimlane(swimlaneId: string, options?: SwimlaneDeleteOptions): string[] {
      const manager = this.swimlanes.get(swimlaneId);
      if (!manager) {
         return [];
      }

      const containedNodes = manager.getContainedNodes();

      // 清除节点到泳道的映射
      for (const nodeId of containedNodes) {
         this.nodeToSwimlane.delete(nodeId);
      }

      // 删除泳道
      this.swimlanes.delete(swimlaneId);

      // 如果选择删除包含的节点，返回节点ID列表供调用者处理
      if (options?.deleteContainedNodes) {
         return containedNodes;
      }

      return [];
   }

   /**
    * 将节点分配到泳道
    * Assign node to swimlane - 需求 3.2: 将节点归属到该泳道
    * 属性 11: 节点泳道归属
    */
   assignNodeToSwimlane(nodeId: string, swimlaneId: string): NodeAssignmentResult {
      const targetSwimlane = this.swimlanes.get(swimlaneId);
      if (!targetSwimlane) {
         return {
            success: false,
            nodeId,
            error: `泳道 "${swimlaneId}" 不存在 (Swimlane "${swimlaneId}" does not exist)`
         };
      }

      // 检查节点是否已在其他泳道中
      const previousSwimlaneId = this.nodeToSwimlane.get(nodeId);
      if (previousSwimlaneId) {
         // 从原泳道移除
         const previousSwimlane = this.swimlanes.get(previousSwimlaneId);
         if (previousSwimlane) {
            previousSwimlane.removeNode(nodeId);
         }
      }

      // 添加到新泳道
      targetSwimlane.addNode(nodeId);
      this.nodeToSwimlane.set(nodeId, swimlaneId);

      return {
         success: true,
         previousSwimlaneId,
         newSwimlaneId: swimlaneId,
         nodeId
      };
   }

   /**
    * 从泳道移除节点
    * Remove node from swimlane
    */
   removeNodeFromSwimlane(nodeId: string): NodeAssignmentResult {
      const swimlaneId = this.nodeToSwimlane.get(nodeId);
      if (!swimlaneId) {
         return {
            success: false,
            nodeId,
            error: `节点 "${nodeId}" 不在任何泳道中 (Node "${nodeId}" is not in any swimlane)`
         };
      }

      const swimlane = this.swimlanes.get(swimlaneId);
      if (swimlane) {
         swimlane.removeNode(nodeId);
      }
      this.nodeToSwimlane.delete(nodeId);

      return {
         success: true,
         previousSwimlaneId: swimlaneId,
         nodeId
      };
   }

   /**
    * 获取节点所属的泳道ID
    * Get swimlane ID for node
    */
   getSwimlaneIdForNode(nodeId: string): string | undefined {
      return this.nodeToSwimlane.get(nodeId);
   }

   /**
    * 获取节点所属的泳道
    * Get swimlane for node
    */
   getSwimlaneForNode(nodeId: string): SwimlaneManager | undefined {
      const swimlaneId = this.nodeToSwimlane.get(nodeId);
      if (swimlaneId) {
         return this.swimlanes.get(swimlaneId);
      }
      return undefined;
   }

   /**
    * 检查节点是否在任何泳道中
    * Check if node is in any swimlane
    */
   isNodeInAnySwimlane(nodeId: string): boolean {
      return this.nodeToSwimlane.has(nodeId);
   }

   /**
    * 移动泳道
    * Move swimlane - 需求 3.3: 同时移动泳道内的所有节点
    */
   moveSwimlane(
      swimlaneId: string,
      newPosition: Position,
      _options?: SwimlaneMoveOptions
   ): { swimlane: SwimlaneManager; deltaX: number; deltaY: number } | undefined {
      const swimlane = this.swimlanes.get(swimlaneId);
      if (!swimlane) {
         return undefined;
      }

      const oldPosition = swimlane.getPosition();
      const deltaX = newPosition.x - oldPosition.x;
      const deltaY = newPosition.y - oldPosition.y;

      swimlane.updatePosition(newPosition);

      return {
         swimlane,
         deltaX,
         deltaY
      };
   }

   /**
    * 根据位置查找泳道
    * Find swimlane at position
    */
   findSwimlaneAtPosition(position: Position): SwimlaneManager | undefined {
      for (const swimlane of this.swimlanes.values()) {
         if (swimlane.containsPoint(position)) {
            return swimlane;
         }
      }
      return undefined;
   }

   /**
    * 验证所有泳道
    * Validate all swimlanes
    */
   validateAll(): Map<string, SwimlaneValidationResult> {
      const results = new Map<string, SwimlaneValidationResult>();
      for (const [id, swimlane] of this.swimlanes) {
         results.set(id, swimlane.validate());
      }
      return results;
   }

   /**
    * 清空所有泳道
    * Clear all swimlanes
    */
   clear(): void {
      this.swimlanes.clear();
      this.nodeToSwimlane.clear();
   }

   /**
    * 从泳道数据数组导入
    * Import from swimlane data array
    */
   importFromData(swimlanes: Swimlane[]): void {
      this.clear();
      for (const swimlaneData of swimlanes) {
         const manager = new SwimlaneManager({
            id: swimlaneData.id,
            name: swimlaneData.name,
            position: swimlaneData.position,
            size: swimlaneData.size,
            properties: swimlaneData.properties
         });
         // 添加包含的节点
         for (const nodeId of swimlaneData.containedNodes) {
            manager.addNode(nodeId);
            this.nodeToSwimlane.set(nodeId, swimlaneData.id);
         }
         this.swimlanes.set(swimlaneData.id, manager);
      }
   }

   /**
    * 导出为泳道数据数组
    * Export to swimlane data array
    */
   exportToData(): Swimlane[] {
      return this.getAllSwimlaneData();
   }
}
