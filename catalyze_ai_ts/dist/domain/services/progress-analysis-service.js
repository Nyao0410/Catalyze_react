"use strict";
/**
 * ドメイン層 - ドメインサービス
 *
 * 進捗分析サービス - 学習進捗の分析とパフォーマンス評価
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressAnalysisService = void 0;
const progress_1 = require("../value-objects/progress");
const performance_metrics_1 = require("../value-objects/performance-metrics");
const types_1 = require("../types");
const date_fns_1 = require("date-fns");
/**
 * 進捗分析サービス
 *
 * 学習計画の進捗状況を分析し、パフォーマンス指標を計算
 */
class ProgressAnalysisService {
    /**
     * 学習計画の進捗を計算
     */
    calculateProgress(plan, sessions) {
        // 全セッションで完了した単元数を計算
        const completedUnits = sessions.reduce((sum, session) => {
            if (typeof session.startUnit === 'number' && typeof session.endUnit === 'number') {
                return sum + Math.max(0, session.endUnit - session.startUnit + 1);
            }
            return sum + session.unitsCompleted;
        }, 0);
        // 目標総単元数（周回数を考慮）
        const targetUnits = plan.totalUnits * plan.effectiveRounds;
        // Diagnostic: if completedUnits exceeds targetUnits, log details for debugging
        if (completedUnits > targetUnits) {
            try {
                // eslint-disable-next-line no-console
                console.warn('[ProgressAnalysisService] completedUnits > targetUnits', {
                    planId: plan.id,
                    completedUnits,
                    targetUnits,
                    sessionsCount: sessions.length,
                    sampleSessions: sessions.slice(0, 5).map(s => ({ id: s.id, round: s.round, unitsCompleted: s.unitsCompleted, startUnit: s.startUnit, endUnit: s.endUnit })),
                });
            }
            catch (e) {
                // ignore logging errors
            }
        }
        // Defensive: ensure completedUnits does not exceed targetUnits to avoid Progress constructor error
        const completedClamped = Math.max(0, Math.min(completedUnits, targetUnits));
        return new progress_1.Progress(completedClamped, targetUnits);
    }
    /**
     * 周回単位の進捗を計算
     */
    calculateRoundProgress(plan, sessions, round) {
        // 指定された周回のセッションのみを抽出
        const roundSessions = sessions.filter((s) => s.round === round);
        const completedUnits = roundSessions.reduce((sum, session) => {
            if (typeof session.startUnit === 'number' && typeof session.endUnit === 'number') {
                return sum + Math.max(0, session.endUnit - session.startUnit + 1);
            }
            return sum + session.unitsCompleted;
        }, 0);
        // Diagnostic: if completedUnits exceeds plan.totalUnits, log details for debugging
        if (completedUnits > plan.totalUnits) {
            try {
                // eslint-disable-next-line no-console
                console.warn('[ProgressAnalysisService] round completedUnits > plan.totalUnits', {
                    planId: plan.id,
                    round,
                    completedUnits,
                    planTotalUnits: plan.totalUnits,
                    roundSessionsCount: roundSessions.length,
                    sampleSessions: roundSessions.slice(0, 5).map(s => ({ id: s.id, unitsCompleted: s.unitsCompleted, startUnit: s.startUnit, endUnit: s.endUnit })),
                });
            }
            catch (e) {
                // ignore logging errors
            }
        }
        // Defensive clamp: completedUnits should not exceed plan.totalUnits
        const completedClamped = Math.max(0, Math.min(completedUnits, plan.totalUnits));
        return new progress_1.Progress(completedClamped, plan.totalUnits);
    }
    /**
     * 平均パフォーマンス指標を計算
     */
    calculateAveragePerformance(sessions) {
        if (sessions.length === 0) {
            return new performance_metrics_1.PerformanceMetrics(0.7, 3, 0, 0);
        }
        const avgConcentration = sessions.reduce((sum, s) => sum + s.concentration, 0) / sessions.length;
        const avgDifficulty = sessions.reduce((sum, s) => sum + s.difficulty, 0) / sessions.length;
        const totalDuration = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const totalUnits = sessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
        return new performance_metrics_1.PerformanceMetrics(avgConcentration, Math.round(avgDifficulty), totalDuration, totalUnits);
    }
    /**
     * 最近のパフォーマンストレンドを分析
     *
     * 最新N日間のセッションから傾向を分析
     */
    analyzeRecentTrend(sessions, recentDays = 7) {
        if (sessions.length === 0) {
            return types_1.PerformanceTrend.STABLE;
        }
        const now = new Date();
        const cutoffDate = (0, date_fns_1.subDays)(now, recentDays);
        const recentSessions = sessions
            .filter((s) => (0, date_fns_1.isAfter)(s.date, cutoffDate))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        if (recentSessions.length < 3) {
            return types_1.PerformanceTrend.STABLE;
        }
        // 前半と後半に分割して比較
        const midPoint = Math.floor(recentSessions.length / 2);
        const firstHalf = recentSessions.slice(0, midPoint);
        const secondHalf = recentSessions.slice(midPoint);
        const firstHalfPerf = this.calculateAveragePerformance(firstHalf);
        const secondHalfPerf = this.calculateAveragePerformance(secondHalf);
        const efficiencyDiff = secondHalfPerf.efficiencyScore - firstHalfPerf.efficiencyScore;
        if (efficiencyDiff > 0.1)
            return types_1.PerformanceTrend.IMPROVING;
        if (efficiencyDiff < -0.1)
            return types_1.PerformanceTrend.DECLINING;
        return types_1.PerformanceTrend.STABLE;
    }
    /**
     * 学習時間の予測
     *
     * 過去のセッションから残りの学習時間を推定（ミリ秒）
     */
    estimateRemainingTime(plan, sessions) {
        const progress = this.calculateProgress(plan, sessions);
        if (progress.isComplete) {
            return 0;
        }
        const remainingUnits = progress.remaining;
        if (sessions.length === 0) {
            // セッションがない場合は推定時間を使用
            return remainingUnits * plan.estimatedTimePerUnit;
        }
        // 平均パフォーマンスから時間を推定
        const avgPerf = this.calculateAveragePerformance(sessions);
        const avgTimePerUnit = avgPerf.averageTimePerUnit * 60 * 1000; // 分→ミリ秒
        return Math.round(remainingUnits * avgTimePerUnit);
    }
    /**
     * 達成可能性を評価
     */
    evaluateAchievability(plan, sessions) {
        const progress = this.calculateProgress(plan, sessions);
        // 既に完了している
        if (progress.isComplete) {
            return types_1.AchievabilityStatus.ACHIEVED;
        }
        // 期限切れ
        if (plan.isOverdue()) {
            return types_1.AchievabilityStatus.OVERDUE;
        }
        const timeProgress = plan.timeProgressRatio;
        const unitProgress = progress.percentage;
        const progressDiff = unitProgress - timeProgress;
        // 単元進捗が時間進捗より20%以上先行
        if (progressDiff >= 0.2) {
            return types_1.AchievabilityStatus.COMFORTABLE;
        }
        // 単元進捗が時間進捗に対して±10%以内
        if (progressDiff >= -0.1) {
            return types_1.AchievabilityStatus.ON_TRACK;
        }
        // 残り時間の推定
        const estimatedTime = this.estimateRemainingTime(plan, sessions);
        const remainingTime = plan.remainingDays * 8 * 60 * 60 * 1000; // 1日8時間を想定
        const timeRatio = estimatedTime / remainingTime;
        if (timeRatio <= 1.2) {
            return types_1.AchievabilityStatus.CHALLENGING;
        }
        else if (timeRatio <= 1.5) {
            return types_1.AchievabilityStatus.AT_RISK;
        }
        else {
            return types_1.AchievabilityStatus.IMPOSSIBLE;
        }
    }
}
exports.ProgressAnalysisService = ProgressAnalysisService;
//# sourceMappingURL=progress-analysis-service.js.map