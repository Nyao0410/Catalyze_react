/**
 * インフラストラクチャ層 - Firestore実装
 *
 * StudyPlanRepositoryのFirestore実装
 * 注: 実際のFirebaseアクセスは設定が必要です
 */
import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
/**
 * Firestore用のStudyPlanRepository実装
 *
 * このクラスは参考実装です。実際の使用にはFirebase SDKの設定が必要です。
 */
export declare class FirestoreStudyPlanRepository implements StudyPlanRepository {
    private firestore?;
    private collectionName;
    constructor(firestore?: any | undefined);
    create(plan: StudyPlanEntity): Promise<StudyPlanEntity>;
    update(plan: StudyPlanEntity): Promise<void>;
    findById(planId: string): Promise<StudyPlanEntity | null>;
    findByUserId(userId: string): Promise<StudyPlanEntity[]>;
    findActiveByUserId(userId: string): Promise<StudyPlanEntity[]>;
    delete(planId: string): Promise<void>;
    private _toFirestoreDoc;
    private _fromFirestoreDoc;
}
//# sourceMappingURL=firestore-study-plan-repository.d.ts.map