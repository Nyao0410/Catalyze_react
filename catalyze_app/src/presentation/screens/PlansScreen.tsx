/**
 * StudyNext - Plans Screen
 * 学習計画一覧画面
 */

import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlanStatus } from 'catalyze-ai';
import { spacing, textStyles, colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { Button, PlanCard, EmptyState } from '../components';
import { PlanDetailScreen } from './PlanDetailScreen';
import { useStudyPlans, useUserSessions } from '../hooks';
import type { MainTabScreenProps } from '../navigation/types';
import { t } from '../../locales';

type Props = MainTabScreenProps<'Plans'>;

type FilterType = 'all' | 'active' | 'completed';

export const PlansScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<FilterType>('active');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // 仮のユーザーID（本来は認証から取得）
  const userId = 'user-001';
  
  // 学習計画を取得
  const { data: plans = [], isLoading, refetch, isRefetching } = useStudyPlans(userId);
  // ユーザーの全セッションを取得してプラン毎に集計
  const { data: userSessions = [] } = useUserSessions(userId as any);

  const { isTablet, colors } = useTheme();

  // フィルタリング
  const filteredPlans = plans.filter((plan) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return plan.status === PlanStatus.ACTIVE || plan.status === PlanStatus.COMPLETED_TODAY;
    }
    if (filter === 'completed') {
      return plan.status === PlanStatus.COMPLETED;
    }
    return true;
  });

  // プラン作成ボタン
  const handleCreatePlan = () => {
    navigation.navigate('CreatePlan');
  };

  // ヘッダー右に作成ボタンを追加（常に表示）
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleCreatePlan} style={{ paddingRight: spacing.md }}>
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 動的スタイル（テーマ対応） - FilterButtonより前に定義
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    centerContainer: [styles.centerContainer, { backgroundColor: colors.background }],
    filterContainer: [styles.filterContainer, { borderBottomColor: colors.border }],
    filterButton: [styles.filterButton, { backgroundColor: colors.backgroundSecondary }],
    filterButtonActive: [styles.filterButtonActive, { backgroundColor: colors.primary }],
    filterButtonText: [styles.filterButtonText, { color: colors.textSecondary }],
    filterButtonTextActive: [styles.filterButtonTextActive, { color: colors.textInverse }],
    fab: [styles.fab, { backgroundColor: colors.primary, shadowColor: colors.cardShadow }],
    splitContainer: [styles.splitContainer, { backgroundColor: colors.background }],
    leftPane: [styles.leftPane, { borderRightColor: colors.border, backgroundColor: colors.background }],
    rightPane: [styles.rightPane, { backgroundColor: colors.background }],
  };

  // プラン詳細へ遷移
  const handlePlanPress = (planId: string) => {
    if (isTablet) {
      setSelectedPlanId(planId);
    } else {
      navigation.navigate('PlanDetail', { planId });
    }
  };

  // フィルターボタン
  const FilterButton: React.FC<{
    type: FilterType;
    label: string;
    count: number;
  }> = ({ type, label, count }) => {
    const isActive = filter === type;
    return (
      <TouchableOpacity
        style={[dynamicStyles.filterButton, isActive && dynamicStyles.filterButtonActive]}
        onPress={() => setFilter(type)}
      >
        <Text style={[dynamicStyles.filterButtonText, isActive && dynamicStyles.filterButtonTextActive]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  // カウント計算
  const activeCount = plans.filter(
    (p) => p.status === PlanStatus.ACTIVE || p.status === PlanStatus.COMPLETED_TODAY
  ).length;
  const completedCount = plans.filter((p) => p.status === PlanStatus.COMPLETED).length;

  // sessions をプランごとに集計して完了単元数を求める
  // useStudySessions の既存フックは planId を必須にしているため、
  // 上では空の呼び出しをしているが、プロダクションコードでは useUserSessions を使う方が望ましい。
  // ここでは簡易的に userSessions が配列として返る前提で集計する。
  const completedUnitsByPlan: Record<string, number> = {};
  if (Array.isArray(userSessions)) {
    userSessions.forEach((s: any) => {
      if (!s || !s.planId) return;
      completedUnitsByPlan[s.planId] = (completedUnitsByPlan[s.planId] || 0) + (s.unitsCompleted || 0);
    });
  }

  // Ensure a selected plan on tablet
  useEffect(() => {
    if (isTablet) {
      if (filteredPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(filteredPlans[0].id);
      }
    } else {
      // Clear selection on non-tablet
      setSelectedPlanId(null);
    }
  }, [isTablet, filteredPlans.map((p) => p.id).join(',' )]);

  // ...existing code...

  if (isLoading) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* フィルター */}
      <View style={dynamicStyles.filterContainer}>
        <FilterButton type="all" label={t('plans.filter.all')} count={plans.length} />
        <FilterButton type="active" label={t('plans.filter.active')} count={activeCount} />
        <FilterButton type="completed" label={t('plans.filter.completed')} count={completedCount} />
      </View>

      {/* プラン一覧 */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t('plans.empty.title')}
          description={t('plans.empty.description')}
          action={
            filter === 'all' && (
              <Button
                title={t('plans.empty.action')}
                variant="primary"
                onPress={handleCreatePlan}
                style={styles.createButton}
              />
            )
          }
        />
      ) : isTablet ? (
        // Split view: left list + right detail
        <View style={dynamicStyles.splitContainer}>
          <View style={dynamicStyles.leftPane}>
            <FlatList
              data={filteredPlans}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.listItem, selectedPlanId === item.id && styles.listItemSelected]}>
                    <PlanCard
                      plan={item}
                      completedUnits={completedUnitsByPlan[item.id] || 0}
                      onPress={() => handlePlanPress(item.id)}
                    />
                </View>
              )}
              contentContainerStyle={styles.leftListContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
            />
          </View>

          <View style={dynamicStyles.rightPane}>
            {selectedPlanId ? (
              // Render inline PlanDetailScreen by passing route and navigation props
              <PlanDetailScreen
                route={{ params: { planId: selectedPlanId } } as any}
                navigation={navigation as any}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={textStyles.h3}>プランを選択してください</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              completedUnits={completedUnitsByPlan[item.id] || 0}
              onPress={() => handlePlanPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* フローティングアクションボタン（常に表示） */}
      <TouchableOpacity style={dynamicStyles.fab} onPress={handleCreatePlan}>
        <Ionicons name="add" size={32} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: defaultColors.backgroundSecondary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: defaultColors.primary,
  },
  filterButtonText: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: defaultColors.textInverse,
  },
  listContent: {
    padding: spacing.md,
  },
  createButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: defaultColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: defaultColors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Tablet grid
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.md,
    maxWidth: '48%',
  },
  // Split view styles
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: defaultColors.border,
    backgroundColor: defaultColors.background,
  },
  rightPane: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  leftListContent: {
    padding: spacing.md,
  },
  listItem: {
    marginBottom: spacing.sm,
  },
  listItemSelected: {
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
