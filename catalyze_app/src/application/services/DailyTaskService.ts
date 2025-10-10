/**
 * StudyNext - Daily Task Service
 * 日次タスク管理サービス
 */

import { DailyTaskEntity, StudyPlanEntity, ProgressAnalysisService, DynamicQuotaCalculator } from 'catalyze-ai';
import { PlanningOrchestrator } from 'catalyze-ai/dist/algorithms/planning-orchestrator';
import { NewPlanningOrchestrator } from 'catalyze-ai/dist/algorithms/new-planning-orchestrator';
// Use the shared service instances from src/services so seeded mock data is visible
import { studyPlanService, studySessionService, reviewItemService } from '../../services';
import { startOfDay, addDays, format } from 'date-fns';

/**
 * 日次タスクサービス
 */
export class DailyTaskService {
  private progressAnalysisService = new ProgressAnalysisService();
  private quotaCalculator = new DynamicQuotaCalculator();

  /**
   * 今日のタスクを取得
   */
  async getTodayTasks(userId: string, date?: Date): Promise<DailyTaskEntity[]> {
    const targetDate = date || new Date();
    // JS: getDay() returns 0=Sunday..6=Saturday. Domain StudyPlanEntity uses 1=Monday..7=Sunday.
    const jsDay = targetDate.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // convert to 1..7
    // Debug logging to help trace why tasks may not be produced
    try {
      // eslint-disable-next-line no-console
      console.log('[DailyTaskService] getTodayTasks', { userId, targetDate: targetDate.toISOString(), dayOfWeek });
    } catch (e) {}
    // アクティブな計画を取得
    const activePlans = await studyPlanService.getActivePlans(userId);

    try {
      // eslint-disable-next-line no-console
      console.log('[DailyTaskService] activePlans count', activePlans.length);
      // eslint-disable-next-line no-console
      console.log('[DailyTaskService] activePlans sample', activePlans.map(p => ({ id: p.id, studyDays: p.studyDays, status: p.status, totalUnits: p.totalUnits })));
    } catch (e) {}

    // 各計画のタスクを生成
    const tasks: DailyTaskEntity[] = [];
    for (const plan of activePlans) {
      const task = await this.generateDailyTask(plan, targetDate);
      if (task) {
        tasks.push(task);
      }
    }

    // dedupe by id to avoid duplicates
    const deduped = Array.from(new Map(tasks.map((t) => [t.id, t])).values());
    return deduped;
  }

  /**
   * 指定日のタスクを取得
   */
  async getTasksForDate(userId: string, date: Date): Promise<DailyTaskEntity[]> {
    const targetDate = startOfDay(date);

    // アクティブな計画を取得
    const activePlans = await studyPlanService.getActivePlans(userId);

    // 各計画のタスクを生成
    const tasks: DailyTaskEntity[] = [];
    for (const plan of activePlans) {
      const task = await this.generateDailyTask(plan, targetDate);
      if (task) {
        tasks.push(task);
      }
    }

    // 追加: 指定日の復習アイテムを日別タスクリストに含める（ユニットをまとめて範囲化）
    try {
      const allReviewItems = await reviewItemService.getReviewItemsByUserId(userId);
      const reviewsForDate = allReviewItems.filter((item) => startOfDay(item.nextReviewDate).getTime() === targetDate.getTime());

      // グルーピング: planId ごとに unitNumber を集める
      const groups: { [key: string]: number[] } = {};
      reviewsForDate.forEach((r) => {
        const key = `${r.planId}_${format(startOfDay(r.nextReviewDate), 'yyyy-MM-dd')}`;
        groups[key] = groups[key] || [];
        const n = Number(r.unitNumber);
        if (!Number.isNaN(n)) groups[key].push(n);
      });

      const mergeUnitsToRanges = (units: number[]) => {
        const sorted = Array.from(new Set(units)).sort((a, b) => a - b);
        const ranges: Array<{ start: number; end: number; units: number }> = [];
        let curStart: number | null = null;
        let curEnd: number | null = null;
        for (const u of sorted) {
          if (curStart === null) {
            curStart = u;
            curEnd = u;
            continue;
          }
          if (u === (curEnd as number) + 1) {
            curEnd = u;
          } else {
            ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
            curStart = u;
            curEnd = u;
          }
        }
        if (curStart !== null) ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
        return ranges;
      };

      for (const key of Object.keys(groups)) {
        const [planId, ...rest] = key.split('_');
        const dateKey = rest.join('_');
        const units = groups[key];
        const ranges = mergeUnitsToRanges(units);
        for (let idx = 0; idx < ranges.length; idx++) {
          const r = ranges[idx];
          // try to get plan's per-unit estimate; fallback to 5 minutes per unit
          let planObj = null;
          try {
            planObj = await studyPlanService.getPlanById(planId);
          } catch (e) {
            planObj = null;
          }
          // If plan exists, skip creating a review task for this date when it's not a study day
          if (planObj) {
            try {
              const reviewDate = startOfDay(new Date(dateKey));
              const weekday = reviewDate.getDay() === 0 ? 7 : reviewDate.getDay();
              if (!planObj.isStudyDay(weekday)) {
                // skip creating review task for non-study days
                continue;
              }
            } catch (e) {
              // if any error occurs determining study day, fall back to including the task
            }
          }
          const perUnitMs = planObj?.estimatedTimePerUnit ?? 5 * 60 * 1000;
          try {
            // eslint-disable-next-line no-console
            console.log('[DailyTaskService] getTasksForDate: review perUnitMs', { planId, dateKey, perUnitMs, planEstimated: planObj?.estimatedTimePerUnit });
          } catch (e) {}
          const reviewTask = new DailyTaskEntity({
            id: `review-${planId}-${dateKey}-${r.start}-${r.end}-${idx}`,
            planId,
            date: new Date(dateKey),
            startUnit: r.start,
            endUnit: r.end,
            units: r.units,
            estimatedDuration: r.units * perUnitMs,
            round: 1,
            advice: '復習しましょう！',
          });
          tasks.push(reviewTask);
        }
      }
    } catch (e) {
      try { console.warn('[DailyTaskService] failed to fetch/merge review items for date', e); } catch (er) {}
    }

    // dedupe by id before returning
    const deduped = Array.from(new Map(tasks.map((t) => [t.id, t])).values());
    return deduped;
  }

  /**
   * 特定の計画の指定日のタスクを取得
   */
  async getTasksByPlan(planId: string, date?: Date): Promise<DailyTaskEntity[]> {
    const targetDate = date || new Date();
    const plan = await studyPlanService.getPlanById(planId);

    if (!plan) {
      return [];
    }

    const task = await this.generateDailyTask(plan, targetDate);
    return task ? [task] : [];
  }

  /**
   * 日次タスクを生成
   */
  private async generateDailyTask(
    plan: StudyPlanEntity,
    date: Date
  ): Promise<DailyTaskEntity | null> {
    // その日のセッションを取得
    const sessions = await studySessionService.getSessionsByPlanId(plan.id);

    // If this is the problematic plan, log full details to help debugging
    if (plan.id === 'plan-1759912840548') {
      try {
        // eslint-disable-next-line no-console
        console.log('[DailyTaskService:DEBUG] plan full', JSON.stringify({
          id: plan.id,
          unitRange: plan.unitRange,
          totalUnits: plan.totalUnits,
          rounds: plan.rounds,
          targetRounds: plan.targetRounds,
          studyDays: plan.studyDays,
          deadline: plan.deadline,
        }));
        // eslint-disable-next-line no-console
        console.log('[DailyTaskService:DEBUG] sessions', JSON.stringify(sessions.map(s=>({round:s.round,unitsCompleted:s.unitsCompleted,date:s.date, difficulty:s.difficulty, concentration:s.concentration}))));
      } catch (e) {}
    }

    // 動的ノルマを計算
    const quotaResult = this.quotaCalculator.calculate(plan, sessions);
    const dailyQuota = Math.ceil(quotaResult.recommendedDailyQuota);

    // 学習日かチェック
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    if (!plan.isStudyDay(weekday)) {
      return null;
    }

  // NewPlanningOrchestrator を試験的に使う（より堅牢な割当）
  const orchestrator = new NewPlanningOrchestrator();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = orchestrator.generatePlan(plan, sessions, []);

    // 正規化: orchestrator の出力が日付を文字列で返す可能性に備えて Date に変換
    // かつ DailyTaskEntity のインスタンスを再構築して getter（estimatedMinutes 等）を保持する
    const normalizedDailyTasks = (result.dailyTasks || []).map((t: any) => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return new DailyTaskEntity({
        id: t.id,
        planId: t.planId,
        date,
        startUnit: t.startUnit,
        endUnit: t.endUnit,
        units: t.units,
        estimatedDuration: t.estimatedDuration,
        round: t.round,
        advice: t.advice,
      });
    });

    // 指定日のタスクを取得
    const targetDate = startOfDay(date);
    const dailyTask = normalizedDailyTasks.find((t: any) => {
      const d = startOfDay(t.date);
      return d.getTime() === targetDate.getTime();
    });

    return dailyTask || null;
  }

  /**
   * アドバイスを生成
   */
  private generateAdvice(plan: StudyPlanEntity, sessions: any[]): string {
    const achievability = this.progressAnalysisService.evaluateAchievability(plan, sessions);

    switch (achievability) {
      case 'comfortable':
        return '順調です！このペースを維持しましょう。';
      case 'onTrack':
        return '良いペースです！計画通りに進めましょう。';
      case 'challenging':
        return '少し遅れ気味です。集中して取り組みましょう。';
      case 'atRisk':
        return '遅れています。ペースアップが必要です。';
      case 'impossible':
        return '大幅に遅れています。計画の見直しを検討しましょう。';
      default:
        return '今日も頑張りましょう！';
    }
  }

  /**
   * 今後N日間のタスクを取得
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<DailyTaskEntity[]> {
    const tasks: DailyTaskEntity[] = [];
    const today = startOfDay(new Date());

    // 1) アクティブなプランを取得
    const activePlans = await studyPlanService.getActivePlans(userId);

  // 2) 各プランごとにオーケストレータで日次タスクを一括生成
  const orchestrator = new NewPlanningOrchestrator();
    for (const plan of activePlans) {
      // 該当プランのセッション履歴
      const sessions = await studySessionService.getSessionsByPlanId(plan.id);

      // 復習アイテムを取得
      const reviewItems = await reviewItemService.getReviewItemsByPlanId(plan.id);

      // debug: log plan and session summary
      // eslint-disable-next-line no-console
      console.log('[DailyTaskService] generate upcoming for plan', { planId: plan.id, totalUnits: plan.totalUnits, sessions: sessions.length, reviewItems: reviewItems.length });

      // orchestrator が dailyTasks を生成（最大30日分のロジックを内部に持つ）
  const result = orchestrator.generatePlan(plan, sessions, reviewItems);
  // Normalize dailyTasks: ensure Date objects and construct DailyTaskEntity instances so getters (estimatedMinutes) are available
  const normalizedDailyTasks = (result.dailyTasks || []).map((t: any) => {
    const date = t.date instanceof Date ? t.date : new Date(t.date);
    return new DailyTaskEntity({
      id: t.id,
      planId: t.planId,
      date,
      startUnit: t.startUnit,
      endUnit: t.endUnit,
      units: t.units,
      estimatedDuration: t.estimatedDuration,
      round: t.round,
      advice: t.advice,
    });
  });
  // eslint-disable-next-line no-console
  console.log('[DailyTaskService] orchestrator result', { planId: plan.id, dailyTasksCount: normalizedDailyTasks.length, roundTasksCount: result.roundTasks.length });

      // If any small assignments (<=5 units) were generated, log full context for diagnosis
      try {
  const small = normalizedDailyTasks.filter((t) => t.units <= 5);
        if (small.length > 0) {
          // eslint-disable-next-line no-console
          console.log('[DailyTaskService:ALERT] small dailyTasks detected', {
            planId: plan.id,
            plan: { id: plan.id, unitRange: plan.unitRange, totalUnits: plan.totalUnits, targetRounds: plan.targetRounds, studyDays: plan.studyDays, deadline: plan.deadline },
            sessions: sessions.map(s => ({ id: s.id, round: s.round, unitsCompleted: s.unitsCompleted, date: s.date })),
            roundTasks: result.roundTasks,
            smallDailyTasks: small.map((t) => ({ date: t.date, start: t.startUnit, end: t.endUnit, units: t.units, round: t.round })),
          });
        }
      } catch (e) {}

      // dailyTasks のうち、今日から days 日間の範囲に含まれるものを追加
      const windowEnd = addDays(today, days - 1);
      const inWindow = normalizedDailyTasks.filter((t) => {
        const d = startOfDay(t.date);
        return d >= today && d <= windowEnd;
      });

      tasks.push(...inWindow);
    }

    // 3) 復習タスクを追加
    const allReviewItems = await reviewItemService.getReviewItemsByUserId(userId);
    const windowEnd = addDays(today, days - 1);
    const upcomingReviews = allReviewItems.filter((item) => {
      const nextDate = startOfDay(item.nextReviewDate);
      return nextDate >= today && nextDate <= windowEnd;
    });

    // Group upcomingReviews by planId + date and merge contiguous unitNumbers into ranges
    const groups: { [key: string]: number[] } = {};
    upcomingReviews.forEach((r) => {
      const key = `${r.planId}_${format(startOfDay(r.nextReviewDate), 'yyyy-MM-dd')}`;
      groups[key] = groups[key] || [];
      if (typeof r.unitNumber === 'number') groups[key].push(r.unitNumber);
    });

    const mergeUnitsToRanges = (units: number[]) => {
      const sorted = Array.from(new Set(units)).sort((a, b) => a - b);
      const ranges: Array<{ start: number; end: number; units: number }> = [];
      let curStart: number | null = null;
      let curEnd: number | null = null;
      for (const u of sorted) {
        if (curStart === null) {
          curStart = u;
          curEnd = u;
          continue;
        }
        if (u === (curEnd as number) + 1) {
          curEnd = u;
        } else {
          ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
          curStart = u;
          curEnd = u;
        }
      }
      if (curStart !== null) ranges.push({ start: curStart, end: curEnd as number, units: (curEnd as number) - curStart + 1 });
      return ranges;
    };

    for (const key of Object.keys(groups)) {
      const [planId] = key.split('_');
      const dateKey = key.split('_').slice(1).join('_');
      const units = groups[key];
      const ranges = mergeUnitsToRanges(units);
      for (let idx = 0; idx < ranges.length; idx++) {
        const r = ranges[idx];
        // try to fetch plan to use its estimatedTimePerUnit; fallback to 5 minutes
        let planObj = null;
        try {
          planObj = await studyPlanService.getPlanById(planId);
        } catch (e) {
          planObj = null;
        }
        // If plan exists, skip creating a review task for this date when it's not a study day
        if (planObj) {
          try {
            const reviewDate = startOfDay(new Date(dateKey));
            const weekday = reviewDate.getDay() === 0 ? 7 : reviewDate.getDay();
            if (!planObj.isStudyDay(weekday)) {
              // skip creating review task for non-study days
              continue;
            }
          } catch (e) {
            // fall back to including the task on error
          }
        }
        const perUnitMs = planObj?.estimatedTimePerUnit ?? 5 * 60 * 1000;
        try {
          // eslint-disable-next-line no-console
          console.log('[DailyTaskService] getUpcomingTasks: review perUnitMs', { planId, dateKey, perUnitMs, planEstimated: planObj?.estimatedTimePerUnit });
        } catch (e) {}
        const reviewTask = new DailyTaskEntity({
          id: `review-${planId}-${dateKey}-${r.start}-${r.end}-${idx}`,
          planId,
          date: new Date(dateKey),
          startUnit: r.start,
          endUnit: r.end,
          units: r.units,
          estimatedDuration: r.units * perUnitMs,
          round: 1,
          advice: '復習しましょう！',
        });
        tasks.push(reviewTask);
      }
    }

    // dedupe by id and sort by date before returning
    const deduped = Array.from(new Map(tasks.map((t) => [t.id, t])).values());
    return deduped.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

// シングルトンインスタンス
export const dailyTaskService = new DailyTaskService();
