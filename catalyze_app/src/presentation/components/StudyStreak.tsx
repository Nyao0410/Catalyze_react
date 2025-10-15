/**
 * Catalyze AI - Study Streak Component
 * 学習ストリーク表示コンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { StreakData } from '../../application/services/StatisticsService';

interface StudyStreakProps {
  data: StreakData;
}

export const StudyStreak: React.FC<StudyStreakProps> = ({ data }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flame" size={24} color={colors.warning} />
        <Text style={[styles.title, { color: colors.text }]}>学習ストリーク</Text>
      </View>

      <View style={styles.content}>
        {/* 現在のストリーク */}
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>現在の連続日数</Text>
          <View style={styles.streakValueContainer}>
            <Text style={styles.streakValue}>{data.currentStreak}</Text>
            <Text style={styles.streakUnit}>日</Text>
          </View>
          {data.currentStreak > 0 && (
            <Text style={styles.encouragement}>
              {data.currentStreak >= 7
                ? '素晴らしい継続力です！'
                : data.currentStreak >= 3
                ? 'いい調子です！'
                : '継続は力なり！'}
            </Text>
          )}
        </View>

        {/* 統計情報 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>最長記録</Text>
            <Text style={styles.statValue}>{data.longestStreak} 日</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>総学習日数</Text>
            <Text style={styles.statValue}>{data.totalStudyDays} 日</Text>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...textStyles.h3,
    color: defaultColors.text,
  },
  content: {
    gap: spacing.md,
  },
  streakCard: {
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  streakLabel: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginBottom: spacing.xs,
  },
  streakValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '700',
    color: defaultColors.warning,
  },
  streakUnit: {
    ...textStyles.h2,
    color: defaultColors.textSecondary,
  },
  encouragement: {
    ...textStyles.bodySmall,
    color: defaultColors.success,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.h3,
    color: defaultColors.primary,
    fontWeight: '700',
  },
});
