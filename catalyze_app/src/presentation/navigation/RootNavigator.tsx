/**
 * Catalyze AI - Root Stack Navigator
 * ルートナビゲーション
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { PlanDetailScreen, CreatePlanScreen } from '../screens';
import { TimerScreen } from '../screens/TimerScreen';
import { RecordSessionScreen } from '../screens/RecordSessionScreen';
import { ReviewEvaluationScreen } from '../screens/ReviewEvaluationScreen';
import { FriendsListScreen } from '../screens/FriendsListScreen';
import { AddFriendScreen } from '../screens/AddFriendScreen';
import { CreateCooperationGoalScreen } from '../screens/CreateCooperationGoalScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { AuthScreen } from '../screens/AuthScreen';
import type { RootStackParamList } from './types';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>() as any;

interface RootNavigatorProps {
  initialRoute?: 'Login' | 'MainTabs';
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ initialRoute = 'Login' }) => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PlanDetail" 
        component={PlanDetailScreen}
        options={{ 
          title: '計画詳細',
          headerBackTitle: '戻る',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="CreatePlan"
        component={CreatePlanScreen}
        options={{
          title: '新規計画作成',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="EditPlan"
        component={CreatePlanScreen}
        options={{
          title: '計画を編集',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="TimerScreen"
        component={TimerScreen}
        options={{
          title: '学習タイマー',
          gestureEnabled: false,
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="RecordSession"
        component={RecordSessionScreen}
        options={{
          title: '学習記録',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="ReviewEvaluation"
        component={ReviewEvaluationScreen}
        options={{
          title: '復習の評価',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      />
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateCooperationGoal"
        component={CreateCooperationGoalScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
