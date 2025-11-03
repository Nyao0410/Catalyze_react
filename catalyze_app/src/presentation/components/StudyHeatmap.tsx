/**
 * StudyNext - Study Heatmap Component
 * 学習ヒートマップコンポーネント（GitHub風）- 再構築版
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { HeatmapDay } from '../../application/services/StatisticsService';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

interface StudyHeatmapProps {
  data: HeatmapDay[];
}

const CELL_SIZE = 16;
const CELL_GAP = 4;

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ data }) => {
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const { colors } = useTheme();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [anchorDate]);

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

  const canGoNext = () => {
    const d = new Date(anchorDate);
    d.setMonth(d.getMonth() + 3);
    return d <= new Date();
  };

  // レベルごとの色（グラデーション）
  const getLevelColor = (level: number) => {
    const baseColor = colors.primary;
    const opacityLevels = [0.1, 0.3, 0.5, 0.7, 1.0];
    const opacity = opacityLevels[level] || 0.1;
    
    // RGB値を抽出して透明度を適用
    if (baseColor.startsWith('#')) {
      const hex = baseColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // フォールバック
    switch (level) {
      case 0:
        return colors.background;
      case 1:
        return `${colors.primary}20`;
      case 2:
        return `${colors.primary}40`;
      case 3:
        return `${colors.primary}60`;
      case 4:
        return `${colors.primary}80`;
      default:
        return colors.background;
    }
  };

  // 四半期の計算
  const now = anchorDate;
  const month = now.getMonth();
  const quarterIndex = Math.floor(month / 3);
  const quarterStartMonth = quarterIndex * 3;
  const quarterEndMonth = quarterStartMonth + 2;
  const rangeStartMonth = startOfMonth(new Date(now.getFullYear(), quarterStartMonth, 1));
  const rangeEndMonth = endOfMonth(new Date(now.getFullYear(), quarterEndMonth, 1));
  const gridStart = startOfWeek(rangeStartMonth, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(rangeEndMonth, { weekStartsOn: 0 });

  // データを日付マップに変換
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

  // 統計情報
  const totalDays = allDays.length;
  const studyDays = allDays.filter(
    (day) => (dataMap.get(format(day, 'yyyy-MM-dd'))?.value || 0) > 0
  ).length;
  const studyRate = totalDays > 0 ? Math.round((studyDays / totalDays) * 100) : 0;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>学習ヒートマップ</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitleLabel}</Text>
          </View>
        </View>
        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={goPrevQuarter}
            style={[styles.navButton, { backgroundColor: colors.background }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNextQuarter}
            disabled={!canGoNext()}
            style={[
              styles.navButton,
              { backgroundColor: colors.background, opacity: canGoNext() ? 1 : 0.3 },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 統計サマリー */}
      <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{studyDays}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>学習日数</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{studyRate}%</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>学習率</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heatmapContainer}>
          {/* 曜日ラベル */}
          <View style={styles.dayLabels}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayLabelContainer}>
                <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* ヒートマップグリッド */}
          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.column}>
                {week.map((day, dayIndex) => {
                  const isToday =
                    format(new Date(), 'yyyy-MM-dd') === day.date;
                  const isFuture = new Date(day.date) > new Date();

                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: getLevelColor(day.level),
                          borderColor: isToday ? colors.primary : colors.border,
                          borderWidth: isToday ? 2 : 1,
                        },
                        isFuture && styles.futureCell,
                      ]}
                    >
                      {isToday && (
                        <View style={[styles.todayIndicator, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>少ない</Text>
        <View style={styles.legendColors}>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                styles.legendCell,
                {
                  backgroundColor: getLevelColor(level),
                  borderColor: colors.border,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>多い</Text>
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
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...textStyles.h2,
    color: defaultColors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: defaultColors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...textStyles.h2,
    color: defaultColors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: defaultColors.border,
    marginHorizontal: spacing.md,
  },
  scrollView: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.md,
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: spacing.sm,
    justifyContent: 'space-around',
  },
  dayLabelContainer: {
    height: CELL_SIZE,
    justifyContent: 'center',
    marginBottom: CELL_GAP,
  },
  dayLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  column: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    borderWidth: 1,
    position: 'relative',
  },
  futureCell: {
    opacity: 0.3,
  },
  todayIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  legendLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontSize: 10,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
});
