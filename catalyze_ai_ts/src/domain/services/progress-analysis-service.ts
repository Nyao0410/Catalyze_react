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
import { isAfter, subDays } from 'date-fns';

/**
 * 進捗分析サービス
 * 
 * 学習計画の進捗状況を分析し、パフォーマンス指標を計算
 */
export class ProgressAnalysisService {
  /**
   * 学習計画の進捗を計算
   */
  calculateProgress(plan: StudyPlanEntity, sessions: StudySessionEntity[]): Progress {
    // 全セッションで完了した単元数を計算
    const completedUnits = sessions.reduce((sum, session) => {
      if (typeof session.startUnit === 'number' && typeof session.endUnit === 'number') {
        return sum + Math.max(0, session.endUnit - session.startUnit + 1);
      }
      return sum + session.unitsCompleted;
    }, 0);

    // 目標総単元数（周回数を考慮）
    const targetUnits = plan.totalUnits * plan.effectiveRounds;

    return new Progress(completedUnits, targetUnits);
  }

  /**
   * 周回単位の進捗を計算
   */
  calculateRoundProgress(
    plan: StudyPlanEntity,
    sessions: StudySessionEntity[],
    round: number
  ): Progress {
    // 指定された周回のセッションのみを抽出
    const roundSessions = sessions.filter((s) => s.round === round);

    const completedUnits = roundSessions.reduce((sum, session) => {
      if (typeof session.startUnit === 'number' && typeof session.endUnit === 'number') {
        return sum + Math.max(0, session.endUnit - session.startUnit + 1);
      }
      return sum + session.unitsCompleted;
    }, 0);

    return new Progress(completedUnits, plan.totalUnits);
  }

  /**
   * 平均パフォーマンス指標を計算
   */
  calculateAveragePerformance(sessions: StudySessionEntity[]): PerformanceMetrics {
    if (sessions.length === 0) {
      return new PerformanceMetrics(0.7, 3, 0, 0);
    }

    const avgConcentration =
      sessions.reduce((sum, s) => sum + s.concentration, 0) / sessions.length;

    const avgDifficulty = sessions.reduce((sum, s) => sum + s.difficulty, 0) / sessions.length;

    const totalDuration = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    const totalUnits = sessions.reduce((sum, s) => sum + s.unitsCompleted, 0);

    return new PerformanceMetrics(
      avgConcentration,
      Math.round(avgDifficulty),
      totalDuration,
      totalUnits
    );
  }

  /**
   * 最近のパフォーマンストレンドを分析
   * 
   * 最新N日間のセッションから傾向を分析
   */
  analyzeRecentTrend(sessions: StudySessionEntity[], recentDays: number = 7): PerformanceTrend {
    if (sessions.length === 0) {
      return PerformanceTrend.STABLE;
    }

    const now = new Date();
    const cutoffDate = subDays(now, recentDays);

    const recentSessions = sessions
      .filter((s) => isAfter(s.date, cutoffDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (recentSessions.length < 3) {
      return PerformanceTrend.STABLE;
    }

    // 前半と後半に分割して比較
    const midPoint = Math.floor(recentSessions.length / 2);
    const firstHalf = recentSessions.slice(0, midPoint);
    const secondHalf = recentSessions.slice(midPoint);

    const firstHalfPerf = this.calculateAveragePerformance(firstHalf);
    const secondHalfPerf = this.calculateAveragePerformance(secondHalf);

    const efficiencyDiff = secondHalfPerf.efficiencyScore - firstHalfPerf.efficiencyScore;

    if (efficiencyDiff > 0.1) return PerformanceTrend.IMPROVING;
    if (efficiencyDiff < -0.1) return PerformanceTrend.DECLINING;
    return PerformanceTrend.STABLE;
  }

  /**
   * 学習時間の予測
   * 
   * 過去のセッションから残りの学習時間を推定（ミリ秒）
   */
  estimateRemainingTime(plan: StudyPlanEntity, sessions: StudySessionEntity[]): number {
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
  evaluateAchievability(plan: StudyPlanEntity, sessions: StudySessionEntity[]): AchievabilityStatus {
    const progress = this.calculateProgress(plan, sessions);

    // 既に完了している
    if (progress.isComplete) {
      return AchievabilityStatus.ACHIEVED;
    }

    // 期限切れ
    if (plan.isOverdue()) {
      return AchievabilityStatus.OVERDUE;
    }

    const timeProgress = plan.timeProgressRatio;
    const unitProgress = progress.percentage;
    const progressDiff = unitProgress - timeProgress;

    // 単元進捗が時間進捗より20%以上先行
    if (progressDiff >= 0.2) {
      return AchievabilityStatus.COMFORTABLE;
    }

    // 単元進捗が時間進捗に対して±10%以内
    if (progressDiff >= -0.1) {
      return AchievabilityStatus.ON_TRACK;
    }

    // 残り時間の推定
    const estimatedTime = this.estimateRemainingTime(plan, sessions);
    const remainingTime = plan.remainingDays * 8 * 60 * 60 * 1000; // 1日8時間を想定

    const timeRatio = estimatedTime / remainingTime;

    if (timeRatio <= 1.2) {
      return AchievabilityStatus.CHALLENGING;
    } else if (timeRatio <= 1.5) {
      return AchievabilityStatus.AT_RISK;
    } else {
      return AchievabilityStatus.IMPOSSIBLE;
    }
  }
}
