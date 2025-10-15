/**
 * StudyNext - Study Heatmap Component
 * 学習ヒートマップコンポーネント（GitHub風）
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { HeatmapDay } from '../../application/services/StatisticsService';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface StudyHeatmapProps {
  data: HeatmapDay[];
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ data }) => {
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const { colors } = useTheme();

  const goPrevQuarter = () => {
    const d = new Date(anchorDate);
    d.setMonth(d.getMonth() - 3);
    setAnchorDate(d);
  };

  const goNextQuarter = () => {
    const d = new Date(anchorDate);
    d.setMonth(d.getMonth() + 3);
    setAnchorDate(d);
  };
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

  // 今月のカレンダー範囲（先頭週の日曜〜最終週の土曜）でグリッドを作成
  const now = anchorDate;
  // 四半期（3か月）: anchorDate の属する四半期の月初〜月末を計算
  const month = now.getMonth(); // 0-11
  const quarterIndex = Math.floor(month / 3); // 0..3
  const quarterStartMonth = quarterIndex * 3; // 0,3,6,9
  const quarterEndMonth = quarterStartMonth + 2;
  const rangeStartMonth = startOfMonth(new Date(now.getFullYear(), quarterStartMonth, 1));
  const rangeEndMonth = endOfMonth(new Date(now.getFullYear(), quarterEndMonth, 1));
  const gridStart = startOfWeek(rangeStartMonth, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(rangeEndMonth, { weekStartsOn: 0 });

  // データを日付マップに変換して、月のレンジに含まれる日を取り出す
  const dataMap = new Map(data.map((d) => [d.date, d]));
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  allDays.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayData = dataMap.get(dateStr) || { date: dateStr, value: 0, level: 0 };
    currentWeek.push(dayData);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // 曜日ラベル
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const subtitleLabel = `${format(rangeStartMonth, 'yyyy年M月', { locale: ja })} 〜 ${format(rangeEndMonth, 'yyyy年M月', { locale: ja })}`;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.title}>学習ヒートマップ</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={goPrevQuarter} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'◀'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNextQuarter} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'▶'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.subtitle}>{subtitleLabel} の学習記録</Text>

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
    backgroundColor: defaultColors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
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
    color: defaultColors.textSecondary,
    fontSize: 10,
    height: 12,
    lineHeight: 12,
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: defaultColors.border,
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
    color: defaultColors.textSecondary,
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
    borderColor: defaultColors.border,
  },
  navButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: defaultColors.backgroundSecondary,
  },
  navButtonText: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
});
