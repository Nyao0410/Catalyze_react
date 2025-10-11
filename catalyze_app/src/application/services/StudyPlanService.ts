/**
 * StudyNext - Application Service for Study Plans
 * 学習計画のアプリケーションサービス
 */

import {
  StudyPlanEntity,
  InMemoryStudyPlanRepository,
  type StudyPlanRepository,
} from 'catalyze-ai';
import { studySessionService } from './StudySessionService';

export class StudyPlanService {
  private repository: StudyPlanRepository;

  constructor(repository?: StudyPlanRepository) {
    this.repository = repository || new InMemoryStudyPlanRepository();
  }

  // Helper to ensure returned object is a StudyPlanEntity instance
  private ensureEntity(obj: any): StudyPlanEntity | null {
    if (!obj) return null;
    if (typeof obj.isOverdue === 'function') return obj as StudyPlanEntity;
    try {
      return new StudyPlanEntity({
        id: obj.id,
        userId: obj.userId,
        title: obj.title,
        totalUnits: obj.totalUnits,
        unit: obj.unit,
        unitRange: obj.unitRange,
        createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date(),
        deadline: obj.deadline ? new Date(obj.deadline) : new Date(),
        rounds: obj.rounds,
        targetRounds: obj.targetRounds,
        estimatedTimePerUnit: obj.estimatedTimePerUnit ?? 0,
        difficulty: obj.difficulty,
        studyDays: obj.studyDays,
        status: obj.status,
        dailyQuota: obj.dailyQuota,
        dynamicDeadline: obj.dynamicDeadline ? new Date(obj.dynamicDeadline) : undefined,
      });
    } catch (e) {
      // If conversion fails, rethrow to make the issue visible upstream
      throw e;
    }
  }

  async getAllPlans(userId: string): Promise<StudyPlanEntity[]> {
    const res = await this.repository.findByUserId(userId);
    return res.map((p: any) => this.ensureEntity(p) as StudyPlanEntity);
  }

  async getActivePlans(userId: string): Promise<StudyPlanEntity[]> {
    const res = await this.repository.findActiveByUserId(userId);
    return res.map((p: any) => this.ensureEntity(p) as StudyPlanEntity);
  }

  async getPlanById(planId: string): Promise<StudyPlanEntity | null> {
    const res = await this.repository.findById(planId);
    return this.ensureEntity(res);
  }

  async createPlan(plan: StudyPlanEntity): Promise<StudyPlanEntity> {
    return await this.repository.create(plan);
  }

  async updatePlan(plan: StudyPlanEntity): Promise<void> {
    try {
      // eslint-disable-next-line no-console
      console.debug(`[SERVICE/PLAN] update id=${plan.id}`);
    } catch (e) {}
    await this.repository.update(plan);
  }

  async deletePlan(planId: string): Promise<void> {
    // まず、そのプランに紐づく学習セッションをすべて削除する
    try {
      const sessions = await studySessionService.getSessionsByPlanId(planId);
      for (const s of sessions) {
        try {
          await studySessionService.deleteSession(s.id);
        } catch (e) {
          // 個々のセッション削除に失敗した場合はログ出力して処理を中断する
          // 呼び出し元でエラーハンドリングするため再スローする
          // eslint-disable-next-line no-console
          console.error(`[SERVICE/PLAN] failed to delete session id=${s.id} for plan=${planId}`, e);
          throw e;
        }
      }
    } catch (e) {
      // セッション取得/削除に失敗した場合はここで例外を伝播させる
      throw e;
    }

    await this.repository.delete(planId);
  }

  async pausePlan(planId: string): Promise<StudyPlanEntity> {
    const raw = await this.repository.findById(planId);
    const plan = this.ensureEntity(raw);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const pausedPlan = plan.pause();
    await this.repository.update(pausedPlan);
    return pausedPlan;
  }

  async resumePlan(planId: string): Promise<StudyPlanEntity> {
    const raw = await this.repository.findById(planId);
    try {
      // debug info to help trace issues where repository returns plain objects
      // eslint-disable-next-line no-console
      console.debug('[SERVICE/PLAN] resumePlan raw:', raw);
    } catch (e) {}
    const plan = this.ensureEntity(raw);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    try {
      // debug whether resume exists
      // eslint-disable-next-line no-console
      console.debug('[SERVICE/PLAN] plan.resume typeof:', typeof (plan as any).resume);
    } catch (e) {}
    const resumedPlan = (plan as any).resume ? plan.resume() : (() => { throw new TypeError('plan.resume is not a function'); })();
    await this.repository.update(resumedPlan);
    return resumedPlan;
  }

  async completePlan(planId: string): Promise<StudyPlanEntity> {
    const raw = await this.repository.findById(planId);
    const plan = this.ensureEntity(raw);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const completedPlan = plan.complete();
    await this.repository.update(completedPlan);
    return completedPlan;
  }
}

// シングルトンインスタンス
export const studyPlanService = new StudyPlanService();
