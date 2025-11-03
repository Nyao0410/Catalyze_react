/**
 * StudyNext - Social Hooks
 * ソーシャル機能のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SocialService, AICompetitionService } from '../../application/services';
import type { Friend, CooperationGoal, UserPoints, AICompetitor, AICompetitionMatch, CompetitionMatchType } from '../../types';

/**
 * フレンドリスト取得
 */
export function useFriends(userId: string) {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: () => {
      console.log('[useFriends] Called with userId:', userId);
      return SocialService.getFriends(userId);
    },
    enabled: !!userId && userId.trim() !== '',
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
    enabled: !!userId && userId.trim() !== '',
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
    queryFn: () => {
      console.log('[useUserPoints] Called with userId:', userId);
      return SocialService.getUserPoints(userId);
    },
    enabled: !!userId && userId.trim() !== '',
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
    enabled: userIds.length > 0 && userIds.every(id => !!id && id.trim() !== ''),
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

/**
 * =============================================
 * AI 競争機能のフック
 * =============================================
 */

/**
 * 利用可能なAIキャラクターを取得
 */
export function useAvailableAICompetitors() {
  return useQuery({
    queryKey: ['availableAICompetitors'],
    queryFn: () => AICompetitionService.getAvailableAICompetitors(),
  });
}

/**
 * 特定のAIキャラクターの詳細を取得
 */
export function useAICompetitorDetail(aiId: string) {
  return useQuery({
    queryKey: ['aiCompetitor', aiId],
    queryFn: () => AICompetitionService.getAICompetitorDetail(aiId),
    enabled: !!aiId && aiId.trim() !== '',
  });
}

/**
 * AI競争を開始
 */
export function useStartAICompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      userId,
      aiId,
      matchType,
      duration,
    }: {
      userId: string;
      aiId: string;
      matchType: CompetitionMatchType;
      duration: number;
    }) => AICompetitionService.startCompetition(userId, aiId, matchType, duration),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeAIMatches', variables.userId] });
    },
  });
}

/**
 * ユーザーのアクティブなAI競争を取得
 */
export function useActiveAIMatches(userId: string) {
  return useQuery({
    queryKey: ['activeAIMatches', userId],
    queryFn: () => AICompetitionService.getActiveMatches(userId),
    enabled: !!userId && userId.trim() !== '',
    refetchInterval: 10000, // 10秒ごとにユーザーデータの最新状態を同期
  });
}

/**
 * ユーザーの完了済みAI競争を取得
 */
export function useCompletedAIMatches(userId: string) {
  return useQuery({
    queryKey: ['completedAIMatches', userId],
    queryFn: () => AICompetitionService.getCompletedMatches(userId),
    enabled: !!userId && userId.trim() !== '',
  });
}

/**
 * 特定のマッチを取得
 */
export function useAIMatch(matchId: string) {
  return useQuery({
    queryKey: ['aiMatch', matchId],
    queryFn: () => AICompetitionService.getMatch(matchId),
    enabled: !!matchId && matchId.trim() !== '',
    refetchInterval: 5000, // 5秒ごとに自動更新
  });
}

/**
 * ユーザー進捗を更新
 */
export function useUpdateAIMatchProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ matchId, progress }: { matchId: string; progress: number }) =>
      AICompetitionService.updateUserProgress(matchId, progress),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['aiMatch', data.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAIMatches'] });
      queryClient.invalidateQueries({ queryKey: ['completedAIMatches'] });
    },
  });
}

/**
 * マッチをキャンセル
 */
export function useCancelAIMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (matchId: string) => AICompetitionService.cancelMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAIMatches'] });
      queryClient.invalidateQueries({ queryKey: ['completedAIMatches'] });
      queryClient.invalidateQueries({ queryKey: ['aiMatch'] });
    },
  });
}

