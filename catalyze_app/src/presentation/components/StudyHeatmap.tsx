/**
 * StudyNext - Study Heatmap Component
 * 学習ヒートマップコンポーネント（GitHub風）
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import type { HeatmapDay } from '../../application/services/StatisticsService';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';

interface StudyHeatmapProps {
  data: HeatmapDay[];
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ data }) => {
  // レベルごとの色
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return colors.progressTrack;
      case 1:
        return '#C7D2FE';
      case 2:
        return '#A5B4FC';
      case 3:
        return '#818CF8';
      case 4:
        return colors.primary;
      default:
        return colors.progressTrack;
    }
  };

  // データを週ごとにグループ化
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 曜日ラベル
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 月のラベルを計算（簡易版）
  const monthLabels: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (11 - i));
    monthLabels.push(format(date, 'M月', { locale: ja }));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>学習ヒートマップ</Text>
      <Text style={styles.subtitle}>過去1年間の学習記録</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.heatmapContainer}>
          {/* 曜日ラベル */}
          <View style={styles.dayLabels}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* ヒートマップグリッド */}
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.column}>
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.cell,
                      { backgroundColor: getLevelColor(day.level) },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>少ない</Text>
        <View style={styles.legendColors}>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[styles.legendCell, { backgroundColor: getLevelColor(level) }]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>多い</Text>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scrollView: {
    marginBottom: spacing.md,
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: spacing.xs,
    justifyContent: 'space-around',
  },
  dayLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontSize: 10,
    height: 12,
    lineHeight: 12,
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    gap: 2,
  },
  column: {
    gap: 2,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  legendLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontSize: 10,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
