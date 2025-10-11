/**
 * StudyNext - Main App Entry Point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/presentation/navigation';
import { seedMockData } from './src/infrastructure/mockData';
import { ThemeProvider } from './src/presentation/theme/ThemeProvider';
import { TopToastProvider } from './src/presentation/hooks/useTopToast';
import './src/locales'; // i18nの初期化
import { t } from './src/locales';
import {
  planRepository,
  sessionRepository,
  reviewRepository,
} from './src/services';
import { AccountService, SocialService } from './src/application/services';
import { ensureAnonymousSignIn, onAuthStateChange, getCurrentUser } from './src/infrastructure/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Query クライアントの設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5分
    },
  },
});

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'MainTabs'>('MainTabs');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 既存のユーザーがいるかチェック
        const currentUser = getCurrentUser();
        let uid = 'user-001';
        let user: any = null;
        
        if (currentUser) {
          // 既にログイン済み
          uid = currentUser.uid;
          user = currentUser;
        } else {
          // ログインしていない場合は、匿名サインインまたはローカルデータを使用
          try {
            user = await ensureAnonymousSignIn();
            uid = user.uid;
          } catch (err) {
            console.warn('Anonymous sign-in failed, using local data', err);
            // 匿名ログインが失敗してもローカルデータで動作可能
            uid = 'user-001';
          }
        }

        // モックデータを投入（UID を使用） — 既にデータがある場合はスキップ
        try {
          const existingPlans = await planRepository.findByUserId(uid);
          if (!existingPlans || existingPlans.length === 0) {
            await seedMockData(
              uid,
              planRepository,
              sessionRepository,
              reviewRepository
            );
          } else {
            console.log('[Init] Existing plans found, skipping seedMockData');
          }
        } catch (e) {
          console.warn('[Init] Failed to check existing plans, proceeding to seed', e);
          await seedMockData(
            uid,
            planRepository,
            sessionRepository,
            reviewRepository
          );
        }

        // アカウントとソーシャル機能の初期化（UID を使用）
        const profile = await AccountService.getProfile();
        if (!profile) {
          await AccountService.initializeDefaultProfile(uid, user.email || `${uid}@local`);
          await AccountService.initializeDefaultSettings(uid);
        }

        const friends = await SocialService.getFriends(uid);
        if (friends.length === 0) {
          await SocialService.initializeMockData(uid);
        }
        
        // Debug: dump account-related AsyncStorage keys to help diagnose persistence issues
        try {
          const profileRaw = await AsyncStorage.getItem('@studynext:profile');
          const settingsRaw = await AsyncStorage.getItem('@studynext:settings');
          console.log('[Debug] AsyncStorage profile length:', profileRaw ? profileRaw.length : 0);
          console.log('[Debug] AsyncStorage settings length:', settingsRaw ? settingsRaw.length : 0);
          // Debug dumps removed: studyPlans raw dump was used during debugging and removed to reduce noise.
        } catch (e) {
          console.error('[Debug] Failed to read AsyncStorage during init', e);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // エラーでも続行
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator initialRoute={initialRoute} />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  // ...existing code...
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TopToastProvider>
            <AppContent />
          </TopToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
