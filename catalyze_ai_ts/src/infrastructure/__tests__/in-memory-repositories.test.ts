/**
 * インメモリリポジトリのテスト
 */

import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { InMemoryStudyPlanRepository } from '../repositories/in-memory-study-plan-repository';
import { PlanDifficulty, PlanStatus } from '../../domain/types';

describe('InMemoryStudyPlanRepository', () => {
  let repository: InMemoryStudyPlanRepository;

  beforeEach(() => {
    repository = new InMemoryStudyPlanRepository();
  });

  describe('create', () => {
    it('should create and store a study plan', async () => {
      const plan = new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-1',
        title: 'Test Plan',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      const result = await repository.create(plan);
      expect(result).toEqual(plan);

      const found = await repository.findById('plan-1');
      expect(found).toEqual(plan);
    });
  });

  describe('update', () => {
    it('should update an existing plan', async () => {
      const plan = new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-1',
        title: 'Test Plan',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      await repository.create(plan);

      const updatedPlan = plan.completeToday();
      await repository.update(updatedPlan);

      const found = await repository.findById('plan-1');
      expect(found?.status).toBe(PlanStatus.COMPLETED_TODAY);
    });

    it('should throw error if plan not found', async () => {
      const plan = new StudyPlanEntity({
        id: 'non-existent',
        userId: 'user-1',
        title: 'Test Plan',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      await expect(repository.update(plan)).rejects.toThrow();
    });
  });

  describe('findByUserId', () => {
    it('should find all plans for a user', async () => {
      const plan1 = new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-1',
        title: 'Plan 1',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      const plan2 = new StudyPlanEntity({
        id: 'plan-2',
        userId: 'user-1',
        title: 'Plan 2',
        totalUnits: 50,
        unit: 'ページ',
        createdAt: new Date('2024-02-01'),
        deadline: new Date('2024-04-30'),
        rounds: 1,
        targetRounds: 2,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.EASY,
        studyDays: [1, 3, 5],
        status: PlanStatus.PAUSED,
      });

      const plan3 = new StudyPlanEntity({
        id: 'plan-3',
        userId: 'user-2',
        title: 'Plan 3',
        totalUnits: 75,
        unit: 'ページ',
        createdAt: new Date('2024-01-15'),
        deadline: new Date('2024-05-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.HARD,
        studyDays: [1, 2, 3, 4, 5, 6],
        status: PlanStatus.ACTIVE,
      });

      await repository.create(plan1);
      await repository.create(plan2);
      await repository.create(plan3);

      const userPlans = await repository.findByUserId('user-1');
      expect(userPlans).toHaveLength(2);
      expect(userPlans.map((p) => p.id)).toContain('plan-1');
      expect(userPlans.map((p) => p.id)).toContain('plan-2');
    });
  });

  describe('findActiveByUserId', () => {
    it('should find only active plans for a user', async () => {
      const plan1 = new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-1',
        title: 'Active Plan',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      const plan2 = new StudyPlanEntity({
        id: 'plan-2',
        userId: 'user-1',
        title: 'Paused Plan',
        totalUnits: 50,
        unit: 'ページ',
        createdAt: new Date('2024-02-01'),
        deadline: new Date('2024-04-30'),
        rounds: 1,
        targetRounds: 2,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.EASY,
        studyDays: [1, 3, 5],
        status: PlanStatus.PAUSED,
      });

      await repository.create(plan1);
      await repository.create(plan2);

      const activePlans = await repository.findActiveByUserId('user-1');
      expect(activePlans).toHaveLength(1);
      expect(activePlans[0].id).toBe('plan-1');
    });
  });

  describe('delete', () => {
    it('should delete a plan', async () => {
      const plan = new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-1',
        title: 'Test Plan',
        totalUnits: 100,
        unit: 'ページ',
        createdAt: new Date('2024-01-01'),
        deadline: new Date('2024-03-31'),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 180000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      });

      await repository.create(plan);
      expect(await repository.findById('plan-1')).toBeTruthy();

      await repository.delete('plan-1');
      expect(await repository.findById('plan-1')).toBeNull();
    });
  });
});
