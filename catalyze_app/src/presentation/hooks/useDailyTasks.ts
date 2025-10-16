/**
 * StudyNext - useDailyTasks Hook
 * 今日のタスク取得用カスタムフック
 */

import { useQuery } from '@tanstack/react-query';
import { dailyTaskService } from '../../application/services';
import type { DailyTaskEntity } from 'catalyze-ai';
import { startOfDay } from 'date-fns';

/**
 * 今日のタスクを取得するフック
 */
export const useDailyTasks = (userId: string, date?: Date) => {
  // dateがundefinedの場合は今日の日付を使用し、毎回同じ値を返すように固定
  const today = startOfDay(new Date());
  const keyDate = startOfDay(date || today).toISOString();
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['dailyTasks', userId, keyDate],
    queryFn: () => dailyTaskService.getTodayTasks(userId, date),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 特定の計画の今日のタスクを取得するフック
 */
export const useDailyTasksByPlan = (planId: string, date?: Date) => {
  const keyDate = startOfDay(date || new Date()).toISOString();
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['dailyTasks', 'plan', planId, keyDate],
    queryFn: () => dailyTaskService.getTasksByPlan(planId, date),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 指定日のタスクを取得するフック
 */
export const useTasksForDate = (userId: string, date: Date) => {
  const keyDate = startOfDay(date).toISOString();
  return useQuery<DailyTaskEntity[]>({
    queryKey: ['tasksForDate', userId, keyDate],
    queryFn: () => dailyTaskService.getTasksForDate(userId, date),
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
    staleTime: 1000 * 60 * 5, // 5分
  });
};
