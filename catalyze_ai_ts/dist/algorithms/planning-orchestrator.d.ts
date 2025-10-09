/**
 * PlanningOrchestrator
 *
 * 動的ノルマ、周回計画、復習スケジュールの出力を統合し、日次タスクリストを生成する統合制御エンジン。
 */
import { StudyPlanEntity } from '../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../domain/entities/study-session-entity';
import { ReviewItemEntity } from '../domain/entities/review-item-entity';
import { RoundTask } from './multi-round-planner';
import { DailyTaskEntity } from '../domain/entities/daily-task-entity';
export interface OrchestratorResult {
    dailyTasks: DailyTaskEntity[];
    roundTasks: RoundTask[];
    dailyQuota: number;
    provisionalDeadline: Date;
}
export declare class PlanningOrchestrator {
    private quotaCalc;
    private planner;
    /**
     * 本格的な計画生成
     * - 動的ノルマ計算
     * - 周回計画の生成（1周目完了後は苦手分野に焦点）
     * - 復習タスクの統合
     * - 複数日の日次タスクリスト生成
     *
     * @param plan 学習計画
     * @param sessions 学習セッション履歴
     * @param _reviewItems 復習アイテム（今後の拡張用）
     */
    generatePlan(plan: StudyPlanEntity, sessions: StudySessionEntity[], _reviewItems?: ReviewItemEntity[], dailyQuotaOverride?: number): OrchestratorResult;
    /**
     * 周回計画の生成
     */
    private _generateRoundTasks;
    /**
     * 日次タスクの割り当て
     */
    private _allocateDailyTasks;
    /**
     * 既存セッションから進捗サマリーを取得
     */
    getProgressSummary(plan: StudyPlanEntity, sessions: StudySessionEntity[]): {
        totalCompleted: number;
        currentRound: number;
        progressPercentage: number;
    };
}
//# sourceMappingURL=planning-orchestrator.d.ts.map