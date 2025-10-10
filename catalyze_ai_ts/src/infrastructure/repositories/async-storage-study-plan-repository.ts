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
    return parsed.map((p) =>
      new StudyPlanEntity({
        id: p.id,
        userId: p.userId,
        title: p.title,
        totalUnits: p.totalUnits,
        unit: p.unit,
        unitRange: p.unitRange,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        deadline: p.deadline ? new Date(p.deadline) : new Date(),
        rounds: p.rounds,
        targetRounds: p.targetRounds,
        estimatedTimePerUnit: p.estimatedTimePerUnit ?? 0,
        difficulty: p.difficulty,
        studyDays: p.studyDays,
        status: p.status,
        dailyQuota: p.dailyQuota,
        dynamicDeadline: p.dynamicDeadline ? new Date(p.dynamicDeadline) : undefined,
      })
    );
  }

  private async _saveAll(plans: StudyPlanEntity[]): Promise<void> {
    // Minimal persistence log to help debug save behavior. Keep concise for easy filtering.
    try {
      // eslint-disable-next-line no-console
      console.debug(`[PERSIST/PLAN] saving ${plans.length} plans, firstId=${plans.length > 0 ? plans[0].id : 'none'}`);
    } catch (e) {
      // ignore logging errors
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }

  async create(plan: StudyPlanEntity): Promise<StudyPlanEntity> {
    const plans = await this._loadAll();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx === -1) {
      plans.push(plan);
    } else {
      plans[idx] = plan; // upsert: replace existing
    }
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
