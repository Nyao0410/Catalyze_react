/**
 * StudyNext - Stats Screen
 * 統計画面 - 学習データの可視化
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import { t } from '../../locales';
import {
  StudyTimeChart,
  PlanBreakdownChart,
  StudyStreak,
  OptimalStudyTime,
  StudyHeatmap,
} from '../components';
import {
  useWeeklyStudyTime,
  useMonthlyStudyTime,
  useWeeklyPlanBreakdown,
  useMonthlyPlanBreakdown,
  useStudyStreak,
  useOptimalStudyTime,
  useHeatmapData,
} from '../hooks/useStats';
import { getCurrentUserId } from '../../infrastructure/auth';

type Props = MainTabScreenProps<'Stats'>;

export const StatsScreen: React.FC<Props> = () => {
  // 現在のユーザー UID を取得（Firebase Auth または fallback）
  const userId = getCurrentUserId();

  // データ取得
  const { data: weeklyTime, isLoading: loadingWeekly, refetch: refetchWeekly } = useWeeklyStudyTime(userId);
  const { data: monthlyTime, isLoading: loadingMonthly, refetch: refetchMonthly } = useMonthlyStudyTime(userId);
  const { data: weeklyBreakdown, isLoading: loadingWeeklyBreakdown, refetch: refetchWeeklyBreakdown } = useWeeklyPlanBreakdown(userId);
  const { data: monthlyBreakdown, isLoading: loadingMonthlyBreakdown, refetch: refetchMonthlyBreakdown } = useMonthlyPlanBreakdown(userId);
  const { data: streak, isLoading: loadingStreak, refetch: refetchStreak } = useStudyStreak(userId);
  const { data: optimalTime, isLoading: loadingOptimal, refetch: refetchOptimal } = useOptimalStudyTime(userId);
  const { data: heatmap, isLoading: loadingHeatmap, refetch: refetchHeatmap } = useHeatmapData(userId);

  const isLoading =
    loadingWeekly ||
    loadingMonthly ||
    loadingWeeklyBreakdown ||
    loadingMonthlyBreakdown ||
    loadingStreak ||
    loadingOptimal ||
    loadingHeatmap;

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchWeekly(),
      refetchMonthly(),
      refetchWeeklyBreakdown(),
      refetchMonthlyBreakdown(),
      refetchStreak(),
      refetchOptimal(),
      refetchHeatmap(),
    ]);
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>学習統計</Text>
        <Text style={styles.headerSubtitle}>あなたの学習パターンを可視化</Text>
      </View>

      {/* 学習時間グラフ */}
      {weeklyTime && monthlyTime && (
        <StudyTimeChart weeklyData={weeklyTime} monthlyData={monthlyTime} />
      )}

      {/* 学習項目内訳 */}
      {weeklyBreakdown && monthlyBreakdown && (
        <PlanBreakdownChart
          weeklyData={weeklyBreakdown}
          monthlyData={monthlyBreakdown}
        />
      )}

      {/* 学習ストリーク */}
      {streak && <StudyStreak data={streak} />}

      {/* 最適学習時間帯 */}
      {optimalTime && <OptimalStudyTime data={optimalTime} />}

      {/* 学習ヒートマップ */}
      {heatmap && <StudyHeatmap data={heatmap} />}

      {/* 下部余白 */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
