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
import { CreateCooperationGoalScreen } from '../screens/CreateCooperationGoalScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { AboutScreen } from '../screens/AboutScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>() as any;

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
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
        }}
      />
      <Stack.Screen
        name="CreatePlan"
        component={CreatePlanScreen}
        options={{
          title: '新規計画作成',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditPlan"
        component={CreatePlanScreen}
        options={{
          title: '計画を編集',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TimerScreen"
        component={TimerScreen}
        options={{
          title: '学習タイマー',
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="RecordSession"
        component={RecordSessionScreen}
        options={{
          title: '学習記録',
        }}
      />
      <Stack.Screen
        name="ReviewEvaluation"
        component={ReviewEvaluationScreen}
        options={{
          title: '復習の評価',
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
