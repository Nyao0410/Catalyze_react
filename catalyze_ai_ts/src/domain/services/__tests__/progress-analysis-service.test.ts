/// <reference types="jest" />
import { describe, test, expect } from '@jest/globals';
import { ProgressAnalysisService } from '../progress-analysis-service';
import { StudyPlanEntity } from '../../entities/study-plan-entity';
import { StudySessionEntity } from '../../entities/study-session-entity';
import { PlanDifficulty, PlanStatus } from '../../types';

describe('ProgressAnalysisService', () => {
  const service = new ProgressAnalysisService();

  test('calculateProgress should count unitsCompleted when no range provided', () => {
    const plan = new StudyPlanEntity({
      id: 'p1',
      userId: 'u1',
      title: 'Plan',
      totalUnits: 100,
      unit: '問',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      estimatedTimePerUnit: 1000,
      difficulty: PlanDifficulty.NORMAL,
      studyDays: [1],
      status: PlanStatus.ACTIVE,
    });

    const sessions = [
      new StudySessionEntity({
        id: 's1',
        userId: 'u1',
        planId: 'p1',
        date: new Date(),
        unitsCompleted: 5,
        durationMinutes: 30,
        concentration: 0.8,
        difficulty: 3,
      }),
      new StudySessionEntity({
        id: 's2',
        userId: 'u1',
        planId: 'p1',
        date: new Date(),
        unitsCompleted: 10,
        durationMinutes: 60,
        concentration: 0.9,
        difficulty: 2,
      }),
    ];

    const progress = service.calculateProgress(plan, sessions);
    expect(progress.completed).toBe(15);
    expect(progress.total).toBe(100);
  });

  test('calculateProgress should use startUnit/endUnit when provided', () => {
    const plan = new StudyPlanEntity({
      id: 'p2',
      userId: 'u2',
      title: 'Plan2',
      totalUnits: 50,
      unit: '問',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      estimatedTimePerUnit: 1000,
      difficulty: PlanDifficulty.NORMAL,
      studyDays: [1],
      status: PlanStatus.ACTIVE,
    });

    const sessions = [
      new StudySessionEntity({
        id: 's1',
        userId: 'u2',
        planId: 'p2',
        date: new Date(),
        unitsCompleted: 3,
        startUnit: 1,
        endUnit: 5,
        durationMinutes: 30,
        concentration: 0.8,
        difficulty: 3,
      }),
      new StudySessionEntity({
        id: 's2',
        userId: 'u2',
        planId: 'p2',
        date: new Date(),
        unitsCompleted: 2,
        startUnit: 10,
        endUnit: 12,
        durationMinutes: 60,
        concentration: 0.9,
        difficulty: 2,
      }),
    ];

    const progress = service.calculateProgress(plan, sessions);
    // ranges: (5-1+1)=5, (12-10+1)=3 => total 8
    expect(progress.completed).toBe(8);
    expect(progress.total).toBe(50);
  });

  test('StudySessionEntity should normalize unitsCompleted when range provided and validate consistency', () => {
    // create a session where unitsCompleted does NOT match the provided range
    const badSessionFactory = () =>
      new StudySessionEntity({
        id: 's3',
        userId: 'u2',
        planId: 'p2',
        date: new Date(),
        unitsCompleted: 1, // inconsistent with range length
        startUnit: 20,
        endUnit: 25, // range length = 6
        durationMinutes: 30,
        concentration: 0.8,
        difficulty: 3,
      });

    // constructor should normalize unitsCompleted to 6 and validation should pass
    const session = badSessionFactory();
    expect(session.unitsCompleted).toBe(6);
    expect(session.startUnit).toBe(20);
    expect(session.endUnit).toBe(25);
  });
});
