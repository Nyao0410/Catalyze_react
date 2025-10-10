/**
 * Catalyze AI - Navigation Types
 * React Navigationの型定義
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  MainTabs: undefined;
  PlanDetail: { planId: string };
  CreatePlan: undefined;
  EditPlan: { planId: string };
  TimerScreen: { planId: string; taskId?: string; startUnit?: number; endUnit?: number };
  RecordSession: { planId: string; taskId?: string; sessionId?: string; elapsedMinutes?: number; startUnit?: number; endUnit?: number; fromTimer?: boolean };
  ReviewDetail: { reviewId: string };
  ReviewEvaluation: { itemId?: string; reviewItemIds?: string[]; planId?: string; startUnit?: number; endUnit?: number };
  FriendsList: undefined;
  CreateCooperationGoal: undefined;
  Help: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

// Bottom Tab Navigator
export type MainTabParamList = {
  Plans: undefined;
  Tasks: undefined;
  // Review: undefined;
  Stats: undefined;
  Social: undefined;
  Account: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// Navigation Prop Types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
