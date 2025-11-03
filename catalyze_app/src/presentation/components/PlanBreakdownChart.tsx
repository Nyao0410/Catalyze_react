/**
 * StudyNext - Plan Breakdown Chart Component
 * 学習項目内訳円グラフコンポーネント - 再構築版
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { getColorForPlan } from '../utils/planPalette';
import type { PlanBreakdown } from '../../application/services/StatisticsService';

interface PlanBreakdownChartProps {
  weeklyData: PlanBreakdown[];
  monthlyData: PlanBreakdown[];
}

type PeriodType = 'weekly' | 'monthly';

const CHART_SIZE = 200;
const CHART_RADIUS = 80;
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;

export const PlanBreakdownChart: React.FC<PlanBreakdownChartProps> = ({
  weeklyData,
  monthlyData,
}) => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const screenWidth = Dimensions.get('window').width;
  const { colors } = useTheme();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  const currentData = period === 'weekly' ? weeklyData : monthlyData;

  // 合計時間
  const totalMinutes = currentData.reduce((sum, item) => sum + item.totalMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [period]);

  // 円グラフ用のデータを準備
  const chartData = currentData
    .filter((item) => item.totalMinutes > 0)
    .map((item) => ({
      ...item,
      percentage: totalMinutes > 0 ? (item.totalMinutes / totalMinutes) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // 円グラフのパスを生成
  let currentAngle = -90; // 0度から開始（12時の位置）
  const segments = chartData.map((item, index) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // 弧のパスを生成
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = CENTER_X + CHART_RADIUS * Math.cos(startAngleRad);
    const y1 = CENTER_Y + CHART_RADIUS * Math.sin(startAngleRad);
    const x2 = CENTER_X + CHART_RADIUS * Math.cos(endAngleRad);
    const y2 = CENTER_Y + CHART_RADIUS * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${CENTER_X} ${CENTER_Y}`,
      `L ${x1} ${y1}`,
      `A ${CHART_RADIUS} ${CHART_RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    // ラベルの位置を計算（セグメントの中央）
    const labelAngle = (startAngle + endAngle) / 2;
    const labelAngleRad = (labelAngle * Math.PI) / 180;
    const labelRadius = CHART_RADIUS * 0.7;
    const labelX = CENTER_X + labelRadius * Math.cos(labelAngleRad);
    const labelY = CENTER_Y + labelRadius * Math.sin(labelAngleRad);

    currentAngle = endAngle;

    return {
      ...item,
      pathData,
      labelX,
      labelY,
      color: getColorForPlan(item.planId),
    };
  });

  if (chartData.length === 0) {
    return (
      <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>学習項目の内訳</Text>
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
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {period === 'weekly' ? '今週' : '今月'}の学習記録がありません
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>学習項目の内訳</Text>
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

      {/* 円グラフ */}
      <Animated.View
        style={[
          styles.chartWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G>
            {segments.map((segment, index) => (
              <Path
                key={`segment-${index}`}
                d={segment.pathData}
                fill={segment.color}
                stroke={colors.card}
                strokeWidth={2}
              />
            ))}
            {/* 中央の円 */}
            <Circle cx={CENTER_X} cy={CENTER_Y} r={CHART_RADIUS * 0.5} fill={colors.card} />
            <SvgText
              x={CENTER_X}
              y={CENTER_Y - 8}
              fontSize={24}
              fontWeight="700"
              fill={colors.primary}
              textAnchor="middle"
            >
              {totalHours}
            </SvgText>
            <SvgText
              x={CENTER_X}
              y={CENTER_Y + 16}
              fontSize={12}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              時間
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      {/* 詳細リスト */}
      <View style={styles.detailList}>
        {currentData
          .sort((a, b) => b.totalMinutes - a.totalMinutes)
          .map((item) => {
            const percentage = totalMinutes > 0 ? ((item.totalMinutes / totalMinutes) * 100).toFixed(1) : '0';
            return (
              <View key={item.planId} style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                <View style={styles.detailLeft}>
                  <View style={[styles.colorIndicator, { backgroundColor: getColorForPlan(item.planId) }]} />
                  <Text style={[styles.detailTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.planTitle}
                  </Text>
                </View>
                <View style={styles.detailRight}>
                  <View style={styles.percentageContainer}>
                    <Text style={[styles.detailPercentage, { color: colors.textSecondary }]}>{percentage}%</Text>
                  </View>
                  <Text style={[styles.detailTime, { color: colors.text }]}>
                    {Math.round((item.totalMinutes / 60) * 10) / 10}h
                  </Text>
                </View>
              </View>
            );
          })}
      </View>

      {/* 合計 */}
      <View style={[styles.summary, { borderTopColor: colors.border }]}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>合計学習時間</Text>
        <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalHours} 時間</Text>
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
  chartWrapper: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  detailList: {
    marginTop: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.sm,
  },
  detailTitle: {
    ...textStyles.body,
    color: defaultColors.text,
    flex: 1,
    fontWeight: '500',
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  percentageContainer: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  detailPercentage: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  detailTime: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
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
