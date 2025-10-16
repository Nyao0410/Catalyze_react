/**
 * StudyNext - Custom Hooks for Review Items
 * 復習アイテム用のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewItemService } from '../../services';
import type { ReviewItemEntity } from 'catalyze-ai';

const QUERY_KEY = 'reviewItems';

/**
 * 特定の計画の復習アイテムを取得
 */
export const useReviewItems = (planId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, planId],
    queryFn: () => reviewItemService.getReviewItemsByPlanId(planId),
    enabled: !!planId,
  });
};

/**
 * 今日復習すべきアイテムを取得
 */
export const useDueReviewItems = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'due', userId],
    queryFn: () => reviewItemService.getDueReviewItems(userId),
    staleTime: 1000 * 60 * 5, // 5分
  });
};

/**
 * ユーザーの全復習アイテムを取得
 */
export const useUserReviewItems = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, 'user', userId],
    queryFn: () => reviewItemService.getReviewItemsByUserId(userId),
  });
};

/**
 * 復習アイテムを1件取得
 */
export const useReviewItem = (itemId: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, itemId],
    queryFn: () => reviewItemService.getReviewItemById(itemId),
    enabled: !!itemId,
  });
};

/**
 * 復習アイテムを作成
 */
export const useCreateReviewItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: ReviewItemEntity) =>
      reviewItemService.createReviewItem(item),
    onSuccess: (data: ReviewItemEntity) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'user', data.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'due', data.userId] });
    },
  });
};

/**
 * 復習アイテムを更新
 */
export const useUpdateReviewItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: ReviewItemEntity) =>
      reviewItemService.updateReviewItem(item),
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, item.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'user', item.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'due', item.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, item.id] });
    },
  });
};

/**
 * 復習評価を記録（SM-2アルゴリズム）
 */
export const useRecordReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quality }: { itemId: string; quality: number }) =>
      reviewItemService.recordReview(itemId, quality),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, item.planId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'user', item.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'due', item.userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, item.id] });
    },
  });
};

/**
 * 復習アイテムを削除
 */
export const useDeleteReviewItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      reviewItemService.deleteReviewItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
