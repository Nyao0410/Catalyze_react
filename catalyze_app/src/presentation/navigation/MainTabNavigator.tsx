/**
 * Catalyze AI - Main Tab Navigator
 * タブレット時は左側Drawer、スマホ時は下部タブを表示
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { PlansScreen } from '../screens/PlansScreen';
import { TodayScreen } from '../screens/TasksScreen';
// import { ReviewScreen } from '../screens/ReviewScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SocialScreen, AccountScreen } from '../screens';
import { colors } from '../theme';
import type { MainTabParamList } from './types';
import { t } from '../../locales';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator<MainTabParamList>() as any;
const Drawer = createDrawerNavigator<MainTabParamList>() as any;

// スクリーン設定の共通データ
const screenConfigs = [
  {
    name: 'Plans' as const,
    component: PlansScreen,
    title: t('tabs.plans'),
    icon: 'list' as const,
  },
  {
    name: 'Tasks' as const,
    component: TodayScreen,
    title: 'タスク',
    icon: 'today' as const,
  },
  {
    name: 'Stats' as const,
    component: StatsScreen,
    title: t('tabs.stats'),
    icon: 'stats-chart' as const,
  },
  {
    name: 'Social' as const,
    component: SocialScreen,
    title: 'ソーシャル',
    icon: 'people' as const,
  },
  {
    name: 'Account' as const,
    component: AccountScreen,
    title: 'アカウント',
    icon: 'person' as const,
  },
];

export const MainTabNavigator: React.FC = () => {
  const { isTablet } = useTheme();

  // タブレット時は左側Drawerを使用
  if (isTablet) {
    return (
      <Drawer.Navigator
        id="MainDrawerNavigator"
        screenOptions={{
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textSecondary,
          headerShown: true,
          drawerPosition: 'left',
          drawerType: 'permanent',
          drawerStyle: {
            width: 90, // アイコンのみ表示にするため幅を縮小
            backgroundColor: colors.background,
            borderRightWidth: 1,
            borderRightColor: colors.border,
          },
          drawerLabelStyle: {
            display: 'none', // ラベルを非表示
          },
          drawerItemStyle: {
            justifyContent: 'center', // アイコンを中央に配置
            paddingVertical: 16,
          },
        }}
      >
        {screenConfigs.map((screen) => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            options={{
              title: screen.title,
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name={screen.icon} size={28} color={color} /> // アイコンサイズを少し大きく
              ),
              drawerLabel: () => null, // ラベルを完全に非表示
            }}
          />
        ))}
      </Drawer.Navigator>
    );
  }

  // スマホ時は下部タブを使用
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
      {screenConfigs.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name={screen.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
