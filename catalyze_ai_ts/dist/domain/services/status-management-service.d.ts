/**
 * ドメイン層 - ドメインサービス
 *
 * ステータス管理サービス - 学習計画のステータス自動管理
 */
import { StudyPlanEntity } from '../entities/study-plan-entity';
import { DailyTaskEntity } from '../entities/daily-task-entity';
import { StudySessionEntity } from '../entities/study-session-entity';
/**
 * ステータス管理サービス
 *
 * 学習計画のステータスを自動的に管理し、ビジネスルールに従って遷移させる
 */
export declare class StatusManagementService {
    /**
     * ステータスを自動更新
     *
     * ビジネスルール:
     * 1. 本日完了 → 学習中: 翌日に新しいタスクがあれば学習中に戻す
     * 2. 学習中 → 本日完了: 本日のタスクが全て完了したら本日完了に
     * 3. 学習中 → 完了: 全周回が完了したら完了に
     */
    updateStatus(plan: StudyPlanEntity, todaysTasks: DailyTaskEntity[], todaysSessions: StudySessionEntity[], allRoundsComplete: boolean): StudyPlanEntity;
    /**
     * 学習可能かどうかを判定
     */
    canStudy(plan: StudyPlanEntity): boolean;
    /**
     * 日別のステータスメッセージを生成
     */
    generateStatusMessage(plan: StudyPlanEntity): string;
}
//# sourceMappingURL=status-management-service.d.ts.map