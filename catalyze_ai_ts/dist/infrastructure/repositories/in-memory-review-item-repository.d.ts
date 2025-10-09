/**
 * インフラストラクチャ層 - メモリ実装
 *
 * ReviewItemRepositoryのインメモリ実装（テスト・開発用）
 */
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';
/**
 * メモリ内ReviewItemRepository実装
 */
export declare class InMemoryReviewItemRepository implements ReviewItemRepository {
    private items;
    create(item: ReviewItemEntity): Promise<ReviewItemEntity>;
    update(item: ReviewItemEntity): Promise<void>;
    findById(itemId: string): Promise<ReviewItemEntity | null>;
    findByPlanId(planId: string): Promise<ReviewItemEntity[]>;
    findDueToday(userId: string): Promise<ReviewItemEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<ReviewItemEntity[]>;
    delete(itemId: string): Promise<void>;
    deleteByPlanId(planId: string): Promise<void>;
    /**
     * テスト用: 全データクリア
     */
    clear(): void;
    /**
     * テスト用: 全データ取得
     */
    getAll(): ReviewItemEntity[];
}
//# sourceMappingURL=in-memory-review-item-repository.d.ts.map