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

  async getAllPlans(userId: string): Promise<StudyPlanEntity[]> {
    return await this.repository.findByUserId(userId);
  }

  async getActivePlans(userId: string): Promise<StudyPlanEntity[]> {
    return await this.repository.findActiveByUserId(userId);
  }

  async getPlanById(planId: string): Promise<StudyPlanEntity | null> {
    return await this.repository.findById(planId);
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
