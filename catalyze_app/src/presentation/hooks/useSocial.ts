/**
 * StudyNext - Social Hooks
 * ソーシャル機能のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SocialService } from '../../application/services';
import type { Friend, CooperationGoal, UserPoints } from '../../types';

/**
 * フレンドリスト取得
 */
export function useFriends(userId: string) {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: () => SocialService.getFriends(userId),
  });
}

/**
 * フレンド追加
 */
export function useAddFriend() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, friend }: { userId: string; friend: Omit<Friend, 'userId' | 'addedAt'> }) =>
      SocialService.addFriend(userId, friend),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friends', variables.userId] });
    },
  });
}

/**
 * 協力目標リスト取得
 */
export function useCooperationGoals(userId: string) {
  return useQuery({
    queryKey: ['cooperationGoals', userId],
    queryFn: () => SocialService.getCooperationGoals(userId),
  });
}

/**
 * 協力目標作成
 */
export function useCreateCooperationGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>) =>
      SocialService.createCooperationGoal(goal),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cooperationGoals', data.creatorId] });
    },
  });
}

/**
 * 協力目標の進捗更新
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) =>
      SocialService.updateGoalProgress(goalId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperationGoals'] });
    },
  });
}

/**
 * ユーザーポイント取得
 */
export function useUserPoints(userId: string) {
  return useQuery({
    queryKey: ['userPoints', userId],
    queryFn: () => SocialService.getUserPoints(userId),
  });
}

/**
 * ポイント追加
 */
export function useAddPoints() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, points }: { userId: string; points: number }) =>
      SocialService.addPoints(userId, points),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userPoints', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
}

/**
 * ランキング取得
 */
export function useRanking(userIds: string[]) {
  return useQuery({
    queryKey: ['ranking', ...userIds],
    queryFn: () => SocialService.getRanking(userIds),
    enabled: userIds.length > 0,
  });
}

/**
 * モックデータ初期化
 */
export function useInitializeSocialMockData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => SocialService.initializeMockData(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['cooperationGoals'] });
      queryClient.invalidateQueries({ queryKey: ['userPoints'] });
    },
  });
}

/**
 * フレンド削除
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, friendId }: { userId: string; friendId: string }) =>
      SocialService.removeFriend(userId, friendId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friends', variables!.userId] });
    },
  });
}
