/**
 * StudyNext - Hook to Auto-Create Daily Review Tasks
 * 本日のタスク完了時に自動的に復習タスクを作成するフック
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startOfDay, isToday, addDays } from 'date-fns';
import type { DailyTaskEntity, StudySessionEntity } from 'catalyze-ai';
import { reviewItemService } from '../../services';
import { ReviewItemEntity } from 'catalyze-ai';

/**
 * 今日のすべてのタスクが完了したかを確認し、完了していれば復習タスクを作成
 */
export const useCreateDailyReviewTasks = (
  userId: string,
  todayTasks: DailyTaskEntity[],
  sessions: StudySessionEntity[],
  plans: any[]
) => {
  const queryClient = useQueryClient();
  const previousCompletedStateRef = useRef(false);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) {
      return;
    }

    const checkAndCreateReviewTasks = async () => {
      try {
        if (!Array.isArray(todayTasks) || todayTasks.length === 0) {
          return;
        }

        const today = startOfDay(new Date());

        // 全ての今日のタスクが完了しているかを確認
        const allTasksCompleted = todayTasks.every((task) => {
          const taskSessions = sessions.filter((s) => s.planId === task.planId && isToday(s.date));
          
          // タスクの範囲（startUnit - endUnit）全体が完了しているか確認
          if (task.startUnit !== undefined && task.endUnit !== undefined) {
            // 範囲ベースのタスク：startUnit から endUnit までのすべてのユニットが完了しているか確認
            const taskRange = task.endUnit - task.startUnit + 1;
            const completedRanges: Array<{ start: number; end: number }> = [];

            taskSessions.forEach((s) => {
              if (s.startUnit !== undefined && s.endUnit !== undefined) {
                const overlapStart = Math.max(task.startUnit, s.startUnit);
                const overlapEnd = Math.min(task.endUnit, s.endUnit);
                if (overlapStart <= overlapEnd) {
                  completedRanges.push({ start: overlapStart, end: overlapEnd });
                }
              }
            });

            // マージして重複排除
            const mergedRanges = (ranges: Array<{ start: number; end: number }>) => {
              if (ranges.length === 0) return [];
              const sorted = ranges.sort((a, b) => a.start - b.start);
              const merged: Array<{ start: number; end: number }> = [sorted[0]];
              for (let i = 1; i < sorted.length; i++) {
                const last = merged[merged.length - 1];
                if (sorted[i].start <= last.end + 1) {
                  last.end = Math.max(last.end, sorted[i].end);
                } else {
                  merged.push(sorted[i]);
                }
              }
              return merged;
            };

            const merged = mergedRanges(completedRanges);
            const completedUnits = merged.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
            return completedUnits >= taskRange;
          } else {
            // 単位数ベースのタスク
            const totalUnits = taskSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
            return totalUnits >= task.units;
          }
        });

        // ステート変化を検出（完了状態に変わったときだけ復習タスク作成）
        if (allTasksCompleted && !previousCompletedStateRef.current) {
          previousCompletedStateRef.current = true;
          hasExecutedRef.current = true;
          if (__DEV__) {
            console.log('[Auto-Create Review] All today\'s tasks completed, creating review tasks...');
          }

          // 完了したユニットを収集
          const completedUnits = new Set<number>();
          const planIds = new Set<string>();

          todayTasks.forEach((task) => {
            const taskSessions = sessions.filter((s) => s.planId === task.planId && isToday(s.date));

            taskSessions.forEach((s) => {
              planIds.add(task.planId);
              if (s.startUnit !== undefined && s.endUnit !== undefined) {
                for (let u = s.startUnit; u <= s.endUnit; u++) {
                  completedUnits.add(u);
                }
              } else {
                const cumulativeBefore = sessions
                  .filter((ss) => ss.planId === s.planId && ss.date < s.date)
                  .reduce((sum, ss) => sum + ss.unitsCompleted, 0);
                const cumulativeIncluding = sessions
                  .filter((ss) => ss.planId === s.planId && ss.date <= s.date)
                  .reduce((sum, ss) => sum + ss.unitsCompleted, 0);
                for (let u = cumulativeBefore + 1; u <= cumulativeIncluding; u++) {
                  completedUnits.add(u);
                }
              }
            });
          });

          // 復習アイテムを作成
          const units = Array.from(completedUnits).sort((a, b) => a - b);
          const tomorrow = addDays(today, 1);
          if (__DEV__) {
            console.log('[Auto-Create Review] Creating review items for units:', units, 'nextReviewDate:', tomorrow);
          }

          for (const planId of planIds) {
            for (const unitNum of units) {
              const reviewItem = new ReviewItemEntity({
                id: `review-${planId}-${unitNum}-${tomorrow.getTime()}`,
                userId,
                planId,
                unitNumber: unitNum,
                lastReviewDate: today,
                nextReviewDate: tomorrow,
                easeFactor: 2.5,
                repetitions: 0,
                intervalDays: 1,
              } as any);

              try {
                const existing = await reviewItemService.getReviewItemsByPlanId(planId);
                const isDuplicate = existing.some(
                  (item) =>
                    item.planId === planId &&
                    Number(item.unitNumber) === unitNum &&
                    startOfDay(new Date(item.nextReviewDate)).getTime() === tomorrow.getTime()
                );

                if (!isDuplicate) {
                  await reviewItemService.createReviewItem(reviewItem);
                  if (__DEV__) {
                    console.log(`[Auto-Create Review] Created for unit ${unitNum} in plan ${planId}`);
                  }
                }
              } catch (err) {
                if (__DEV__) {
                  console.warn(`[Auto-Create Review] Failed for unit ${unitNum}:`, err);
                }
              }
            }
          }

          // キャッシュ無効化
          // try {
          //   if (__DEV__) {
          //     console.log('[Auto-Create Review] Invalidating queries...');
          //   }
          //   queryClient.invalidateQueries({ queryKey: ['reviewItems'] });
          //   queryClient.invalidateQueries({ queryKey: ['dailyTasks'] });
          // } catch (e) {
          //   if (__DEV__) {
          //     console.warn('[Auto-Create Review] Error invalidating cache:', e);
          //   }
          // }
        } else if (!allTasksCompleted && previousCompletedStateRef.current) {
          previousCompletedStateRef.current = false;
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[Auto-Create Review] Unexpected error:', err);
        }
      }
    };

    checkAndCreateReviewTasks();
  }, [todayTasks, sessions, plans]);
};
