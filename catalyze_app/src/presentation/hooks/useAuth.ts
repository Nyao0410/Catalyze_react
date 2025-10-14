/**
 * useAuth - Authentication hooks
 * 認証関連のフック
 */

import { useState, useEffect } from 'react';
import { getCurrentUserId, isUserLoggedIn, onAuthStateChange } from '../../infrastructure/auth';

/**
 * 現在のユーザーIDを取得するフック
 * 非同期でユーザーIDを取得し、stateで管理
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string>('loading');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
        setUserId('error');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();

    // 認証状態の変更を監視
    const unsubscribe = onAuthStateChange(async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID on auth change:', error);
        setUserId('error');
      }
    });

    return unsubscribe;
  }, []);

  return { userId, isLoading };
}

/**
 * ログイン状態を取得するフック
 */
export function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = useState(isUserLoggedIn());

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setIsLoggedIn(!!user && !user.isAnonymous);
    });

    return unsubscribe;
  }, []);

  return isLoggedIn;
}