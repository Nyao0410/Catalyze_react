/**
 * StudyNext - Application Service for Study Plans
 * 学習計画のアプリケーションサービス
 */

import {
  StudyPlanEntity,
  InMemoryStudyPlanRepository,
  type StudyPlanRepository,
} from 'catalyze-ai';

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
    await this.repository.update(plan);
  }

  async deletePlan(planId: string): Promise<void> {
    await this.repository.delete(planId);
  }

  async pausePlan(planId: string): Promise<StudyPlanEntity> {
    const plan = await this.repository.findById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const pausedPlan = plan.pause();
    await this.repository.update(pausedPlan);
    return pausedPlan;
  }

  async resumePlan(planId: string): Promise<StudyPlanEntity> {
    const plan = await this.repository.findById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const resumedPlan = plan.resume();
    await this.repository.update(resumedPlan);
    return resumedPlan;
  }

  async completePlan(planId: string): Promise<StudyPlanEntity> {
    const plan = await this.repository.findById(planId);
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
