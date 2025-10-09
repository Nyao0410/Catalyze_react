/**
 * AsyncStorage-backed StudyPlanRepository
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { PlanStatus } from '../../domain/types';

const STORAGE_KEY = '@catalyze:studyPlans';

export class AsyncStorageStudyPlanRepository implements StudyPlanRepository {
  private async _loadAll(): Promise<StudyPlanEntity[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as any[];
    return parsed.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      deadline: p.deadline ? new Date(p.deadline) : undefined,
    })) as StudyPlanEntity[];
  }

  private async _saveAll(plans: StudyPlanEntity[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }

  async create(plan: StudyPlanEntity): Promise<StudyPlanEntity> {
    const plans = await this._loadAll();
    plans.push(plan);
    await this._saveAll(plans);
    return plan;
  }

  async update(plan: StudyPlanEntity): Promise<void> {
    const plans = await this._loadAll();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx === -1) throw new Error(`Plan with id ${plan.id} not found`);
    plans[idx] = plan;
    await this._saveAll(plans);
  }

  async findById(planId: string): Promise<StudyPlanEntity | null> {
    const plans = await this._loadAll();
    return plans.find((p) => p.id === planId) ?? null;
  }

  async findByUserId(userId: string): Promise<StudyPlanEntity[]> {
    const plans = await this._loadAll();
    return plans.filter((p) => p.userId === userId);
  }

  async findActiveByUserId(userId: string): Promise<StudyPlanEntity[]> {
    const plans = await this._loadAll();
    return plans.filter((p) => p.userId === userId && p.status === PlanStatus.ACTIVE);
  }

  async delete(planId: string): Promise<void> {
    const plans = await this._loadAll();
    const updated = plans.filter((p) => p.id !== planId);
    await this._saveAll(updated);
  }

  // test helper
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
