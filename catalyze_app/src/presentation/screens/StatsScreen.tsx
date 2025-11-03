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
import { spacing, textStyles, colors as defaultColors } from '../theme';
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
import { useCurrentUserId } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeProvider';

type Props = MainTabScreenProps<'Stats'>;

export const StatsScreen: React.FC<Props> = () => {
  const { colors } = useTheme();
  
  // 現在のユーザー UID を取得（Firebase Auth または fallback）
  const { userId: currentUserId, isLoading: isLoadingUserId } = useCurrentUserId();
  
  // userIdが'loading'や'error'の場合は空文字列を渡してクエリを無効化
  // ただし、getCurrentUserId()は未ログイン時でもローカルIDを返すため、通常は有効なIDが入る
  const effectiveUserId = (isLoadingUserId || !currentUserId || currentUserId === 'loading' || currentUserId === 'error') 
    ? '' 
    : currentUserId;

  // データ取得（effectiveUserIdを使用）
  const { data: weeklyTime, isLoading: loadingWeekly, refetch: refetchWeekly } = useWeeklyStudyTime(effectiveUserId);
  const { data: monthlyTime, isLoading: loadingMonthly, refetch: refetchMonthly } = useMonthlyStudyTime(effectiveUserId);
  const { data: weeklyBreakdown, isLoading: loadingWeeklyBreakdown, refetch: refetchWeeklyBreakdown } = useWeeklyPlanBreakdown(effectiveUserId);
  const { data: monthlyBreakdown, isLoading: loadingMonthlyBreakdown, refetch: refetchMonthlyBreakdown } = useMonthlyPlanBreakdown(effectiveUserId);
  const { data: streak, isLoading: loadingStreak, refetch: refetchStreak } = useStudyStreak(effectiveUserId);
  const { data: optimalTime, isLoading: loadingOptimal, refetch: refetchOptimal } = useOptimalStudyTime(effectiveUserId);
  const { data: heatmap, isLoading: loadingHeatmap, refetch: refetchHeatmap } = useHeatmapData(effectiveUserId);

  // ユーザーIDの読み込み中またはデータ取得中の場合はローディング表示
  const isLoading =
    isLoadingUserId ||
    loadingWeekly ||
    loadingMonthly ||
    loadingWeeklyBreakdown ||
    loadingMonthlyBreakdown ||
    loadingStreak ||
    loadingOptimal ||
    loadingHeatmap;
  
  // デバッグ: セッションデータを確認
  React.useEffect(() => {
    if (__DEV__ && !isLoadingUserId && effectiveUserId) {
      console.log('[StatsScreen] User ID loaded:', {
        currentUserId,
        effectiveUserId,
        isLoadingUserId,
      });
    }
  }, [currentUserId, effectiveUserId, isLoadingUserId]);

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

  // 動的スタイル（テーマ対応）
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    centerContainer: [styles.centerContainer, { backgroundColor: colors.background }],
    header: [styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    headerTitle: [styles.headerTitle, { color: colors.text }],
    headerSubtitle: [styles.headerSubtitle, { color: colors.textSecondary }],
  };

  // ユーザーIDが読み込まれていない、またはエラーの場合
  if (isLoadingUserId || !currentUserId || currentUserId === 'loading' || currentUserId === 'error') {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        {currentUserId === 'error' && (
          <Text style={[textStyles.body, { color: colors.error, marginTop: spacing.md }]}>
            ユーザー情報の読み込みに失敗しました
          </Text>
        )}
      </View>
    );
  }

  // データ取得中の場合はローディング表示
  if (isLoading) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      style={dynamicStyles.container}
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
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>学習統計</Text>
        <Text style={dynamicStyles.headerSubtitle}>あなたの学習パターンを可視化</Text>
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
    backgroundColor: defaultColors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultColors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultColors.card,
    borderRadius: 12,
  },
  headerTitle: {
    ...textStyles.h1,
    color: defaultColors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
