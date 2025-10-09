/**
 * インフラストラクチャ層 - メモリ実装
 * 
 * StudyPlanRepositoryのインメモリ実装（テスト・開発用）
 */

import { StudyPlanRepository } from '../../domain/repositories/study-plan-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { PlanStatus } from '../../domain/types';

/**
 * メモリ内StudyPlanRepository実装
 * 
 * テストや開発環境用のシンプルな実装
 */
export class InMemoryStudyPlanRepository implements StudyPlanRepository {
  private plans: Map<string, StudyPlanEntity> = new Map();

  async create(plan: StudyPlanEntity): Promise<StudyPlanEntity> {
    this.plans.set(plan.id, plan);
    return plan;
  }

  async update(plan: StudyPlanEntity): Promise<void> {
    if (!this.plans.has(plan.id)) {
      throw new Error(`Plan with id ${plan.id} not found`);
    }
    this.plans.set(plan.id, plan);
  }

  async findById(planId: string): Promise<StudyPlanEntity | null> {
    return this.plans.get(planId) ?? null;
  }

  async findByUserId(userId: string): Promise<StudyPlanEntity[]> {
    return Array.from(this.plans.values()).filter((plan) => plan.userId === userId);
  }

  async findActiveByUserId(userId: string): Promise<StudyPlanEntity[]> {
    return Array.from(this.plans.values()).filter(
      (plan) => plan.userId === userId && plan.status === PlanStatus.ACTIVE
    );
  }

  async delete(planId: string): Promise<void> {
    this.plans.delete(planId);
  }

  /**
   * テスト用: 全データクリア
   */
  clear(): void {
    this.plans.clear();
  }

  /**
   * テスト用: 全データ取得
   */
  getAll(): StudyPlanEntity[] {
    return Array.from(this.plans.values());
  }
}
