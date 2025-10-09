/**
 * DynamicQuotaCalculator
 *
 * レガシーの動的ノルマ調整エンジンをTypeScriptで移植したもの。
 * 目的: 学習記録からパフォーマンス係数を計算し、1単位あたりの所要時間を調整、
 * 残り学習量と締切から仮締切や日次ノルマの提案を行う。
 */

import { StudyPlanEntity } from '../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../domain/entities/study-session-entity';
import { startOfDay, eachDayOfInterval } from 'date-fns';

export interface DynamicQuotaResult {
  adjustedTimePerUnitMs: number; // ミリ秒
  provisionalDeadline: Date;
  recommendedDailyQuota: number;
}

export class DynamicQuotaCalculator {
  static readonly NEUTRAL_PERFORMANCE_FACTOR = 9.0; // difficulty=3, concentration=3 相当の基準

  /**
   * 計算エントリポイント
   * @param plan
   * @param sessions - 昨日までのセッション
   */
  calculate(plan: StudyPlanEntity, sessions: StudySessionEntity[]): DynamicQuotaResult {
    const progressCompleted = sessions.reduce((s, v) => s + v.unitsCompleted, 0);
  const rangeStart = plan.unitRange?.start ?? 1;
  const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
  const rangeTotal = rangeEnd - rangeStart + 1;
  const targetUnits = rangeTotal * plan.effectiveRounds;
    const remainingUnits = Math.max(0, targetUnits - progressCompleted);

    // 平均パフォーマンス係数
    const avgPerfFactor = this._calculateAveragePerformanceFactor(sessions);

    // 調整率
    const adjustmentRate = avgPerfFactor / DynamicQuotaCalculator.NEUTRAL_PERFORMANCE_FACTOR || 1.0;

    // 基本所要時間（プランに指定された estimatedTimePerUnit を使用）
    const baseTimePerUnitMs = plan.estimatedTimePerUnit;

    // 調整後所要時間
    const adjustedTimePerUnitMs = Math.max(1000, Math.round(baseTimePerUnitMs / adjustmentRate));

    // 締切から逆算して日次ノルマを計算する
    // dynamicDeadline が指定されていれば優先して使用する
    const today = startOfDay(new Date());
    const deadline = startOfDay(plan.dynamicDeadline ?? plan.deadline);

    // 指定期間内の学習日数を数える（plan.studyDays は 1=Mon..7=Sun）
    let studyDaysCount = 0;
    try {
      const days = eachDayOfInterval({ start: today, end: deadline });
      studyDaysCount = days.reduce((acc, d) => {
        const jsDay = d.getDay();
        const weekday = jsDay === 0 ? 7 : jsDay; // convert to 1..7
        return acc + (plan.studyDays.includes(weekday) ? 1 : 0);
      }, 0);
    } catch (e) {
      // eachDayOfInterval throws if end < start; fallback to 0
      studyDaysCount = 0;
    }

    // fallback: 締切が過去または学習日がゼロの場合はカレンダー日数で割る
    if (studyDaysCount <= 0) {
      const millisPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / millisPerDay));
      studyDaysCount = diffDays;
    }

  // 基本ノルマ（締切ベース） - 小数も保持して返す（丸めは呼び出し側で行う）
  const basicQuota = remainingUnits / studyDaysCount;

  // 推奨ノルマ（floatで返す。表示/整数丸めは呼び出し側に任せる）
  const recommendedDailyQuota = Math.max(1, basicQuota);

    // 仮締切はプランの締切をそのまま返す
    const provisionalDeadline = deadline;

    // debug
    // eslint-disable-next-line no-console
    console.log(`[DynamicQuotaCalculator] planId=${plan.id} remainingUnits=${remainingUnits} studyDaysCount=${studyDaysCount} recommendedDailyQuota=${recommendedDailyQuota} adjustedTimePerUnitMs=${adjustedTimePerUnitMs}`);

    return {
      adjustedTimePerUnitMs,
      provisionalDeadline,
      recommendedDailyQuota,
    };
  }

  private _calculateAveragePerformanceFactor(sessions: StudySessionEntity[]): number {
    if (sessions.length === 0) return DynamicQuotaCalculator.NEUTRAL_PERFORMANCE_FACTOR;

    // 各セッションのパフォーマンス係数を、Dart実装の基準に合わせて再現
    const factors = sessions.map((s) => (6 - s.difficulty) * s.concentration);
    const avg = factors.reduce((a, b) => a + b, 0) / factors.length;
    return avg;
  }
}
