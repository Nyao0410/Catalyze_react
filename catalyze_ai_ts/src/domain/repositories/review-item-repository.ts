/**
 * ドメイン層 - リポジトリインターフェース
 * 
 * 復習項目リポジトリ
 */

import { ReviewItemEntity } from '../entities/review-item-entity';

/**
 * 復習項目リポジトリインターフェース
 */
export interface ReviewItemRepository {
  /**
   * 復習項目を作成
   */
  create(item: ReviewItemEntity): Promise<ReviewItemEntity>;

  /**
   * 復習項目を更新
   */
  update(item: ReviewItemEntity): Promise<void>;

  /**
   * IDで復習項目を検索
   */
  findById(itemId: string): Promise<ReviewItemEntity | null>;

  /**
   * 計画IDで復習項目を検索
   */
  findByPlanId(planId: string): Promise<ReviewItemEntity[]>;

  /**
   * ユーザーIDで今日期限の復習項目を検索
   */
  findDueToday(userId: string): Promise<ReviewItemEntity[]>;

  /**
   * ユーザーIDと日付範囲で復習項目を検索
   */
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewItemEntity[]>;

  /**
   * 復習項目を削除
   */
  delete(itemId: string): Promise<void>;

  /**
   * 計画IDで全ての復習項目を削除
   */
  deleteByPlanId(planId: string): Promise<void>;
}
