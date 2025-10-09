/**
 * AsyncStorage-backed ReviewItemRepository
 */
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';
export declare class AsyncStorageReviewItemRepository implements ReviewItemRepository {
    private _loadAll;
    private _saveAll;
    create(item: ReviewItemEntity): Promise<ReviewItemEntity>;
    update(item: ReviewItemEntity): Promise<void>;
    findById(itemId: string): Promise<ReviewItemEntity | null>;
    findByPlanId(planId: string): Promise<ReviewItemEntity[]>;
    findDueToday(userId: string): Promise<ReviewItemEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<ReviewItemEntity[]>;
    delete(itemId: string): Promise<void>;
    deleteByPlanId(planId: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=async-storage-review-item-repository.d.ts.map