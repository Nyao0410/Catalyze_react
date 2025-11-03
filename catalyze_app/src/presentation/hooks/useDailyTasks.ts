/**
 * StudyNext - useDailyTasks Hook
 * 今日のタスク取得用カスタムフック
 */

import { useQuery } from '@tanstack/react-query';
import { dailyTaskService } from '../../application/services';
import type { DailyTaskEntity } from 'catalyze-ai';
import { startOfDay, format } from 'date-fns';

/**
 * 今日のタスクを取得するフック
 */
export const useDailyTasks = (userId: string, date?: Date) => {
  // dateがundefinedの場合は今日の日付を使用し、毎回同じ値を返すように固定
  const today = startOfDay(new Date());
  const keyDateStr = format(startOfDay(date || today), 'yyyy-MM-dd');
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['dailyTasks', userId, keyDateStr],
    queryFn: () => dailyTaskService.getTodayTasks(userId, date),
    enabled: !!userId && userId !== '', // userIdが空文字列の場合はクエリを無効化
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 特定の計画の今日のタスクを取得するフック
 */
export const useDailyTasksByPlan = (planId: string, date?: Date) => {
  const keyDateStr = format(startOfDay(date || new Date()), 'yyyy-MM-dd');
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['dailyTasks', 'plan', planId, keyDateStr],
    queryFn: () => dailyTaskService.getTasksByPlan(planId, date),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 指定日のタスクを取得するフック
 */
export const useTasksForDate = (userId: string, date: Date) => {
  // Query キーにはタイムゾーンに影響されない 'yyyy-MM-dd' 形式を使用
  const keyDateStr = format(startOfDay(date), 'yyyy-MM-dd');
  
  // デバッグログ: クエリキー情報と入力日付
  try {
    // eslint-disable-next-line no-console
    console.log('[useDailyTasks.useTasksForDate] BEFORE query', {
      dateInput: date.toISOString(),
      dateInputFormatted: format(date, 'yyyy-MM-dd'),
      keyDateStr,
      userId,
    });
  } catch (e) {}
  
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['tasksForDate', userId, keyDateStr],
    queryFn: async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('[useDailyTasks.useTasksForDate] Fetching for date:', keyDateStr);
      } catch (e) {}
      const result = await dailyTaskService.getTasksForDate(userId, date);
      try {
        // eslint-disable-next-line no-console
        console.log('[useDailyTasks.useTasksForDate] Result:', {
          date: keyDateStr,
          taskCount: result.length,
          tasks: result.map(t => ({
            id: t.id.substring(0, 40),
            startUnit: t.startUnit,
            endUnit: t.endUnit,
            units: t.units,
            taskDate: format(startOfDay(t.date), 'yyyy-MM-dd'),
          })),
        });
      } catch (e) {}
      return result;
    },
    enabled: !!userId && userId !== '', // userIdが空文字列の場合はクエリを無効化
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 今後N日間のタスクを取得するフック
 */
export const useUpcomingTasks = (userId: string, days: number = 7) => {
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['upcomingTasks', userId, days],
    queryFn: () => dailyTaskService.getUpcomingTasks(userId, days),
    enabled: !!userId && userId !== '', // userIdが空文字列の場合はクエリを無効化
    staleTime: 1000 * 60 * 5, // 5分
  });
};
