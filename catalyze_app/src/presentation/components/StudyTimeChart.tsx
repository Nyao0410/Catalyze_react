/**
 * Catalyze AI - Study Time Chart Component
 * 学習時間グラフコンポーネント（週間/月間切り替え可能）
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, spacing, textStyles } from '../theme';
import type { StudyTimeData } from '../../application/services/StatisticsService';

interface StudyTimeChartProps {
  weeklyData: StudyTimeData[];
  monthlyData: StudyTimeData[];
}

type PeriodType = 'weekly' | 'monthly';

export const StudyTimeChart: React.FC<StudyTimeChartProps> = ({
  weeklyData,
  monthlyData,
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState<number>(
    screenWidth - spacing.lg * 2
  );

  const currentData = period === 'weekly' ? weeklyData : monthlyData;
  const labels = currentData.map((d) => d.label);
  const values = currentData.map((d) => d.minutes);

  // 時間に変換（分 → 時間）
  const valuesInHours = values.map((v) => Math.round((v / 60) * 10) / 10);

  const chartData = {
    labels,
    datasets: [
      {
        data: valuesInHours.length > 0 ? valuesInHours : [0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.backgroundSecondary,
    backgroundGradientTo: colors.backgroundSecondary,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // primary color
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // text secondary
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 8, // 少し小さくしてラベルの重なりを避ける
    },
  };

  // calculate chart width: use containerWidth but shrink slightly when many bars to reduce bar width
  // start from container width but allow a small right extension so the purple
  // background area reaches closer to the right card edge. We still shrink
  // a bit when there are many bars to avoid overflowing labels.
  // give a bit more room on the right while shrinking bars more aggressively
  // so that on narrow devices (iPhone 14 Pro portrait) the last bar doesn't overflow.
  // further extend to the right so the purple background reaches the card edge on narrow screens
  // balance right extension with centered appearance
  const baseChartWidth = containerWidth + 40;
  const extraShrinkPerBar = 12; // slightly less aggressive shrink for better balance
  const minChartWidth = 120;
  const chartWidth = Math.max(
    minChartWidth,
    baseChartWidth - Math.max(0, labels.length - 1) * extraShrinkPerBar
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        // reserve small horizontal margin inside the card
        setContainerWidth(Math.max(0, w - 8));
      }}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>学習時間</Text>
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

      {/* グラフ */}
      {/* chartStyle is a single object because BarChart.style expects a ViewStyle */}
      {/** reduce left padding so y-axis labels sit closer to the card edge */}
      <BarChart
        data={chartData}
        // use computed chartWidth (shrunk for many bars) so bars don't overflow
        width={chartWidth}
        // increase height to leave space for x-axis labels so they don't get clipped
        height={180}
        chartConfig={chartConfig}
  // nudge left labels closer and allow more purple area on the right
  style={{ ...styles.chart, marginLeft: -6, marginRight: 20, paddingBottom: 12 }}
        yAxisLabel=""
        yAxisSuffix="h"
        showValuesOnTopOfBars={false}
        fromZero
      />

      {/* 合計表示 */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {period === 'weekly' ? '今週の合計' : '今月の合計'}
        </Text>
        <Text style={styles.summaryValue}>
          {Math.round((values.reduce((sum, v) => sum + v, 0) / 60) * 10) / 10} 時間
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
    // allow the chart to render a bit outside if needed and provide extra
    // right inner padding so the purple background has room
    paddingRight: spacing.lg + 28,
    overflow: 'visible',
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
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...textStyles.h3,
    color: colors.primary,
  },
});
