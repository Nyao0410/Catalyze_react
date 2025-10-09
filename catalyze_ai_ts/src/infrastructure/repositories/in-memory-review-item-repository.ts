/**
 * インフラストラクチャ層 - メモリ実装
 * 
 * ReviewItemRepositoryのインメモリ実装（テスト・開発用）
 */

import { startOfDay, endOfDay } from 'date-fns';
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';

/**
 * メモリ内ReviewItemRepository実装
 */
export class InMemoryReviewItemRepository implements ReviewItemRepository {
  private items: Map<string, ReviewItemEntity> = new Map();

  async create(item: ReviewItemEntity): Promise<ReviewItemEntity> {
    this.items.set(item.id, item);
    return item;
  }

  async update(item: ReviewItemEntity): Promise<void> {
    if (!this.items.has(item.id)) {
      throw new Error(`ReviewItem with id ${item.id} not found`);
    }
    this.items.set(item.id, item);
  }

  async findById(itemId: string): Promise<ReviewItemEntity | null> {
    return this.items.get(itemId) ?? null;
  }

  async findByPlanId(planId: string): Promise<ReviewItemEntity[]> {
    return Array.from(this.items.values())
      .filter((item) => item.planId === planId)
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async findDueToday(userId: string): Promise<ReviewItemEntity[]> {
    const today = endOfDay(new Date());
    return Array.from(this.items.values())
      .filter((item) => item.userId === userId && item.nextReviewDate <= today)
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewItemEntity[]> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    return Array.from(this.items.values())
      .filter(
        (item) =>
          item.userId === userId &&
          item.nextReviewDate >= start &&
          item.nextReviewDate <= end
      )
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  async delete(itemId: string): Promise<void> {
    this.items.delete(itemId);
  }

  async deleteByPlanId(planId: string): Promise<void> {
    const itemsToDelete = Array.from(this.items.values()).filter(
      (item) => item.planId === planId
    );
    itemsToDelete.forEach((item) => this.items.delete(item.id));
  }

  /**
   * テスト用: 全データクリア
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * テスト用: 全データ取得
   */
  getAll(): ReviewItemEntity[] {
    return Array.from(this.items.values());
  }
}
