/**
 * インフラストラクチャ層 - メモリ実装
 *
 * StudyPlanRepositoryのインメモリ実装（テスト・開発用）
 */
import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
/**
 * メモリ内StudyPlanRepository実装
 *
 * テストや開発環境用のシンプルな実装
 */
export declare class InMemoryStudyPlanRepository implements StudyPlanRepository {
    private plans;
    create(plan: StudyPlanEntity): Promise<StudyPlanEntity>;
    update(plan: StudyPlanEntity): Promise<void>;
    findById(planId: string): Promise<StudyPlanEntity | null>;
    findByUserId(userId: string): Promise<StudyPlanEntity[]>;
    findActiveByUserId(userId: string): Promise<StudyPlanEntity[]>;
    delete(planId: string): Promise<void>;
    /**
     * テスト用: 全データクリア
     */
    clear(): void;
    /**
     * テスト用: 全データ取得
     */
    getAll(): StudyPlanEntity[];
}
//# sourceMappingURL=in-memory-study-plan-repository.d.ts.map