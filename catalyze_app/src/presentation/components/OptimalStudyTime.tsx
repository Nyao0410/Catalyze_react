/**
 * StudyNext - Optimal Study Time Component
 * 最適学習時間帯表示コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, spacing, textStyles } from '../theme';
import type { TimeOfDayStats } from '../../application/services/StatisticsService';

interface OptimalStudyTimeProps {
  data: TimeOfDayStats[];
}

export const OptimalStudyTime: React.FC<OptimalStudyTimeProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;

  // データがない場合
  if (data.every((d) => d.totalMinutes === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>最適学習時間帯</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>学習記録がまだありません</Text>
        </View>
      </View>
    );
  }

  // 最も学習した時間帯を特定
  const maxIndex = data.reduce(
    (maxIdx, curr, idx, arr) => (curr.totalMinutes > arr[maxIdx].totalMinutes ? idx : maxIdx),
    0
  );
  const optimalHour = data[maxIndex].hour;

  // 時間帯をグループ化（6時間ごと）
  const timeGroups = [
    { label: '朝\n6-12', start: 6, end: 12 },
    { label: '昼\n12-18', start: 12, end: 18 },
    { label: '夕\n18-24', start: 18, end: 24 },
    { label: '夜\n0-6', start: 0, end: 6 },
  ];

  const groupedData = timeGroups.map((group) => {
    const total = data
      .filter((d) => d.hour >= group.start && d.hour < group.end)
      .reduce((sum, d) => sum + d.totalMinutes, 0);
    return Math.round((total / 60) * 10) / 10; // 時間に変換
  });

  const chartData = {
    labels: timeGroups.map((g) => g.label),
    datasets: [
      {
        data: groupedData.length > 0 && groupedData.some((v) => v > 0) ? groupedData : [0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.backgroundSecondary,
    backgroundGradientTo: colors.backgroundSecondary,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
    },
  };

  // 時間帯の説明
  const getTimeDescription = (hour: number) => {
    if (hour >= 6 && hour < 12) return '朝';
    if (hour >= 12 && hour < 18) return '昼';
    if (hour >= 18 && hour < 24) return '夕方〜夜';
    return '深夜〜早朝';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>最適学習時間帯</Text>

      {/* グラフ */}
      <BarChart
        data={chartData}
        width={screenWidth - spacing.lg * 2}
        height={200}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix="h"
        showValuesOnTopOfBars
        fromZero
      />

      {/* 分析結果 */}
      <View style={styles.analysisCard}>
        <Text style={styles.analysisLabel}>あなたの学習ゴールデンタイム</Text>
        <Text style={styles.analysisValue}>
          {optimalHour}:00 頃 ({getTimeDescription(optimalHour)})
        </Text>
        <Text style={styles.analysisDescription}>
          この時間帯に最も多く学習しています
        </Text>
      </View>
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
  title: {
    ...textStyles.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  analysisCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  analysisLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  analysisValue: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  analysisDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
});
