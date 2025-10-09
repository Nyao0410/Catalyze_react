/**
 * StudyNext - Plan Breakdown Chart Component
 * 学習項目内訳円グラフコンポーネント
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { colors, spacing, textStyles } from '../theme';
import type { PlanBreakdown } from '../../application/services/StatisticsService';

interface PlanBreakdownChartProps {
  weeklyData: PlanBreakdown[];
  monthlyData: PlanBreakdown[];
}

type PeriodType = 'weekly' | 'monthly';

export const PlanBreakdownChart: React.FC<PlanBreakdownChartProps> = ({
  weeklyData,
  monthlyData,
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const screenWidth = Dimensions.get('window').width;

  const currentData = period === 'weekly' ? weeklyData : monthlyData;

  // 円グラフ用のデータ形式に変換
  const chartData = currentData.map((item) => ({
    name: item.planTitle,
    population: item.totalMinutes,
    color: item.color,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  };

  // 合計時間
  const totalMinutes = currentData.reduce((sum, item) => sum + item.totalMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>学習項目の内訳</Text>
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}
            onPress={() => setPeriod('weekly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'weekly' && styles.periodButtonTextActive,
              ]}
            >
              週間
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'monthly' && styles.periodButtonTextActive,
              ]}
            >
              月間
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* データがない場合 */}
      {chartData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {period === 'weekly' ? '今週' : '今月'}の学習記録がありません
          </Text>
        </View>
      ) : (
        <>
          {/* 円グラフ */}
          <PieChart
            data={chartData}
            width={screenWidth - spacing.lg * 2}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />

          {/* 詳細リスト */}
          <View style={styles.detailList}>
            {currentData.map((item) => (
              <View key={item.planId} style={styles.detailItem}>
                <View style={styles.detailLeft}>
                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                  <Text style={styles.detailTitle} numberOfLines={1}>
                    {item.planTitle}
                  </Text>
                </View>
                <View style={styles.detailRight}>
                  <Text style={styles.detailPercentage}>{item.percentage}%</Text>
                  <Text style={styles.detailTime}>
                    {Math.round((item.totalMinutes / 60) * 10) / 10}h
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 合計 */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>合計学習時間</Text>
            <Text style={styles.summaryValue}>{totalHours} 時間</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.text,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.textInverse,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  detailList: {
    marginTop: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  detailTitle: {
    ...textStyles.body,
    color: colors.text,
    flex: 1,
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailPercentage: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  detailTime: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    ...textStyles.h3,
    color: colors.primary,
  },
});
