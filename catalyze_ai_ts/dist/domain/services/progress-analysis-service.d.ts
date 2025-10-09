/**
 * ドメイン層 - ドメインサービス
 *
 * 進捗分析サービス - 学習進捗の分析とパフォーマンス評価
 */
import { StudyPlanEntity } from '../entities/study-plan-entity';
import { StudySessionEntity } from '../entities/study-session-entity';
import { Progress } from '../value-objects/progress';
import { PerformanceMetrics } from '../value-objects/performance-metrics';
import { PerformanceTrend, AchievabilityStatus } from '../types';
/**
 * 進捗分析サービス
 *
 * 学習計画の進捗状況を分析し、パフォーマンス指標を計算
 */
export declare class ProgressAnalysisService {
    /**
     * 学習計画の進捗を計算
     */
    calculateProgress(plan: StudyPlanEntity, sessions: StudySessionEntity[]): Progress;
    /**
     * 周回単位の進捗を計算
     */
    calculateRoundProgress(plan: StudyPlanEntity, sessions: StudySessionEntity[], round: number): Progress;
    /**
     * 平均パフォーマンス指標を計算
     */
    calculateAveragePerformance(sessions: StudySessionEntity[]): PerformanceMetrics;
    /**
     * 最近のパフォーマンストレンドを分析
     *
     * 最新N日間のセッションから傾向を分析
     */
    analyzeRecentTrend(sessions: StudySessionEntity[], recentDays?: number): PerformanceTrend;
    /**
     * 学習時間の予測
     *
     * 過去のセッションから残りの学習時間を推定（ミリ秒）
     */
    estimateRemainingTime(plan: StudyPlanEntity, sessions: StudySessionEntity[]): number;
    /**
     * 達成可能性を評価
     */
    evaluateAchievability(plan: StudyPlanEntity, sessions: StudySessionEntity[]): AchievabilityStatus;
}
//# sourceMappingURL=progress-analysis-service.d.ts.map