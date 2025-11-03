/**
 * StudyNext - Custom Hooks for Study Sessions
 * 学習セッション用のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studySessionService } from '../../services'; // サービスファイルからインポート
import type { StudySessionEntity } from 'catalyze-ai';

const QUERY_KEY = 'studySessions';

/**
 * 特定の計画の学習セッションを取得
 */
export const useStudySessions = (planId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, planId],
    queryFn: () => studySessionService.getSessionsByPlanId(planId),
    enabled: !!planId,
  });
};

/**
 * ユーザーの全学習セッションを取得
 * 
 * 取得されるセッションには以下が含まれます：
 * - 計画画面からの学習記録
 * - 復習タスクからの学習記録
 * - その他全ての学習セッション
 * 
 * デフォルトで全期間（1970年1月1日から現在まで）の記録を取得します。
 */
export const useUserSessions = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'user', userId],
    queryFn: () => studySessionService.getSessionsByUserId(userId),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * 学習セッションを1件取得
 */
export const useStudySession = (sessionId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, sessionId],
    queryFn: () => studySessionService.getSessionById(sessionId),
    enabled: !!sessionId,
  });
};

/**
 * 学習セッションを作成
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (session: StudySessionEntity) =>
      studySessionService.createSession(session),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'user', data.userId] });
      // 統計画面で使用されるキー（重要: 統計が正しく更新されるように）
      queryClient.invalidateQueries({ queryKey: ['sessions', 'all', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['stats', data.userId] });
      // 学習セッションの作成により日次タスクや今後のタスクが変わる可能性があるため無効化
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', data.userId] });
    },
  });
};

/**
 * 学習セッションを更新
 */
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (session: StudySessionEntity) =>
      studySessionService.updateSession(session),
    onSuccess: (_, session) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, session.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'user', session.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, session.id] });
      // 統計画面で使用されるキー（重要: 統計が正しく更新されるように）
      queryClient.invalidateQueries({ queryKey: ['sessions', 'all', session.userId] });
      queryClient.invalidateQueries({ queryKey: ['stats', session.userId] });
      // 更新によりタスクの完了状況が変わるため関連クエリを無効化
      queryClient.invalidateQueries({ queryKey: ['dailyTasks', session.userId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks', session.userId] });
    },
  });
};

/**
 * 学習セッションを削除
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // セッションを取得してuserIdを取得する必要がある
      const session = await studySessionService.getSessionById(sessionId);
      await studySessionService.deleteSession(sessionId);
      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      // 統計画面で使用されるキー（重要: 統計が正しく更新されるように）
      if (session?.userId) {
        queryClient.invalidateQueries({ queryKey: ['sessions', 'all', session.userId] });
        queryClient.invalidateQueries({ queryKey: ['stats', session.userId] });
      }
      // 削除でもタスクに影響するため無効化
      queryClient.invalidateQueries({ queryKey: ['dailyTasks'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingTasks'] });
    },
  });
};
