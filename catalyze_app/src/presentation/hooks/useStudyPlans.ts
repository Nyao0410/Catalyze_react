/**
 * StudyNext - Custom Hooks for Study Plans
 * 学習計画用のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyPlanService } from '../../services'; // サービスファイルからインポート
import type { StudyPlanEntity } from 'catalyze-ai';

const QUERY_KEY = 'studyPlans';

/**
 * 全ての学習計画を取得
 */
export const useStudyPlans = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => studyPlanService.getAllPlans(userId),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * アクティブな学習計画を取得
 */
export const useActivePlans = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'active', userId],
    queryFn: () => studyPlanService.getActivePlans(userId),
  });
};

/**
 * 学習計画を1件取得
 */
export const useStudyPlan = (planId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, planId],
    queryFn: () => studyPlanService.getPlanById(planId),
    enabled: !!planId,
  });
};

/**
 * 学習計画を作成
 */
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: StudyPlanEntity) => studyPlanService.createPlan(plan),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', data.userId] });
      // 新規作成時は今日のタスクも更新
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', data.userId] });
      // 予定(今後のタスク)も更新してカレンダーのマークを反映
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', data.userId] });
      // 日付ごとのタスクキャッシュも念のため無効化
      queryClient.invalidateQueries({ queryKey: ['tasksForDate', data.userId] });
    },
  });
};

/**
 * 学習計画を更新
 */
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: StudyPlanEntity) => studyPlanService.updatePlan(plan),
    onSuccess: (_, plan) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.id] });
      // Invalidate task-related queries so UI (TasksScreen) updates
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['tasksForDate', plan.userId] });
      // also invalidate per-plan daily tasks
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', 'plan', plan.id] });
    },
  });
};

/**
 * 学習計画を削除
 */
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => studyPlanService.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

/**
 * 学習計画を一時停止
 */
export const usePausePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => studyPlanService.pausePlan(planId),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.id] });
      // Ensure task lists are refreshed
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['tasksForDate', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', 'plan', plan.id] });
    },
  });
};

/**
 * 学習計画を再開
 */
export const useResumePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => studyPlanService.resumePlan(planId),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.id] });
      // Ensure task lists are refreshed
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['tasksForDate', plan.userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', 'plan', plan.id] });
    },
  });
};

/**
 * 学習計画を完了
 */
export const useCompletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => studyPlanService.completePlan(planId),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'active', plan.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, plan.id] });
    },
  });
};
