/**
 * StudyNext - Optimal Study Time Component
 * 最適学習時間帯表示コンポーネント - 再構築版
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { G, Rect, Text as SvgText, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { TimeOfDayStats } from '../../application/services/StatisticsService';

interface OptimalStudyTimeProps {
  data: TimeOfDayStats[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, bottom: 30, left: 10, right: 10 };
const BAR_WIDTH = 30;
const BAR_SPACING = 8;

export const OptimalStudyTime: React.FC<OptimalStudyTimeProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - CHART_PADDING.left - CHART_PADDING.right;
  const { colors } = useTheme();
  const fadeAnim = useState(new Animated.Value(0))[0];

  // 時間帯をグループ化（6時間ごと）
  const timeGroups = [
    { label: '朝\n6-12', start: 6, end: 12, icon: 'sunny' },
    { label: '昼\n12-18', start: 12, end: 18, icon: 'partly-sunny' },
    { label: '夕\n18-24', start: 18, end: 24, icon: 'moon' },
    { label: '夜\n0-6', start: 0, end: 6, icon: 'moon-outline' },
  ];

  const groupedData = timeGroups.map((group) => {
    const total = data
      .filter((d) => {
        if (group.start <= group.end) {
          return d.hour >= group.start && d.hour < group.end;
        } else {
          // 夜の時間帯 (0-6) の場合
          return d.hour >= group.start || d.hour < group.end;
        }
      })
      .reduce((sum, d) => sum + d.totalMinutes, 0);
    return Math.round((total / 60) * 10) / 10; // 時間に変換
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // データがない場合
  if (groupedData.every((d) => d === 0)) {
    return (
      <Animated.View
        style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}
      >
        <View style={styles.header}>
          <Ionicons name="time" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>最適学習時間帯</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            学習記録がまだありません
          </Text>
        </View>
      </Animated.View>
    );
  }

  // 最も学習した時間帯を特定
  const maxIndex = groupedData.reduce(
    (maxIdx, curr, idx, arr) => (curr > arr[maxIdx] ? idx : maxIdx),
    0
  );
  const optimalGroup = timeGroups[maxIndex];
  const maxValue = Math.max(...groupedData, 0.1);

  // Y軸の最大値を計算
  const maxTick = Math.ceil(maxValue * 1.2 / 2) * 2;
  const ticks = [0, maxTick / 2, maxTick];

  const scaleY = (value: number) => {
    if (maxTick === 0) return CHART_HEIGHT - CHART_PADDING.bottom;
    return (
      CHART_HEIGHT -
      CHART_PADDING.bottom -
      (value / maxTick) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom)
    );
  };

  const scaleX = (index: number) => {
    return (index * (BAR_WIDTH + BAR_SPACING)) + BAR_WIDTH / 2;
  };

  const getTimeDescription = (group: typeof timeGroups[0]) => {
    if (group.start === 6) return '朝';
    if (group.start === 12) return '昼';
    if (group.start === 18) return '夕方〜夜';
    return '深夜〜早朝';
  };

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="time" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>最適学習時間帯</Text>
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
                  {tick}h
                </SvgText>
              );
            })}

            {/* 棒グラフ */}
            {groupedData.map((value, index) => {
              const height = scaleY(0) - scaleY(value);
              const x = CHART_PADDING.left + scaleX(index) - BAR_WIDTH / 2;
              const y = scaleY(value);
              const isOptimal = index === maxIndex;

              return (
                <G key={`bar-${index}`}>
                  <Rect
                    x={x}
                    y={y}
                    width={BAR_WIDTH}
                    height={height}
                    fill={isOptimal ? colors.primary : colors.primary}
                    fillOpacity={isOptimal ? 1 : 0.6}
                    rx={8}
                    ry={8}
                  />
                  {/* 値のラベル */}
                  {value > 0 && (
                    <SvgText
                      x={CHART_PADDING.left + scaleX(index)}
                      y={y - 5}
                      fontSize={11}
                      fontWeight="600"
                      fill={colors.text}
                      textAnchor="middle"
                    >
                      {value}h
                    </SvgText>
                  )}
                  {/* X軸ラベル */}
                  <SvgText
                    x={CHART_PADDING.left + scaleX(index)}
                    y={CHART_HEIGHT - CHART_PADDING.bottom + 20}
                    fontSize={10}
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {timeGroups[index].label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </View>

      {/* 分析結果 */}
      <View style={[styles.analysisCard, { backgroundColor: colors.background }]}>
        <View style={styles.analysisHeader}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
            あなたの学習ゴールデンタイム
          </Text>
        </View>
        <Text style={[styles.analysisValue, { color: colors.primary }]}>
          {optimalGroup.label.replace('\n', ' ')} ({getTimeDescription(optimalGroup)})
        </Text>
        <Text style={[styles.analysisDescription, { color: colors.textSecondary }]}>
          この時間帯に最も多く学習しています
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
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...textStyles.h2,
    color: defaultColors.text,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  chartContainer: {
    marginVertical: spacing.sm,
  },
  analysisCard: {
    backgroundColor: defaultColors.background,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  analysisLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontWeight: '500',
  },
  analysisValue: {
    ...textStyles.h2,
    color: defaultColors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  analysisDescription: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
  },
});
