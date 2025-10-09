/**
 * StudyNext - Daily Task Service
 * 日次タスク管理サービス
 */

import { DailyTaskEntity, StudyPlanEntity, ProgressAnalysisService, DynamicQuotaCalculator } from 'catalyze-ai';
import { PlanningOrchestrator } from 'catalyze-ai/dist/algorithms/planning-orchestrator';
import { NewPlanningOrchestrator } from 'catalyze-ai/dist/algorithms/new-planning-orchestrator';
// Use the shared service instances from src/services so seeded mock data is visible
import { studyPlanService, studySessionService, reviewItemService } from '../../services';
import { startOfDay, addDays } from 'date-fns';

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

    return tasks;
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

    return tasks;
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
    const normalizedDailyTasks = (result.dailyTasks || []).map((t: any) => ({
      ...t,
      date: t.date instanceof Date ? t.date : new Date(t.date),
    }));

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
  // Normalize dailyTasks dates to Date objects in case upstream serialized them
  const normalizedDailyTasks = (result.dailyTasks || []).map((t: any) => ({ ...t, date: t.date instanceof Date ? t.date : new Date(t.date) }));
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

    for (const review of upcomingReviews) {
      const reviewTask = new DailyTaskEntity({
        id: `review-${review.id}`,
        planId: review.planId,
        date: review.nextReviewDate,
        startUnit: review.unitNumber,
        endUnit: review.unitNumber,
        units: 1,
        estimatedDuration: 5 * 60 * 1000, // 5分
        round: 1,
        advice: '復習しましょう！',
      });
      tasks.push(reviewTask);
    }

    // 日付順でソートして返す
    return tasks.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

// シングルトンインスタンス
export const dailyTaskService = new DailyTaskService();
