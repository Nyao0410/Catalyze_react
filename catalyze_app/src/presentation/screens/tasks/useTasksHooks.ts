/**
 * TasksScreen用のカスタムフック
 */

import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { ProgressAnalysisService, StudySessionEntity, DailyTaskEntity } from 'catalyze-ai';
import { t } from '../../../locales';
import {
  extractCompletedRanges,
  calculateCompletedUnits,
  calculateTaskProgress,
  mergeRanges,
  mergeUnitsToRanges,
} from './utils';

interface ActiveTask {
  type: 'daily' | 'review';
  task: any;
  plan: any;
  taskProgress: number;
  achievability: string;
}

interface ReviewItemGroup {
  planId: string;
  date: Date;
  units: Array<{ unit: number; id: string }>;
}

/**
 * アクティブなタスク（復習タスク含む）を計算
 */
export function useActiveTasks(
  dailyTasks: DailyTaskEntity[],
  plans: any[],
  sessions: StudySessionEntity[],
  dueReviewItems: any[],
  progressAnalysisService: ProgressAnalysisService
): ActiveTask[] {
  return useMemo(() => {
    const dailyTaskItems = dailyTasks
      .map((task) => {
        const plan = plans.find((p) => p.id === task.planId);
        if (!plan) return null;

        const planSessions = sessions.filter((s) => s.planId === plan.id && isToday(s.date));

        const completedRanges = extractCompletedRanges(planSessions, task.startUnit, task.endUnit);
        const mergedCompleted = mergeRanges(completedRanges);
        const completedUnitsInTaskRange = calculateCompletedUnits(mergedCompleted);

        const taskProgress = calculateTaskProgress(completedUnitsInTaskRange, task.units);
        if (taskProgress === 1) return null;

        const progress = progressAnalysisService.calculateProgress(plan, planSessions);
        const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

        return { type: 'daily' as const, task, plan, taskProgress, achievability };
      })
      .filter((item) => item !== null);

    const reviewTaskItems = buildReviewTasks(
      dueReviewItems,
      plans,
      sessions,
      progressAnalysisService,
      null
    );

    return [...dailyTaskItems, ...reviewTaskItems];
  }, [dailyTasks, plans, sessions, dueReviewItems, progressAnalysisService]);
}

/**
 * 今日のアクティブなタスクを計算
 */
export function useTodayActiveTasks(
  dailyTasks: DailyTaskEntity[],
  plans: any[],
  sessions: StudySessionEntity[],
  dueReviewItems: any[],
  progressAnalysisService: ProgressAnalysisService
): ActiveTask[] {
  return useMemo(() => {
    const dailyTaskItems = dailyTasks
      .map((task) => {
        const plan = plans.find((p) => p.id === task.planId);
        if (!plan) return null;

        const planSessions = sessions.filter((s) => s.planId === plan.id && isToday(s.date));

        const completedRanges = extractCompletedRanges(planSessions, task.startUnit, task.endUnit);
        const mergedCompleted = mergeRanges(completedRanges);
        const completedUnitsInTaskRange = calculateCompletedUnits(mergedCompleted);

        const taskProgress = calculateTaskProgress(completedUnitsInTaskRange, task.units);
        if (taskProgress === 1) return null;

        const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

        return { type: 'daily' as const, task, plan, taskProgress, achievability };
      })
      .filter((item) => item !== null);

    const today = startOfDay(new Date());
    const reviewTaskItems = buildReviewTasks(
      dueReviewItems,
      plans,
      sessions,
      progressAnalysisService,
      today
    );

    return [...dailyTaskItems, ...reviewTaskItems];
  }, [dailyTasks, plans, sessions, dueReviewItems, progressAnalysisService]);
}

/**
 * 指定日付のアクティブなタスクを計算
 */
export function useTasksForDateActiveTasks(
  tasksForDate: DailyTaskEntity[],
  plans: any[],
  sessions: StudySessionEntity[],
  selectedDate: Date,
  progressAnalysisService: ProgressAnalysisService
): ActiveTask[] {
  return useMemo(() => {
    const selectedDateKey = startOfDay(selectedDate).getTime();

    return tasksForDate
      .map((task) => {
        const plan = plans.find((p) => p.id === task.planId);
        if (!plan) return null;

        const planSessions = sessions.filter(
          (s) => s.planId === plan.id && startOfDay(s.date).getTime() === selectedDateKey
        );

        const completedRanges = extractCompletedRanges(planSessions, task.startUnit, task.endUnit);
        const mergedCompleted = mergeRanges(completedRanges);
        const completedUnitsInTaskRange = calculateCompletedUnits(mergedCompleted);

        const taskProgress = calculateTaskProgress(completedUnitsInTaskRange, task.units);
        if (taskProgress === 1) return null;

        const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

        return { type: 'daily' as const, task, plan, taskProgress, achievability };
      })
      .filter((item) => item !== null);
  }, [tasksForDate, plans, sessions, selectedDate, progressAnalysisService]);
}

/**
 * 復習タスクを構築
 */
export function buildReviewTasks(
  dueReviewItems: any[],
  plans: any[],
  sessions: StudySessionEntity[],
  progressAnalysisService: ProgressAnalysisService,
  filterDate: Date | null
): ActiveTask[] {
  try {
    const today = filterDate || startOfDay(new Date());
    const groups: { [key: string]: ReviewItemGroup } = {};

    dueReviewItems.forEach((r) => {
      const reviewDate = startOfDay(new Date(r.nextReviewDate));
      if (filterDate && reviewDate.getTime() !== today.getTime()) return;
      if (!filterDate && reviewDate.getTime() !== today.getTime()) return;

      const key = `${r.planId}_${reviewDate.getTime()}`;
      groups[key] = groups[key] || { planId: r.planId, date: reviewDate, units: [] };
      const n = Number(r.unitNumber);
      if (!Number.isNaN(n)) groups[key].units.push({ unit: n, id: r.id });
    });

    const result: ActiveTask[] = [];

    for (const key of Object.keys(groups)) {
      const { planId, date, units } = groups[key];
      const plan = plans.find((p) => p.id === planId);
      if (!plan) continue;

      const unitNumbers = units.map((u) => u.unit);
      const ranges = mergeUnitsToRanges(unitNumbers);
      const planSessions = sessions.filter((s) => s.planId === planId && startOfDay(s.date).getTime() === date.getTime());

      ranges.forEach((r, idx) => {
        const reviewTask = {
          id: `review-${planId}-${date.getTime()}-${r.start}-${r.end}-${idx}`,
          planId,
          date,
          startUnit: r.start,
          endUnit: r.end,
          units: r.units,
          estimatedMinutes: r.units * 5,
          round: 1,
          advice: t('today.review.advice') || '復習しましょう！',
          reviewItemIds: units
            .filter((u) => u.unit >= r.start && u.unit <= r.end)
            .map((u) => u.id),
        };

        const completedRanges = extractCompletedRanges(planSessions, r.start, r.end);
        const mergedCompleted = mergeRanges(completedRanges);
        const completed = calculateCompletedUnits(mergedCompleted);

        const taskProgress = calculateTaskProgress(completed, r.units);
        const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

        if (taskProgress < 1) {
          result.push({ type: 'review' as const, task: reviewTask, plan, taskProgress, achievability });
        }
      });
    }

    return result;
  } catch (e) {
    console.warn('[useReviewTasks] Error building review tasks:', e);
    return [];
  }
}

/**
 * 今後の復習予定を計算
 */
export function useUpcomingReviewsSummary(dueReviewItems: any[]): Array<{ date: Date; count: number }> {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const grouped: { [dateKey: string]: number } = {};

    dueReviewItems.forEach((reviewItem) => {
      const reviewDate = startOfDay(new Date(reviewItem.nextReviewDate));
      if (reviewDate.getTime() <= today.getTime()) return;

      const dateKey = reviewDate.getTime().toString();
      grouped[dateKey] = (grouped[dateKey] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([dateKey, count]) => ({ date: new Date(Number(dateKey)), count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 7);
  }, [dueReviewItems]);
}

/**
 * マーク対象の日付を計算
 */
export function useMarkedDates(
  upcomingTasks: any[],
  allReviewItems: any[],
  selectedDate: Date,
  colors: any
): { [key: string]: any } {
  return useMemo(() => {
    const dates: { [key: string]: any } = {};

    upcomingTasks.forEach((task) => {
      try {
        const taskDate = task.date instanceof Date ? task.date : new Date(task.date);
        const dateKey = format(startOfDay(taskDate), 'yyyy-MM-dd');
        dates[dateKey] = { marked: true, dotColor: colors.primary };
      } catch (e) {
        console.warn('[useMarkedDates] Failed to format task date:', e);
      }
    });

    allReviewItems.forEach((reviewItem) => {
      try {
        const reviewDate = reviewItem.nextReviewDate instanceof Date
          ? reviewItem.nextReviewDate
          : new Date(reviewItem.nextReviewDate);
        const dateKey = format(startOfDay(reviewDate), 'yyyy-MM-dd');
        dates[dateKey] = { marked: true, dotColor: colors.primary };
      } catch (e) {
        console.warn('[useMarkedDates] Failed to format review date:', e);
      }
    });

    const selectedKey = format(startOfDay(selectedDate), 'yyyy-MM-dd');
    dates[selectedKey] = {
      selected: true,
      selectedColor: colors.primary,
      marked: dates[selectedKey]?.marked || false,
      dotColor: dates[selectedKey]?.dotColor || colors.primary,
    };

    return dates;
  }, [upcomingTasks, allReviewItems, selectedDate, colors]);
}

/**
 * ヘルパー関数
 */
function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
