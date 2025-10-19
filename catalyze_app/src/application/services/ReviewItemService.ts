/**
 * StudyNext - Application Service for Review Items
 * 復習項目のアプリケーションサービス
 */

import {
  ReviewItemEntity,
  InMemoryReviewItemRepository,
  type ReviewItemRepository,
} from 'catalyze-ai';

export class ReviewItemService {
  private repository: ReviewItemRepository;

  constructor(repository?: ReviewItemRepository) {
    this.repository = repository || new InMemoryReviewItemRepository();
  }

  async getReviewItemsByPlanId(planId: string): Promise<ReviewItemEntity[]> {
    return await this.repository.findByPlanId(planId);
  }

  async getReviewItemsByUserId(userId: string): Promise<ReviewItemEntity[]> {
    // すべての復習項目を取得するため、広い日付範囲を指定
    const startDate = new Date(0); // 最小日付
    const endDate = new Date(2100, 0, 1); // 未来の日付
    return await this.repository.findByUserIdAndDateRange(userId, startDate, endDate);
  }

  async getDueReviewItems(userId: string): Promise<ReviewItemEntity[]> {
    return await this.repository.findDueToday(userId);
  }

  async getReviewItemById(reviewId: string): Promise<ReviewItemEntity | null> {
    return await this.repository.findById(reviewId);
  }

  async createReviewItem(item: ReviewItemEntity): Promise<ReviewItemEntity> {
    return await this.repository.create(item);
  }

  async updateReviewItem(item: ReviewItemEntity): Promise<void> {
    await this.repository.update(item);
  }

  async deleteReviewItem(reviewId: string): Promise<void> {
    await this.repository.delete(reviewId);
  }

  async recordReview(reviewId: string, quality: number): Promise<ReviewItemEntity> {
    const item = await this.repository.findById(reviewId);
    if (!item) {
      throw new Error(`Review item not found: ${reviewId}`);
    }
    
    if (typeof (item as any).recordReview !== 'function') {
      // Try to instantiate as ReviewItemEntity if it's not already
      const entity = new ReviewItemEntity(item as any);
      const updatedItem = entity.recordReview(quality);
      await this.repository.update(updatedItem);
      return updatedItem;
    }
    
    const updatedItem = item.recordReview(quality);
    await this.repository.update(updatedItem);
    return updatedItem;
  }
}

// シングルトンインスタンス
export const reviewItemService = new ReviewItemService();
