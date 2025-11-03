/**
 * useAuth - Authentication hooks
 * 認証関連のフック
 */

import { useState, useEffect } from 'react';
import { getCurrentUserId, isUserLoggedIn, onAuthStateChange, getOrCreateLocalUserId } from '../../infrastructure/auth';

/**
 * 現在のユーザーIDを取得するフック
 * 非同期でユーザーIDを取得し、stateで管理
 * 未ログイン時でもローカルIDを返すため、常に有効なIDが返される
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await getCurrentUserId();
        const loggedIn = isUserLoggedIn();
        setUserId(id);
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Failed to get user ID:', error);
        // エラー時もフォールバックでローカルIDを試みる
        try {
          const localId = await getOrCreateLocalUserId();
          setUserId(localId);
          setIsLoggedIn(false);
        } catch (fallbackError) {
          console.error('Failed to get fallback local ID:', fallbackError);
          setUserId('error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();

    // 認証状態の変更を監視
    const unsubscribe = onAuthStateChange(async () => {
      try {
        const id = await getCurrentUserId();
        const loggedIn = isUserLoggedIn();
        setUserId(id);
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Failed to get user ID on auth change:', error);
        // エラー時もフォールバックでローカルIDを試みる
        try {
          const localId = await getOrCreateLocalUserId();
          setUserId(localId);
          setIsLoggedIn(false);
        } catch (fallbackError) {
          console.error('Failed to get fallback local ID on auth change:', fallbackError);
        }
      }
    });

    return unsubscribe;
  }, []);

  return { userId, isLoading, isLoggedIn };
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