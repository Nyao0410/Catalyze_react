/**
 * Catalyze AI - Study Time Chart Component
 * 学習時間グラフコンポーネント（週間/月間切り替え可能）- 再構築版
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Svg, { G, Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { getColorForPlan } from '../utils/planPalette';
import type { StudyTimeData } from '../../application/services/StatisticsService';
import { useStudyPlans } from '../../presentation/hooks/useStudyPlans';
import { useCurrentUserId } from '../hooks/useAuth';

interface StudyTimeChartProps {
  weeklyData: StudyTimeData[];
  monthlyData: StudyTimeData[];
}

type PeriodType = 'weekly' | 'monthly';

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 20, bottom: 30, left: 50, right: 20 };

export const StudyTimeChart: React.FC<StudyTimeChartProps> = ({
  weeklyData,
  monthlyData,
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - CHART_PADDING.left - CHART_PADDING.right;
  const { colors } = useTheme();
  const fadeAnim = useState(new Animated.Value(0))[0];

  const currentData = period === 'weekly' ? weeklyData : monthlyData;
  const labels = currentData.map((d) => d.label);

  // collect all planIds present in the shown period to determine stacks
  const planIdsSet = new Set<string>();
  currentData.forEach((d) => {
    d.perPlanMinutes?.forEach((p) => planIdsSet.add(p.planId));
  });
  const planIds = Array.from(planIdsSet);

  // 実際のユーザーIDを取得（未ログイン時でもローカルIDが返される）
  const { userId: currentUserId, isLoading: isLoadingUserId } = useCurrentUserId();
  const userId = currentUserId === 'error' ? 'local-default' : (isLoadingUserId ? 'loading' : currentUserId);
  const effectiveUserId = (userId === 'loading' || userId === 'error') ? '' : userId;
  const { data: plans = [] } = useStudyPlans(effectiveUserId);
  const planIdToTitle = new Map(plans.map((p: any) => [p.id, p.title]));

  // build data arrays: each plan corresponds to an array of values (hours)
  const series = planIds.length > 0
    ? planIds.map((pid) => {
        return currentData.map((d) => {
          const map = new Map(d.perPlanMinutes?.map((p) => [p.planId, p.minutes]) || []);
          const minutes = map.get(pid) || 0;
          return minutes / 60;
        });
      })
    : [
        currentData.map((d) => d.minutes / 60),
      ];

  // compute max total hours for the Y axis
  const maxTotalHours = Math.max(
    0.1,
    ...currentData.map((d) => {
      const planSum = d.perPlanMinutes?.reduce((s, p) => s + p.minutes, 0);
      const totalMinutes = typeof planSum === 'number' ? planSum : d.minutes;
      return totalMinutes / 60;
    })
  );

  const computeStep = (maxH: number) => {
    if (maxH <= 1) return 0.25;
    if (maxH <= 3) return 0.5;
    if (maxH <= 6) return 1;
    if (maxH <= 12) return 2;
    return Math.ceil(maxH / 6);
  };

  const step = computeStep(maxTotalHours);
  const maxTick = Math.ceil(maxTotalHours / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= maxTick + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }

  const formatHourLabel = (value: number) => {
    if (value === 0) return '0';
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    if (h === 0) return `${m}分`;
    if (m === 0) return `${h}h`;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const barWidth = chartWidth / (labels.length * 1.5);
  const barSpacing = barWidth * 0.5;
  const availableWidth = labels.length * (barWidth + barSpacing) - barSpacing;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [period]);

  const scaleY = (value: number) => {
    if (maxTick === 0) return CHART_HEIGHT - CHART_PADDING.bottom;
    return (
      CHART_HEIGHT -
      CHART_PADDING.bottom -
      (value / maxTick) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
    );
  };

  const scaleX = (index: number) => {
    return (index * (barWidth + barSpacing)) + barWidth / 2;
  };

  // 合計時間を計算
  const totalMinutes = currentData.reduce((sum, d) => {
    const planSum = d.perPlanMinutes?.reduce((s, p) => s + p.minutes, 0);
    return sum + (typeof planSum === 'number' ? planSum : d.minutes);
  }, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>学習時間</Text>
        <View style={[styles.periodToggle, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'weekly' && [styles.periodButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setPeriod('weekly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: period === 'weekly' ? colors.textInverse : colors.textSecondary },
              ]}
            >
              週間
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === 'monthly' && [styles.periodButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setPeriod('monthly')}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: period === 'monthly' ? colors.textInverse : colors.textSecondary },
              ]}
            >
              月間
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* グラフ */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth + CHART_PADDING.left + CHART_PADDING.right} height={CHART_HEIGHT}>
          <G>
            {/* Y軸グリッドライン */}
            {ticks.map((tick, i) => {
              const y = scaleY(tick);
              return (
                <Line
                  key={`grid-${i}`}
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={chartWidth + CHART_PADDING.left}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              );
            })}

            {/* Y軸ラベル */}
            {ticks.map((tick, i) => {
              const y = scaleY(tick);
              return (
                <SvgText
                  key={`y-label-${i}`}
                  x={CHART_PADDING.left - 10}
                  y={y + 4}
                  fontSize={11}
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {formatHourLabel(tick)}
                </SvgText>
              );
            })}

            {/* 積み上げ棒グラフ */}
            {currentData.map((d, dataIndex) => {
              let yOffset = scaleY(0);
              const x = CHART_PADDING.left + scaleX(dataIndex) - barWidth / 2;

              // 各計画ごとの積み上げ
              const stackedRects = [];
              if (planIds.length > 0) {
                planIds.forEach((pid, planIndex) => {
                  const map = new Map(d.perPlanMinutes?.map((p) => [p.planId, p.minutes]) || []);
                  const minutes = map.get(pid) || 0;
                  const hours = minutes / 60;
                  if (hours > 0) {
                    const height = (hours / maxTick) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
                    const y = yOffset - height;
                    stackedRects.push({
                      y,
                      height,
                      color: getColorForPlan(pid),
                    });
                    yOffset = y;
                  }
                });
              } else {
                const totalMinutes = d.minutes;
                const hours = totalMinutes / 60;
                if (hours > 0) {
                  const height = (hours / maxTick) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
                  const y = yOffset - height;
                  stackedRects.push({
                    y,
                    height,
                    color: getColorForPlan('total'),
                  });
                }
              }

              return stackedRects.map((rect, rectIndex) => (
                <Rect
                  key={`bar-${dataIndex}-${rectIndex}`}
                  x={x}
                  y={rect.y}
                  width={barWidth}
                  height={rect.height}
                  fill={rect.color}
                  rx={6}
                  ry={6}
                />
              ));
            })}

            {/* X軸ラベル */}
            {labels.map((label, index) => {
              const x = CHART_PADDING.left + scaleX(index);
              // 週間は全て表示、月間は間引く
              if (period === 'monthly' && labels.length > 10) {
                const interval = Math.ceil(labels.length / 10);
                if (index !== 0 && index !== labels.length - 1 && index % interval !== 0) {
                  return null;
                }
              }
              return (
                <SvgText
                  key={`x-label-${index}`}
                  x={x}
                  y={CHART_HEIGHT - CHART_PADDING.bottom + 20}
                  fontSize={10}
                  fill={colors.textSecondary}
                  textAnchor="middle"
                  rotation={period === 'monthly' ? -45 : 0}
                  originX={x}
                  originY={CHART_HEIGHT - CHART_PADDING.bottom + 20}
                >
                  {label.length > 6 ? `${label.slice(0, 5)}...` : label}
                </SvgText>
              );
            })}
          </G>
        </Svg>

        {/* 凡例 */}
        {(planIds.length > 0 ? planIds : ['Total']).length > 1 && (
          <View style={styles.legendContainer}>
            {(planIds.length > 0 ? planIds : ['Total']).map((pid) => {
              const title = planIdToTitle.get(pid) || (pid === 'Total' ? '合計' : pid);
              const short = typeof title === 'string' && title.length > 15 ? `${title.slice(0, 12)}...` : title;
              return (
                <View key={pid} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: getColorForPlan(pid) }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {short}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 合計表示 */}
      <View style={[styles.summary, { borderTopColor: colors.border }]}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          {period === 'weekly' ? '今週の合計' : '今月の合計'}
        </Text>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>
          {totalHours} 時間
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: defaultColors.card,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h2,
    color: defaultColors.text,
    fontWeight: '700',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: defaultColors.background,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  periodButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: defaultColors.primary,
  },
  periodButtonText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  chartContainer: {
    marginVertical: spacing.sm,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    ...textStyles.bodySmall,
    fontSize: 11,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  summaryLabel: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    ...textStyles.h2,
    color: defaultColors.primary,
    fontWeight: '700',
  },
});
