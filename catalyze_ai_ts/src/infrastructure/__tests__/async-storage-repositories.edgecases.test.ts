import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageStudyPlanRepository } from '../repositories/async-storage-study-plan-repository';
import { AsyncStorageStudySessionRepository } from '../repositories/async-storage-study-session-repository';
import { AsyncStorageReviewItemRepository } from '../repositories/async-storage-review-item-repository';
import { StudyPlanEntity } from '../../domain/entities/study-plan-entity';
import { StudySessionEntity } from '../../domain/entities/study-session-entity';
import { ReviewItemEntity } from '../../domain/entities/review-item-entity';
import { PlanStatus } from '../../domain/types';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

describe('AsyncStorage repositories - edge cases', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('persistence across repository instances', async () => {
    const repo1 = new AsyncStorageStudyPlanRepository();
    const plan: StudyPlanEntity = {
      id: 'persist-1',
      userId: 'u1',
      title: 'Persist Plan',
      totalUnits: 5,
      unit: 'q',
      createdAt: new Date(),
      updatedAt: new Date(),
      rounds: 1,
      targetRounds: 1,
      estimatedTimePerUnit: 60000,
      difficulty: 1,
      studyDays: [1,2,3],
      status: PlanStatus.ACTIVE,
    } as unknown as StudyPlanEntity;

    await repo1.create(plan);

    // new instance should read the same stored data
    const repo2 = new AsyncStorageStudyPlanRepository();
    const found = await repo2.findById('persist-1');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('persist-1');
  });

  test('update non-existent throws', async () => {
    const repo = new AsyncStorageStudyPlanRepository();
    const plan: StudyPlanEntity = {
      id: 'nope',
      userId: 'u1',
      title: 'Nope',
      totalUnits: 1,
      unit: 'q',
      createdAt: new Date(),
      updatedAt: new Date(),
      rounds: 1,
      targetRounds: 1,
      estimatedTimePerUnit: 60000,
      difficulty: 1,
      studyDays: [1],
      status: PlanStatus.ACTIVE,
    } as unknown as StudyPlanEntity;

    await expect(repo.update(plan)).rejects.toThrow();
  });

  test('deleteByPlanId removes all related review items', async () => {
    const repo = new AsyncStorageReviewItemRepository();
    const item1: ReviewItemEntity = { id: 'r-a', userId: 'u', planId: 'p1', unitNumber: 1, lastReviewDate: new Date(), nextReviewDate: new Date(), easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity;
    const item2: ReviewItemEntity = { id: 'r-b', userId: 'u', planId: 'p1', unitNumber: 2, lastReviewDate: new Date(), nextReviewDate: new Date(), easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity;
    const item3: ReviewItemEntity = { id: 'r-c', userId: 'u', planId: 'p2', unitNumber: 3, lastReviewDate: new Date(), nextReviewDate: new Date(), easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity;

    await repo.create(item1);
    await repo.create(item2);
    await repo.create(item3);

    await repo.deleteByPlanId('p1');

    const remaining = await repo.findByPlanId('p2');
    expect(remaining.length).toBe(1);
    const removed = await repo.findByPlanId('p1');
    expect(removed.length).toBe(0);
  });

  test('study sessions: findByUserIdAndDateRange returns correct sessions', async () => {
    const repo = new AsyncStorageStudySessionRepository();
    const now = new Date();
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const s1: StudySessionEntity = { id: 's1', userId: 'u1', planId: 'p', date: d1, unitsCompleted: 1, durationMinutes: 10, concentration: 0.5, difficulty: 2, round: 1 } as unknown as StudySessionEntity;
    const s2: StudySessionEntity = { id: 's2', userId: 'u1', planId: 'p', date: d2, unitsCompleted: 2, durationMinutes: 20, concentration: 0.8, difficulty: 3, round: 1 } as unknown as StudySessionEntity;
    await repo.create(s1);
    await repo.create(s2);

    const results = await repo.findByUserIdAndDateRange('u1', new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4), new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    expect(results.length).toBe(2);
  });

  test('review items: findByUserIdAndDateRange respects range', async () => {
    const repo = new AsyncStorageReviewItemRepository();
    const now = new Date();
    const next1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const next2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const r1: ReviewItemEntity = { id: 'r1', userId: 'ur', planId: 'p', unitNumber: 1, lastReviewDate: new Date(), nextReviewDate: next1, easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity;
    const r2: ReviewItemEntity = { id: 'r2', userId: 'ur', planId: 'p', unitNumber: 2, lastReviewDate: new Date(), nextReviewDate: next2, easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity;
    await repo.create(r1);
    await repo.create(r2);

    const found = await repo.findByUserIdAndDateRange('ur', new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('r1');
  });

  test('clear removes all data', async () => {
    const planRepo = new AsyncStorageStudyPlanRepository();
    const sessionRepo = new AsyncStorageStudySessionRepository();
    const reviewRepo = new AsyncStorageReviewItemRepository();

    await planRepo.create({ id: 'p1', userId: 'u', title: 't', totalUnits: 1, unit: 'u', createdAt: new Date(), updatedAt: new Date(), rounds: 1, targetRounds: 1, estimatedTimePerUnit: 1000, difficulty: 1, studyDays: [1], status: PlanStatus.ACTIVE } as unknown as StudyPlanEntity);
    await sessionRepo.create({ id: 'ss1', userId: 'u', planId: 'p1', date: new Date(), unitsCompleted: 1, durationMinutes: 1, concentration: 1, difficulty: 1, round: 1 } as unknown as StudySessionEntity);
    await reviewRepo.create({ id: 'rr1', userId: 'u', planId: 'p1', unitNumber: 1, lastReviewDate: new Date(), nextReviewDate: new Date(), easeFactor: 2.5, repetitions: 1, intervalDays: 1 } as unknown as ReviewItemEntity);

    await planRepo.clear();
    await sessionRepo.clear();
    await reviewRepo.clear();

    const p = await planRepo.findById('p1');
    const s = await sessionRepo.findById('ss1');
    const r = await reviewRepo.findById('rr1');

    expect(p).toBeNull();
    expect(s).toBeNull();
    expect(r).toBeNull();
  });
});
