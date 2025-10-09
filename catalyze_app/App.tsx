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
import { ensureAnonymousSignIn } from './src/infrastructure/auth';

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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 認証（匿名サインイン）して UID を取得（firebaseConfig が未設定でも続行できるよう保護）
        let uid = 'user-001';
        let user: any = null;
        try {
          user = await ensureAnonymousSignIn();
          uid = user.uid;
        } catch (err) {
          console.warn('Anonymous sign-in failed or firebase not configured, falling back to local UID user-001', err);
        }

        // モックデータを投入（UID を使用）
        await seedMockData(
          uid,
          planRepository,
          sessionRepository,
          reviewRepository
        );

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
      <RootNavigator />
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
