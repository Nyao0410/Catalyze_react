import { StudyPlanEntity } from '../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../domain/entities/study-session-entity';
import { ReviewItemEntity } from '../domain/entities/review-item-entity';
import { DynamicQuotaCalculator } from './dynamic-quota-calculator';
import { MultiRoundPlanner, RoundTask } from './multi-round-planner';
import { DailyTaskEntity } from '../domain/entities/daily-task-entity';
import { addDays, startOfDay } from 'date-fns';

export interface OrchestratorResult {
  dailyTasks: DailyTaskEntity[];
  roundTasks: RoundTask[];
  dailyQuota: number;
  provisionalDeadline: Date;
}

/**
 * NewPlanningOrchestrator
 * より明確で堅牢な日次割当ロジックを提供するオーケストレータ
 */
export class NewPlanningOrchestrator {
  private quotaCalc = new DynamicQuotaCalculator();
  private planner = new MultiRoundPlanner();

  generatePlan(
    plan: StudyPlanEntity,
    sessions: StudySessionEntity[],
    _reviewItems: ReviewItemEntity[] = [],
    dailyQuotaOverride?: number
  ): OrchestratorResult {
    const quota = this.quotaCalc.calculate(plan, sessions);
    const usedDailyQuota = typeof dailyQuotaOverride === 'number' ? dailyQuotaOverride : quota.recommendedDailyQuota;

    // generate roundTasks (reuse existing simple logic)
    const roundTasks = this._generateRoundTasks(plan, sessions);

    const dailyTasks = this._allocate(plan, sessions, roundTasks, quota.adjustedTimePerUnitMs, usedDailyQuota);

    return {
      dailyTasks,
      roundTasks,
      dailyQuota: usedDailyQuota,
      provisionalDeadline: quota.provisionalDeadline,
    };
  }

  private _generateRoundTasks(plan: StudyPlanEntity, sessions: StudySessionEntity[]): RoundTask[] {
    const rangeStart = plan.unitRange?.start ?? 1;
    const rangeEnd = plan.unitRange?.end ?? plan.totalUnits;
    const rangeTotal = rangeEnd - rangeStart + 1;

    const firstRoundCompleted = sessions.filter((s) => s.round === 1).reduce((sum, s) => sum + s.unitsCompleted, 0);

    if (firstRoundCompleted >= rangeTotal && plan.targetRounds > 1) {
      const generated = this.planner.generateRoundTasks(rangeTotal, plan.targetRounds);
      return generated.map((rt) => ({ ...rt, startUnit: rt.startUnit + (rangeStart - 1), endUnit: rt.endUnit + (rangeStart - 1) }));
    }

    return [ { round: 1, startUnit: rangeStart, endUnit: rangeEnd, units: rangeTotal } ];
  }

  /**
   * ★新規追加: セッションがどのラウンドタスク範囲に属するかを判定し、
   * 各範囲内で完了したユニット数をカウント
   */
  private _calculateCompletedByRange(sessions: StudySessionEntity[], roundTasks: RoundTask[]): number {
    let total = 0;
    for (const session of sessions) {
      // セッションに startUnit/endUnit が設定されている場合、その範囲がラウンドタスク内か確認
      if (typeof session.startUnit === 'number' && typeof session.endUnit === 'number') {
        const sessionStart = session.startUnit;
        const sessionEnd = session.endUnit;
        
        // このセッションが属するラウンドタスクを探す
        const matchingRoundTask = roundTasks.find((rt) => {
          // セッションがこのラウンドタスクの範囲内かつラウンドが一致するかチェック
          return (
            session.round === rt.round &&
            sessionStart >= rt.startUnit &&
            sessionEnd <= rt.endUnit
          );
        });

        // マッチするラウンドタスクがある場合のみカウント
        if (matchingRoundTask) {
          total += session.unitsCompleted;
        }
        // マッチしない場合は無視（別のラウンドや不正なセッション）
      } else {
        // startUnit/endUnit が設定されていない古いセッション
        // ラウンド番号でフィルタリング：同じラウンドのセッションのみカウント
        const matchingRound = roundTasks.find((rt) => rt.round === session.round);
        if (matchingRound) {
          total += session.unitsCompleted;
        }
      }
    }
    return total;
  }

  private _allocate(
    plan: StudyPlanEntity,
    sessions: StudySessionEntity[],
    roundTasks: RoundTask[],
    adjustedTimePerUnitMs: number,
    usedDailyQuota: number
  ): DailyTaskEntity[] {
    const tasks: DailyTaskEntity[] = [];
    const today = startOfDay(new Date());

    // build remaining units across roundTasks considering completed sessions
    // ★修正: ラウンドタスク範囲に基づいてセッションをフィルタリング
    const totalCompletedUnits = this._calculateCompletedByRange(sessions, roundTasks);

    // flatten remaining range list (start,end,round) in order
    const remainingRanges: { round: number; start: number; end: number; units: number }[] = [];
    for (const rt of roundTasks) {
      remainingRanges.push({ round: rt.round, start: rt.startUnit, end: rt.endUnit, units: rt.endUnit - rt.startUnit + 1 });
    }

    // consume completed units from the front
    let completed = totalCompletedUnits;
    while (completed > 0 && remainingRanges.length > 0) {
      const head = remainingRanges[0];
      if (completed >= head.units) {
        completed -= head.units;
        remainingRanges.shift();
      } else {
        // shrink head
        head.start += completed;
        head.units -= completed;
        completed = 0;
      }
    }

    if (remainingRanges.length === 0) return tasks;

    // compute total remaining units
    let totalRemainingUnits = remainingRanges.reduce((a, b) => a + b.units, 0);

    // compute study dates
    const deadlineDay = startOfDay(plan.dynamicDeadline ?? plan.deadline);
    const studyDates: Date[] = [];
    let cursor = today;
    while (cursor <= deadlineDay) {
      const jsDay = cursor.getDay();
      const weekday = jsDay === 0 ? 7 : jsDay;
      if (plan.isStudyDay(weekday)) studyDates.push(cursor);
      cursor = addDays(cursor, 1);
      if (studyDates.length > 365) break;
    }
    if (studyDates.length === 0) {
      cursor = today;
      for (let i = 0; i < 30; i++) { studyDates.push(cursor); cursor = addDays(cursor, 1); }
    }

    const daysCount = studyDates.length;

    // per-day target: ensure we meet both quota and deadline
    const perDayFromRemaining = Math.ceil(totalRemainingUnits / daysCount);
    const perDayMin = Math.max(Math.ceil(usedDailyQuota || 0), perDayFromRemaining);

    // allocate sequentially, one DailyTask per studyDate, consuming ranges
    let rangeIndex = 0;
    for (let d = 0; d < daysCount && totalRemainingUnits > 0 && rangeIndex < remainingRanges.length; d++) {
      const assignDate = studyDates[d];
      let toAssign = Math.min(perDayMin, totalRemainingUnits);

      // start from current rangeIndex and consume until toAssign is zero
      let dayStart: number | null = null;
      let dayEnd: number | null = null;
      let dayUnits = 0;
      while (toAssign > 0 && rangeIndex < remainingRanges.length) {
        const rng = remainingRanges[rangeIndex];
        const take = Math.min(toAssign, rng.units);
        const segStart = rng.start;
        const segEnd = rng.start + take - 1;

        if (dayStart === null) dayStart = segStart;
        dayEnd = segEnd;
        dayUnits += take;

        // advance range
        rng.start += take;
        rng.units -= take;
        if (rng.units <= 0) rangeIndex++;

        toAssign -= take;
        totalRemainingUnits -= take;
      }

      if (dayUnits > 0 && dayStart !== null && dayEnd !== null) {
        tasks.push(new DailyTaskEntity({
          id: `${plan.id}-${assignDate.toISOString().slice(0,10)}-r${remainingRanges[Math.max(0, rangeIndex-1)]?.round ?? remainingRanges[0].round}`,
          planId: plan.id,
          date: assignDate,
          startUnit: dayStart,
          endUnit: dayEnd,
          units: dayUnits,
          estimatedDuration: adjustedTimePerUnitMs * dayUnits,
          round: remainingRanges[Math.max(0, rangeIndex-1)]?.round ?? remainingRanges[0].round,
          advice: '頑張りましょう！',
        }));
      }
    }

    // if any totalRemainingUnits remain (shouldn't happen), append them to the last study day
    if (totalRemainingUnits > 0) {
      const lastDate = studyDates[studyDates.length-1];
      const lastStart = remainingRanges[remainingRanges.length-1].start;
      const lastEnd = remainingRanges[remainingRanges.length-1].end;
      tasks.push(new DailyTaskEntity({
        id: `${plan.id}-${lastDate.toISOString().slice(0,10)}-r${remainingRanges[remainingRanges.length-1].round}`,
        planId: plan.id,
        date: lastDate,
        startUnit: lastStart,
        endUnit: lastEnd,
        units: remainingRanges[remainingRanges.length-1].units,
        estimatedDuration: adjustedTimePerUnitMs * remainingRanges[remainingRanges.length-1].units,
        round: remainingRanges[remainingRanges.length-1].round,
        advice: '締切に間に合わせましょう',
      }));
    }

    // debug
    try {
      // eslint-disable-next-line no-console
      console.log('[NewOrchestrator] plan', { planId: plan.id, totalRemainingUnits });
    } catch (e) {}

    return tasks;
  }
}
