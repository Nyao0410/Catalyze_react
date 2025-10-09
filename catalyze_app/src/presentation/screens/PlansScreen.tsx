/**
 * StudyNext - Plans Screen
 * 学習計画一覧画面
 */

import React, { useState, useLayoutEffect } from 'react';
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
import { colors, spacing, textStyles } from '../theme';
import { Button, PlanCard, EmptyState } from '../components';
import { useStudyPlans } from '../hooks';
import type { MainTabScreenProps } from '../navigation/types';
import { t } from '../../locales';

type Props = MainTabScreenProps<'Plans'>;

type FilterType = 'all' | 'active' | 'completed';

export const PlansScreen: React.FC<Props> = ({ navigation }) => {
  const [filter, setFilter] = useState<FilterType>('active');
  
  // 仮のユーザーID（本来は認証から取得）
  const userId = 'user-001';
  
  // 学習計画を取得
  const { data: plans = [], isLoading, refetch, isRefetching } = useStudyPlans(userId);

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

  // プラン詳細へ遷移
  const handlePlanPress = (planId: string) => {
    navigation.navigate('PlanDetail', { planId });
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
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilter(type)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
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

  // ...existing code...

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* フィルター */}
      <View style={styles.filterContainer}>
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
      ) : (
        <FlatList
          data={filteredPlans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              completedUnits={0} // TODO: セッションデータから計算
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
      <TouchableOpacity style={styles.fab} onPress={handleCreatePlan}>
        <Ionicons name="add" size={32} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.textInverse,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
