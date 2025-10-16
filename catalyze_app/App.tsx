/**
 * StudyNext - Main App Entry Point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/presentation/navigation';
import { seedMockData } from './src/infrastructure/mockData';
import { ThemeProvider, useTheme } from './src/presentation/theme/ThemeProvider';
import { TopToastProvider } from './src/presentation/hooks/useTopToast';
import './src/locales'; // i18nの初期化
import { t } from './src/locales';
import {
  planRepository,
  sessionRepository,
  reviewRepository,
} from './src/services';
import { AccountService, SocialService } from './src/application/services';
import { getCurrentUserId, isUserLoggedIn, onAuthStateChange, getCurrentUser } from './src/infrastructure/auth';
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
  const { mode } = useTheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // ローカルユーザーIDを取得（ログインしていない場合はローカルID）
        const uid = await getCurrentUserId();
        const user = getCurrentUser();
        const loggedIn = isUserLoggedIn();
        
        console.log('[Init] User ID:', uid);
        console.log('[Init] Logged in:', loggedIn);
        if (user) {
          console.log('[Init] Firebase user:', user.uid, user.email);
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

        // アカウント初期化（ローカルで動作、プロフィールがなければ作成）
        try {
          const profile = await AccountService.getProfile();
          if (!profile) {
            console.log('[Init] Creating default local profile...');
            await AccountService.initializeDefaultProfile(uid, `user@local`);
            await AccountService.initializeDefaultSettings();
          }
        } catch (error) {
          console.error('[Init] Failed to initialize account:', error);
        }

        // ソーシャル機能の初期化（ログイン済みユーザーのみ）
        if (loggedIn && user) {
          console.log('[Init] User is logged in, initializing social features...');
          
          try {
            console.log('[Init] Checking friends...');
            if (uid && uid.trim() !== '') {
              const friends = await SocialService.getFriends(uid);
              console.log('[Init] Friends count:', friends.length);
              if (friends.length === 0) {
                console.log('[Init] Initializing social mock data...');
                await SocialService.initializeMockData(uid);
              }
            }
          } catch (error) {
            console.error('[Init] Firestore operation failed:', error);
            const errorObj = error as any;
            console.error('[Init] Error details:', errorObj?.message, errorObj?.code);
          }
        } else {
          console.log('[Init] User not logged in - social features will be disabled');
        }
        
        // Debug: dump account-related AsyncStorage keys to help diagnose persistence issues
        try {
          const profileRaw = await AsyncStorage.getItem('@studynext:profile');
          const settingsRaw = await AsyncStorage.getItem('@studynext:settings');
          console.log('[Debug] AsyncStorage profile length:', profileRaw ? profileRaw.length : 0);
          console.log('[Debug] AsyncStorage settings length:', settingsRaw ? settingsRaw.length : 0);
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
    <NavigationContainer theme={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator initialRoute={initialRoute} />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
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
