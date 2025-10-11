/**
 * Catalyze AI - Study Time Chart Component
 * 学習時間グラフコンポーネント（週間/月間切り替え可能）
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StackedBarChart, Grid } from 'react-native-svg-charts';
import { View as RNView } from 'react-native';
import * as scale from 'd3-scale';
import Svg, { Text as SvgText } from 'react-native-svg';
import { colors, spacing, textStyles } from '../theme';
import type { StudyTimeData } from '../../application/services/StatisticsService';
import { useStudyPlans } from '../../presentation/hooks/useStudyPlans';

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

  // collect all planIds present in the shown period to determine stacks
  const planIdsSet = new Set<string>();
  currentData.forEach((d) => {
    d.perPlanMinutes?.forEach((p) => planIdsSet.add(p.planId));
  });
  const planIds = Array.from(planIdsSet);

  // load plans for name lookup. use a default userId placeholder; in many screens userId is 'user-001'
  const userId = 'user-001';
  const { data: plans = [] } = useStudyPlans(userId);
  const planIdToTitle = new Map(plans.map((p: any) => [p.id, p.title]));

  // palette (matches StatisticsService)
  const palette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  // build data arrays: each plan corresponds to an array of values (hours)
  const series = planIds.length > 0
    ? planIds.map((pid) => {
        return currentData.map((d) => {
          const map = new Map(d.perPlanMinutes?.map((p) => [p.planId, p.minutes]) || []);
          const minutes = map.get(pid) || 0;
          return Math.round((minutes / 60) * 10) / 10;
        });
      })
    : [
        // fallback single series from total minutes
        currentData.map((d) => Math.round((d.minutes / 60) * 10) / 10),
      ];

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

  const contentInset = { top: 10, bottom: 10 };

  // compute max total hours for the Y axis and choose a readable tick step
  const maxTotalHours = Math.max(
    0,
    ...currentData.map((d) => {
      const planSum = d.perPlanMinutes?.reduce((s, p) => s + p.minutes, 0);
      const totalMinutes = typeof planSum === 'number' ? planSum : d.minutes;
      return totalMinutes / 60;
    })
  );

  const computeStep = (maxH: number) => {
    if (maxH <= 1) return 0.25; // 15 minutes
    if (maxH <= 3) return 0.5; // 30 minutes
    if (maxH <= 6) return 1; // 1 hour
    if (maxH <= 12) return 1; // 1 hour
    return Math.ceil(maxH / 6); // spread into ~6 steps for large ranges
  };

  const step = computeStep(maxTotalHours);
  const maxTick = Math.ceil((maxTotalHours || 0) / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= maxTick + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }

  const formatHourLabel = (value: number) => {
    const minutes = Math.round(value * 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
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

  // layout adjustments for custom Y axis column
  const leftYAxisWidth = 44; // px reserved for Y axis labels
  const chartHeight = 180;
  const adjustedChartWidth = Math.max(120, chartWidth - leftYAxisWidth);
  const innerChartHeight = Math.max(4, chartHeight - contentInset.top - contentInset.bottom);

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
      <View style={{ ...styles.chart, marginLeft: -6, marginRight: 4, paddingBottom: 12 }}>
        <RNView style={{ height: 220, flexDirection: 'column' }}>
          <RNView style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Y axis labels column */}
            <Svg width={leftYAxisWidth} height={chartHeight}>
              {(() => {
                try {
                  if (ticks.length === 0) return null;
                  const maxV = ticks[ticks.length - 1] || 0;
                  return ticks.map((t, i) => {
                    // map value to y coordinate inside chart
                    const y = maxV === 0
                      ? contentInset.top + innerChartHeight
                      : contentInset.top + ((maxV - t) / (maxV || 1)) * innerChartHeight;
                    return (
                      <SvgText
                        key={`y-${i}`}
                        x={leftYAxisWidth - 6}
                        y={y + 4} // small vertical offset to better align with bars
                        fontSize={11}
                        fill="#6B7280"
                        textAnchor="end"
                      >
                        {formatHourLabel(t)}
                      </SvgText>
                    );
                  });
                } catch (e) {
                  return null;
                }
              })()}
            </Svg>

            <StackedBarChart
              style={{ height: chartHeight, width: adjustedChartWidth }}
            keys={planIds.length > 0 ? planIds : ['total']}
            colors={planIds.length > 0 ? planIds.map((_, i) => palette[i % palette.length]) : [palette[0]]}
            data={currentData.map((d) => {
              const map = new Map(d.perPlanMinutes?.map((p) => [p.planId, Math.round((p.minutes / 60) * 10) / 10]) || []);
              const obj: Record<string, number> = {};
              if (planIds.length > 0) {
                planIds.forEach((pid) => { obj[pid] = map.get(pid) || 0; });
              } else {
                obj['total'] = Math.round((d.minutes / 60) * 10) / 10;
              }
              return obj;
            })}
            contentInset={{ top: 10, bottom: 10 }}
            horizontal={false}
            showGrid={false}
            spacingInner={0.6}
            spacingOuter={0.2}
            animate={{ duration: 300 }}
            svg={{ rx: 6 }}
          >
            <Grid />
          </StackedBarChart>

          </RNView>

          {/* Custom X-axis labels: staggered to prevent overlap */}
          <Svg width={adjustedChartWidth} height={40} style={{ marginTop: 8, marginLeft: leftYAxisWidth }}>
            {(() => {
              try {
                const xScale = scale.scaleBand().domain(labels).range([12, Math.max(12, chartWidth - 12)]).padding(0.2 as any);
                return labels.map((lbl, i) => {
                  const band = xScale.bandwidth ? xScale.bandwidth() : (chartWidth / Math.max(1, labels.length));
                    const x = (xScale(lbl) || 0) + band / 2;
                    // If few labels (weekly view) show all. Otherwise decide interval to avoid overlap; always show first and last
                    if (labels.length <= 7) {
                      // show all labels for weekly data
                    } else {
                      const approxLabelWidth = 48;
                      const maxLabels = Math.max(1, Math.floor(chartWidth / approxLabelWidth));
                      const interval = Math.max(1, Math.ceil(labels.length / maxLabels));
                      if (!(i === 0 || i === labels.length - 1 || i % interval === 0)) return null;
                    }
                    const y = 18; // single horizontal line
                    return (
                      <SvgText
                        key={`lbl-${i}`}
                        x={x}
                        y={y}
                        fontSize={10}
                        fill="#6B7280"
                        textAnchor="middle"
                      >
                        {lbl}
                      </SvgText>
                    );
                });
              } catch (e) {
                return null;
              }
            })()}
          </Svg>
        </RNView>

        {/* 凡例（簡易表示）*/}
        <View style={styles.legendContainer}>
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {(planIds.length > 0 ? planIds : ['Total']).map((pid, i) => {
              const title = planIdToTitle.get(pid) || (pid === 'Total' ? '合計' : pid);
              const short = typeof title === 'string' && title.length > 20 ? title.slice(0, 17) + '…' : title;
              return (
                <View key={pid} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: palette[i % palette.length], marginRight: 6, borderRadius: 2 }} />
                  <Text style={{ ...textStyles.bodySmall, color: colors.textSecondary }}>{short}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 合計表示 */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {period === 'weekly' ? '今週の合計' : '今月の合計'}
        </Text>
        <Text style={styles.summaryValue}>
          {(() => {
            const totalMinutes: number = currentData.reduce((sum, d) => sum + d.minutes, 0);
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
            return `${totalHours} 時間`;
          })()}
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
  legendContainer: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
