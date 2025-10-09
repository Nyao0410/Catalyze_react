/**
 * Catalyze AI - Main Tab Navigator
 *      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="today" size={size} color={color} />
          ),
        }}
      />ション
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { PlansScreen } from '../screens/PlansScreen';
import { TodayScreen } from '../screens/TasksScreen';
// import { ReviewScreen } from '../screens/ReviewScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SocialScreen, AccountScreen } from '../screens';
import { colors } from '../theme';
import type { MainTabParamList } from './types';
import { t } from '../../locales';

const Tab = createBottomTabNavigator<MainTabParamList>() as any;

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id="MainTabNavigator"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          title: t('tabs.plans'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TodayScreen}
        options={{
          title: 'タスク',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="today" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          title: t('tabs.review'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="repeat" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: t('tabs.stats'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{
          title: 'ソーシャル',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'アカウント',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
