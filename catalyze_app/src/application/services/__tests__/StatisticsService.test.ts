/**
 * Statistics Service Tests
 * 統計サービスのテスト
 */

import { StatisticsService } from '../StatisticsService';
import { StudySessionEntity, StudyPlanEntity, PlanStatus, PlanDifficulty } from 'catalyze-ai';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockSessions: StudySessionEntity[];
  let mockPlans: StudyPlanEntity[];

  beforeEach(() => {
    service = new StatisticsService();

    // モックセッションデータ
    const now = new Date();
    mockSessions = [
      new StudySessionEntity({
        id: 'session-1',
        userId: 'user-001',
        planId: 'plan-1',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0), // 今日 10:00
        unitsCompleted: 10,
        durationMinutes: 60,
        concentration: 0.8,
        difficulty: 3,
        round: 1,
      }),
      new StudySessionEntity({
        id: 'session-2',
        userId: 'user-001',
        planId: 'plan-2',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0), // 昨日 14:00
        unitsCompleted: 15,
        durationMinutes: 90,
        concentration: 0.9,
        difficulty: 4,
        round: 1,
      }),
      new StudySessionEntity({
        id: 'session-3',
        userId: 'user-001',
        planId: 'plan-1',
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 18, 0), // 2日前 18:00
        unitsCompleted: 8,
        durationMinutes: 45,
        concentration: 0.7,
        difficulty: 2,
        round: 1,
      }),
    ];

    // モックプランデータ
    mockPlans = [
      new StudyPlanEntity({
        id: 'plan-1',
        userId: 'user-001',
        title: '数学問題集',
        totalUnits: 100,
        unit: '問',
        createdAt: new Date(),
        deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        rounds: 1,
        targetRounds: 2,
        estimatedTimePerUnit: 5 * 60 * 1000,
        difficulty: PlanDifficulty.NORMAL,
        studyDays: [1, 2, 3, 4, 5],
        status: PlanStatus.ACTIVE,
      }),
      new StudyPlanEntity({
        id: 'plan-2',
        userId: 'user-001',
        title: '英単語帳',
        totalUnits: 500,
        unit: '語',
        createdAt: new Date(),
        deadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        rounds: 1,
        targetRounds: 3,
        estimatedTimePerUnit: 2 * 60 * 1000,
        difficulty: PlanDifficulty.EASY,
        studyDays: [1, 2, 3, 4, 5, 6],
        status: PlanStatus.ACTIVE,
      }),
    ];
  });

  describe('getWeeklyStudyTime', () => {
    it('should return 7 days of data', () => {
      const result = service.getWeeklyStudyTime(mockSessions);
      expect(result).toHaveLength(7);
    });

    it('should have correct labels', () => {
      const result = service.getWeeklyStudyTime(mockSessions);
      const labels = result.map(d => d.label);
      expect(labels).toEqual(['日', '月', '火', '水', '木', '金', '土']);
    });

    it('should calculate total minutes correctly', () => {
      const result = service.getWeeklyStudyTime(mockSessions);
      const totalMinutes = result.reduce((sum, d) => sum + d.minutes, 0);
      expect(totalMinutes).toBeGreaterThan(0);
    });
  });

  describe('calculateStreak', () => {
    it('should calculate current streak correctly', () => {
      const result = service.calculateStreak(mockSessions);
      expect(result.currentStreak).toBeGreaterThanOrEqual(0);
      expect(result.longestStreak).toBeGreaterThanOrEqual(result.currentStreak);
    });

    it('should count total study days', () => {
      const result = service.calculateStreak(mockSessions);
      expect(result.totalStudyDays).toBe(3); // 3つのセッションが異なる日
    });

    it('should handle empty sessions', () => {
      const result = service.calculateStreak([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.totalStudyDays).toBe(0);
    });
  });

  describe('getOptimalStudyTime', () => {
    it('should return 24 hours of data', () => {
      const result = service.getOptimalStudyTime(mockSessions);
      expect(result).toHaveLength(24);
    });

    it('should have correct hour range', () => {
      const result = service.getOptimalStudyTime(mockSessions);
      result.forEach((stat, index) => {
        expect(stat.hour).toBe(index);
      });
    });

    it('should calculate total minutes correctly', () => {
      const result = service.getOptimalStudyTime(mockSessions);
      const totalMinutes = result.reduce((sum, d) => sum + d.totalMinutes, 0);
      expect(totalMinutes).toBe(195); // 60 + 90 + 45
    });
  });

  describe('getWeeklyPlanBreakdown', () => {
    it('should group sessions by plan', () => {
      const result = service.getWeeklyPlanBreakdown(mockSessions, mockPlans);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate percentages correctly', () => {
      const result = service.getWeeklyPlanBreakdown(mockSessions, mockPlans);
      const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should assign colors to plans', () => {
      const result = service.getWeeklyPlanBreakdown(mockSessions, mockPlans);
      result.forEach(item => {
        expect(item.color).toBeTruthy();
        expect(item.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('getHeatmapData', () => {
    it('should return approximately 365 days of data', () => {
      const result = service.getHeatmapData(mockSessions);
      expect(result.length).toBeGreaterThan(360);
      expect(result.length).toBeLessThanOrEqual(366);
    });

    it('should have level between 0-4', () => {
      const result = service.getHeatmapData(mockSessions);
      result.forEach(day => {
        expect(day.level).toBeGreaterThanOrEqual(0);
        expect(day.level).toBeLessThanOrEqual(4);
      });
    });

    it('should have valid date strings', () => {
      const result = service.getHeatmapData(mockSessions);
      result.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});
