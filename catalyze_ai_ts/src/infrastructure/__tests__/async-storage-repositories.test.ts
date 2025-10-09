/**
 * Basic CRUD tests for AsyncStorage-backed repositories
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageStudyPlanRepository } from '../repositories/async-storage-study-plan-repository';
import { AsyncStorageStudySessionRepository } from '../repositories/async-storage-study-session-repository';
import { AsyncStorageReviewItemRepository } from '../repositories/async-storage-review-item-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';

// jest mock for AsyncStorage (use the package's provided mock if available)
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('AsyncStorage repositories', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('StudyPlan: create/find/update/delete', async () => {
    const repo = new AsyncStorageStudyPlanRepository();
    const plan: StudyPlanEntity = {
      id: 'plan-1',
      userId: 'user-1',
      title: 'Test Plan',
      totalUnits: 10,
      unit: 'q',
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
      rounds: 1,
      targetRounds: 1,
      estimatedTimePerUnit: 60 * 1000,
      difficulty: 3,
      studyDays: [1,2,3,4,5],
      status: 0,
    } as unknown as StudyPlanEntity;

    await repo.create(plan);
    const found = await repo.findById('plan-1');
    expect(found).not.toBeNull();

  const updatedPlan = { ...plan, title: 'Updated', updatedAt: new Date() } as unknown as StudyPlanEntity;
  await repo.update(updatedPlan);
    const updated = await repo.findById('plan-1');
    expect(updated?.title).toBe('Updated');

    await repo.delete('plan-1');
    const afterDelete = await repo.findById('plan-1');
    expect(afterDelete).toBeNull();
  });

  test('StudySession: create/find/delete', async () => {
    const repo = new AsyncStorageStudySessionRepository();
    const session: StudySessionEntity = {
      id: 's-1',
      userId: 'user-1',
      planId: 'plan-1',
      date: new Date(),
      unitsCompleted: 5,
      durationMinutes: 30,
      concentration: 0.8,
      difficulty: 3,
      round: 1,
    } as unknown as StudySessionEntity;

    await repo.create(session);
    const found = await repo.findById('s-1');
    expect(found).not.toBeNull();

    await repo.delete('s-1');
    const afterDelete = await repo.findById('s-1');
    expect(afterDelete).toBeNull();
  });

  test('ReviewItem: create/findDueToday/delete', async () => {
    const repo = new AsyncStorageReviewItemRepository();
    const item: ReviewItemEntity = {
      id: 'r-1',
      userId: 'user-1',
      planId: 'plan-1',
      unitNumber: 1,
      lastReviewDate: new Date(),
      nextReviewDate: new Date(),
      easeFactor: 2.5,
      repetitions: 1,
      intervalDays: 1,
    } as unknown as ReviewItemEntity;

    await repo.create(item);
    const due = await repo.findDueToday('user-1');
    expect(due.length).toBeGreaterThanOrEqual(1);

    await repo.delete('r-1');
    const afterDelete = await repo.findById('r-1');
    expect(afterDelete).toBeNull();
  });
});
