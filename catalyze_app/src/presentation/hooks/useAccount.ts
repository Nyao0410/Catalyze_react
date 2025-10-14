/**
 * StudyNext - Account Hooks
 * アカウント関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountService } from '../../application/services';
import type { UserProfile, UserSettings } from '../../types';

/**
 * プロフィール取得
 */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => AccountService.getProfile(),
  });
}

/**
 * プロフィール更新
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>) =>
      AccountService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * 設定取得
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => AccountService.getSettings(),
  });
}

/**
 * 設定更新
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>) =>
      AccountService.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

/**
 * 学習時間追加
 */
export function useAddStudyHours() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (hours: number) => AccountService.addStudyHours(hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * プロフィール初期化
 */
export function useInitializeProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, email, displayName }: { userId: string; email: string; displayName?: string }) =>
      AccountService.initializeDefaultProfile(userId, email, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * 設定初期化
 */
export function useInitializeSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => AccountService.initializeDefaultSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
