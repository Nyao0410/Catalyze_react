/**
 * インフラストラクチャ層 - Firestore実装
 *
 * ReviewItemRepositoryのFirestore実装
 */
import { ReviewItemRepository } from '../../domain/repositories/review-item-repository';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';
/**
 * Firestore用のReviewItemRepository実装
 */
export declare class FirestoreReviewItemRepository implements ReviewItemRepository {
    private firestore?;
    private collectionName;
    constructor(firestore?: any | undefined);
    create(reviewItem: ReviewItemEntity): Promise<ReviewItemEntity>;
    update(reviewItem: ReviewItemEntity): Promise<void>;
    findById(reviewItemId: string): Promise<ReviewItemEntity | null>;
    findByPlanId(planId: string): Promise<ReviewItemEntity[]>;
    findDueToday(userId: string): Promise<ReviewItemEntity[]>;
    findByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<ReviewItemEntity[]>;
    delete(reviewItemId: string): Promise<void>;
    deleteByPlanId(planId: string): Promise<void>;
    private _toFirestoreDoc;
    private _fromFirestoreDoc;
}
//# sourceMappingURL=firestore-review-item-repository.d.ts.map