/**
 * ドメイン層 - リポジトリインターフェース
 *
 * 学習計画リポジトリ
 */
import { StudyPlanEntity } from '../entities/study-plan-entity';
/**
 * 学習計画リポジトリインターフェース
 *
 * データアクセスの抽象化。実装はインフラ層に委譲。
 */
export interface StudyPlanRepository {
    /**
     * 学習計画を作成
     */
    create(plan: StudyPlanEntity): Promise<StudyPlanEntity>;
    /**
     * 学習計画を更新
     */
    update(plan: StudyPlanEntity): Promise<void>;
    /**
     * IDで学習計画を検索
     */
    findById(planId: string): Promise<StudyPlanEntity | null>;
    /**
     * ユーザーIDで学習計画を検索
     */
    findByUserId(userId: string): Promise<StudyPlanEntity[]>;
    /**
     * ユーザーIDでアクティブな学習計画を検索
     */
    findActiveByUserId(userId: string): Promise<StudyPlanEntity[]>;
    /**
     * 学習計画を削除
     */
    delete(planId: string): Promise<void>;
}
//# sourceMappingURL=study-plan-repository.d.ts.map