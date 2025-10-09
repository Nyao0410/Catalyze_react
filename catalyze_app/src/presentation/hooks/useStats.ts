/**
 * StudyNext - Statistics Hooks
 * 統計データ取得用のReact Queryフック
 */

import { useQuery } from '@tanstack/react-query';
import { useStudyPlans } from './useStudyPlans';
import { useStudySessions } from './useStudySessions';
import { useReviewItems } from './useReviewItems';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { statisticsService } from '../../application/services';
import type {
  StudyTimeData,
  PlanBreakdown,
  StreakData,
  TimeOfDayStats,
  HeatmapDay,
} from '../../application/services/StatisticsService';

export interface DailyStats {
  date: string;
  sessions: number;
  totalUnits: number;
  totalMinutes: number;
  averageConcentration: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalSessions: number;
  totalUnits: number;
  totalMinutes: number;
  averageConcentration: number;
  dailyStats: DailyStats[];
}

export interface MonthlyStats {
  monthStart: string;
  monthEnd: string;
  totalSessions: number;
  totalUnits: number;
  totalMinutes: number;
  averageConcentration: number;
  weeklyStats: WeeklyStats[];
}

export interface OverallStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalSessions: number;
  totalStudyHours: number;
  totalReviewItems: number;
  dueReviewItems: number;
  averageConcentration: number;
  averageDifficulty: number;
}

/**
 * 全体統計を取得
 */
export const useOverallStats = (userId: string) => {
  const { data: plans } = useStudyPlans(userId);
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });
  const { data: reviewItems } = useQuery({
    queryKey: ['reviewItems', 'all', userId],
    queryFn: async () => {
      const { reviewItemService } = await import('../../services');
      return reviewItemService.getReviewItemsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'overall', userId],
    queryFn: (): OverallStats => {
      const activePlans = plans?.filter(p => p.status === 'active').length || 0;
      const completedPlans = plans?.filter(p => p.status === 'completed').length || 0;
      const totalSessions = allSessions?.length || 0;
      const totalStudyMinutes = allSessions?.reduce((sum, s) => sum + s.durationMinutes, 0) || 0;
      const totalReviewItems = reviewItems?.length || 0;
      const dueReviewItems = reviewItems?.filter(r => r.isDueToday).length || 0;
      
      const avgConcentration = totalSessions > 0
        ? allSessions!.reduce((sum, s) => sum + s.concentration, 0) / totalSessions
        : 0;
      
      const avgDifficulty = totalSessions > 0
        ? allSessions!.reduce((sum, s) => sum + s.difficulty, 0) / totalSessions
        : 0;

      return {
        totalPlans: plans?.length || 0,
        activePlans,
        completedPlans,
        totalSessions,
        totalStudyHours: Math.round(totalStudyMinutes / 60 * 10) / 10,
        totalReviewItems,
        dueReviewItems,
        averageConcentration: Math.round(avgConcentration * 10) / 10,
        averageDifficulty: Math.round(avgDifficulty * 10) / 10,
      };
    },
    enabled: !!plans && !!allSessions && !!reviewItems,
  });
};

/**
 * 週間統計を取得
 */
export const useWeeklyStats = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'weekly', userId],
    queryFn: (): WeeklyStats => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const weekSessions = allSessions?.filter(s => {
        const sessionDate = s.date;
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      }) || [];

      // 各日のデータを集計
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const dailyStats: DailyStats[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySessions = weekSessions.filter(s => format(s.date, 'yyyy-MM-dd') === dayStr);
        
        const totalUnits = daySessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
        const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const avgConcentration = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.concentration, 0) / daySessions.length
          : 0;

        return {
          date: dayStr,
          sessions: daySessions.length,
          totalUnits,
          totalMinutes,
          averageConcentration: Math.round(avgConcentration * 10) / 10,
        };
      });

      const totalSessions = weekSessions.length;
      const totalUnits = weekSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
      const totalMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const avgConcentration = totalSessions > 0
        ? weekSessions.reduce((sum, s) => sum + s.concentration, 0) / totalSessions
        : 0;

      return {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        totalSessions,
        totalUnits,
        totalMinutes,
        averageConcentration: Math.round(avgConcentration * 10) / 10,
        dailyStats,
      };
    },
    enabled: !!allSessions,
  });
};

/**
 * 月間統計を取得
 */
export const useMonthlyStats = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'monthly', userId],
    queryFn: (): MonthlyStats => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthSessions = allSessions?.filter(s => {
        const sessionDate = s.date;
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      }) || [];

      const totalSessions = monthSessions.length;
      const totalUnits = monthSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
      const totalMinutes = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const avgConcentration = totalSessions > 0
        ? monthSessions.reduce((sum, s) => sum + s.concentration, 0) / totalSessions
        : 0;

      return {
        monthStart: format(monthStart, 'yyyy-MM-dd'),
        monthEnd: format(monthEnd, 'yyyy-MM-dd'),
        totalSessions,
        totalUnits,
        totalMinutes,
        averageConcentration: Math.round(avgConcentration * 10) / 10,
        weeklyStats: [], // 週ごとの詳細は必要に応じて実装
      };
    },
    enabled: !!allSessions,
  });
};

/**
 * 週間学習時間データを取得
 */
export const useWeeklyStudyTime = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      const sessions = await studySessionService.getSessionsByUserId(userId);
      console.log('[useWeeklyStudyTime] fetched sessions:', sessions.length);
      return sessions;
    },
  });

  return useQuery({
    queryKey: ['stats', 'weeklyStudyTime', userId],
    queryFn: (): StudyTimeData[] => {
      if (!allSessions) return [];
      const result = statisticsService.getWeeklyStudyTime(allSessions);
      console.log('[useWeeklyStudyTime] computed data:', result);
      return result;
    },
    enabled: !!allSessions,
  });
};

/**
 * 月間学習時間データを取得
 */
export const useMonthlyStudyTime = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'monthlyStudyTime', userId],
    queryFn: (): StudyTimeData[] => {
      if (!allSessions) return [];
      return statisticsService.getMonthlyStudyTime(allSessions);
    },
    enabled: !!allSessions,
  });
};

/**
 * 週間学習項目内訳を取得
 */
export const useWeeklyPlanBreakdown = (userId: string) => {
  const { data: plans } = useStudyPlans(userId);
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'weeklyPlanBreakdown', userId],
    queryFn: (): PlanBreakdown[] => {
      if (!allSessions || !plans) return [];
      return statisticsService.getWeeklyPlanBreakdown(allSessions, plans);
    },
    enabled: !!allSessions && !!plans,
  });
};

/**
 * 月間学習項目内訳を取得
 */
export const useMonthlyPlanBreakdown = (userId: string) => {
  const { data: plans } = useStudyPlans(userId);
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'monthlyPlanBreakdown', userId],
    queryFn: (): PlanBreakdown[] => {
      if (!allSessions || !plans) return [];
      return statisticsService.getMonthlyPlanBreakdown(allSessions, plans);
    },
    enabled: !!allSessions && !!plans,
  });
};

/**
 * 学習ストリークを取得
 */
export const useStudyStreak = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'streak', userId],
    queryFn: (): StreakData => {
      if (!allSessions) return { currentStreak: 0, longestStreak: 0, totalStudyDays: 0 };
      return statisticsService.calculateStreak(allSessions);
    },
    enabled: !!allSessions,
  });
};

/**
 * 最適学習時間帯を取得
 */
export const useOptimalStudyTime = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'optimalTime', userId],
    queryFn: (): TimeOfDayStats[] => {
      if (!allSessions) return [];
      return statisticsService.getOptimalStudyTime(allSessions);
    },
    enabled: !!allSessions,
  });
};

/**
 * ヒートマップデータを取得
 */
export const useHeatmapData = (userId: string) => {
  const { data: allSessions } = useQuery({
    queryKey: ['sessions', 'all', userId],
    queryFn: async () => {
      const { studySessionService } = await import('../../services');
      return studySessionService.getSessionsByUserId(userId);
    },
  });

  return useQuery({
    queryKey: ['stats', 'heatmap', userId],
    queryFn: (): HeatmapDay[] => {
      if (!allSessions) return [];
      return statisticsService.getHeatmapData(allSessions);
    },
    enabled: !!allSessions,
  });
};
