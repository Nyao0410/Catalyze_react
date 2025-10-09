/**
 * StudyNext - Mock Data
 * 開発・テスト用のモックデータ
 */

import {
  StudyPlanEntity,
  StudySessionEntity,
  ReviewItemEntity,
  PlanDifficulty,
  PlanStatus,
} from 'catalyze-ai';

/**
 * モックの学習計画を作成
 */
export const createMockPlans = (userId: string): StudyPlanEntity[] => {
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  return [
    new StudyPlanEntity({
      id: 'plan-001',
      userId,
      title: '数学の問題集',
      totalUnits: 100,
      unit: '問',
      unitRange: { start: 1, end: 100 },
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      deadline: oneMonthLater,
      rounds: 1,
      targetRounds: 2,
      estimatedTimePerUnit: 5 * 60 * 1000,
      difficulty: PlanDifficulty.NORMAL,
      studyDays: [1, 2, 3, 4, 5],
      status: PlanStatus.ACTIVE,
  } as any),
    new StudyPlanEntity({
      id: 'plan-002',
      userId,
      title: '英単語暗記',
      totalUnits: 500,
      unit: '語',
      unitRange: { start: 1, end: 500 },
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      deadline: twoMonthsLater,
      rounds: 1,
      targetRounds: 3,
      estimatedTimePerUnit: 2 * 60 * 1000,
      difficulty: PlanDifficulty.EASY,
      studyDays: [1, 2, 3, 4, 5, 6, 7],
      status: PlanStatus.ACTIVE,
  } as any),
    new StudyPlanEntity({
      id: 'plan-003',
      userId,
      title: '物理の教科書',
      totalUnits: 50,
      unit: 'ページ',
      unitRange: { start: 1, end: 50 },
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 期限切れ
      rounds: 2,
      targetRounds: 2,
      estimatedTimePerUnit: 20 * 60 * 1000,
      difficulty: PlanDifficulty.HARD,
      studyDays: [1, 3, 5],
      status: PlanStatus.COMPLETED,
  } as any),
    new StudyPlanEntity({
      id: 'plan-004',
      userId,
      title: 'プログラミング練習問題',
      totalUnits: 200,
      unit: '問',
      unitRange: { start: 1, end: 200 },
      createdAt: now,
      deadline: threeMonthsLater,
      rounds: 1,
      targetRounds: 2,
      estimatedTimePerUnit: 15 * 60 * 1000,
      difficulty: PlanDifficulty.HARD,
      studyDays: [1, 2, 3, 4, 5],
      status: PlanStatus.ACTIVE,
  } as any),
    new StudyPlanEntity({
      id: 'plan-005',
      userId,
      title: '歴史の教科書',
      totalUnits: 30,
      unit: '章',
      unitRange: { start: 1, end: 30 },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      rounds: 1,
      targetRounds: 1,
      estimatedTimePerUnit: 30 * 60 * 1000,
      difficulty: PlanDifficulty.NORMAL,
      studyDays: [2, 4, 6],
      status: PlanStatus.PAUSED,
  } as any),
  ];
};

/**
 * モックの学習セッションを作成
 */
export const createMockSessions = (
  userId: string,
  planId: string,
  count: number = 5,
  totalUnits: number = 100,
  effectiveRounds: number = 1
): StudySessionEntity[] => {
  const sessions: StudySessionEntity[] = [];
  const now = new Date();

  // Prepare per-round trackers so we don't exceed totalUnits per round
  const rounds = Math.max(1, Math.floor(effectiveRounds));
  const remainingUnitsPerRound: number[] = new Array(rounds).fill(totalUnits);
  const nextStartPerRound: number[] = new Array(rounds).fill(1);

  // Roughly distribute sessions across rounds
  const sessionsPerRound = Math.ceil(count / rounds);

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Determine which round this session belongs to
    let roundIndex = Math.min(rounds - 1, Math.floor(i / sessionsPerRound));

    // If the assigned round is exhausted, try to find another round with remaining units
    if (remainingUnitsPerRound[roundIndex] <= 0) {
      const found = remainingUnitsPerRound.findIndex((v) => v > 0);
      if (found !== -1) roundIndex = found;
    }

    // Decide unitsCompleted for this session within the round
    const remainingInRound = remainingUnitsPerRound[roundIndex];
    let unitsCompleted = 0;
    if (remainingInRound > 0) {
      const avgPerSession = Math.max(1, Math.floor(totalUnits / Math.max(1, sessionsPerRound)));
      const upper = Math.min(remainingInRound, avgPerSession * 2);
      unitsCompleted = Math.floor(Math.random() * upper) + 1;
      unitsCompleted = Math.min(unitsCompleted, remainingInRound);
    } else {
      // round exhausted; create a small maintenance session (1 unit) and set start/end to 1
      unitsCompleted = 1;
    }

    // Determine start/end units sequentially within the round
    const startUnit = Math.min(totalUnits, nextStartPerRound[roundIndex]);
    const endUnit = Math.min(totalUnits, startUnit + unitsCompleted - 1);

    // Adjust unitsCompleted in case endUnit hit the boundary
    unitsCompleted = Math.max(1, endUnit - startUnit + 1);

    // update trackers
    remainingUnitsPerRound[roundIndex] = Math.max(0, remainingUnitsPerRound[roundIndex] - unitsCompleted);
    nextStartPerRound[roundIndex] = Math.min(totalUnits, endUnit + 1);

    sessions.push(
      new StudySessionEntity({
        id: `session-${planId}-${i}`,
        userId,
        planId,
        date,
        unitsCompleted,
        startUnit,
        endUnit,
        durationMinutes: Math.floor(Math.random() * 60) + 30,
        concentration: 0.6 + Math.random() * 0.4,
        difficulty: Math.floor(Math.random() * 3) + 2,
        round: roundIndex + 1,
      })
    );
  }

  return sessions;
};

/**
 * モックの復習項目を作成
 */
export const createMockReviewItems = (
  userId: string,
  planId: string,
  count: number = 10
): ReviewItemEntity[] => {
  const items: ReviewItemEntity[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const lastReview = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    const nextReview = new Date(
      now.getTime() + (Math.floor(Math.random() * 7) - 2) * 24 * 60 * 60 * 1000
    );

    items.push(
      new ReviewItemEntity({
        id: `review-${planId}-${i}`,
        userId,
        planId,
        unitNumber: i + 1,
        lastReviewDate: lastReview,
        nextReviewDate: nextReview,
        easeFactor: 2.5 + (Math.random() - 0.5) * 0.5,
        repetitions: Math.floor(Math.random() * 5),
        intervalDays: Math.floor(Math.random() * 14) + 1,
      })
    );
  }

  return items;
};

/**
 * すべてのリポジトリにモックデータを投入
 */
export const seedMockData = async (
  userId: string,
  planRepository: any,
  sessionRepository: any,
  reviewRepository: any
) => {
  // 学習計画を作成
  const plans = createMockPlans(userId);
  for (const plan of plans) {
    await planRepository.create(plan);

    // 各計画にセッションを作成（グラフ表示用に過去30日分）
    const sessions = createMockSessions(userId, plan.id, 30, plan.totalUnits, plan.effectiveRounds);
    for (const session of sessions) {
      await sessionRepository.create(session);
    }

    // 各計画に復習項目を作成
    const reviews = createMockReviewItems(userId, plan.id, 10);
    for (const review of reviews) {
      await reviewRepository.create(review);
    }
  }

  console.log(`✅ Mock data seeded for user: ${userId}`);
  console.log(`   - ${plans.length} plans`);
  console.log(`   - ${plans.length * 5} sessions`);
  console.log(`   - ${plans.length * 10} review items`);
};

/**
 * ソーシャル機能用のモックデータ
 */
import type { Friend, CooperationGoal, UserPoints } from '../types/social';

export const createMockFriends = (userId: string): Friend[] => {
  return [
    {
      id: 'friend-001',
      userId: 'user-002',
      name: '田中太郎',
      avatar: '👨',
      level: 5,
      points: 450,
      status: 'online',
      addedAt: new Date('2025-01-01'),
    },
    {
      id: 'friend-002',
      userId: 'user-003',
      name: '佐藤花子',
      avatar: '👩',
      level: 8,
      points: 780,
      status: 'online',
      addedAt: new Date('2025-01-15'),
    },
    {
      id: 'friend-003',
      userId: 'user-004',
      name: '鈴木一郎',
      avatar: '🧑',
      level: 3,
      points: 280,
      status: 'offline',
      addedAt: new Date('2025-02-01'),
    },
    {
      id: 'friend-004',
      userId: 'user-005',
      name: '高橋美咲',
      avatar: '👧',
      level: 10,
      points: 1050,
      status: 'online',
      addedAt: new Date('2025-02-20'),
    },
  ];
};

export const createMockCooperationGoals = (userId: string): CooperationGoal[] => {
  const now = new Date();
  return [
    {
      id: 'goal-001',
      title: 'みんなで100時間勉強チャレンジ',
      description: 'チーム全員で合計100時間の勉強を目指そう!',
      creatorId: userId,
      participantIds: [userId, 'user-002', 'user-003'],
      currentProgress: 67,
      targetProgress: 100,
      deadline: new Date('2025-10-15'),
      createdAt: new Date('2025-09-15'),
      status: 'active',
    },
    {
      id: 'goal-002',
      title: '資格試験合格プロジェクト',
      description: 'それぞれの目標資格に向けて頑張ろう!',
      creatorId: 'user-002',
      participantIds: [userId, 'user-002', 'user-004'],
      currentProgress: 45,
      targetProgress: 100,
      deadline: new Date('2025-11-30'),
      createdAt: new Date('2025-09-01'),
      status: 'active',
    },
  ];
};

export const createMockUserPoints = (userId: string): UserPoints => {
  return {
    userId,
    points: 650,
    level: 7,
    weeklyPoints: 120,
    lastUpdated: new Date(),
  };
};
