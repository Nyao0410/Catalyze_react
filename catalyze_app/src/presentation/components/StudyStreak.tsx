/**
 * Catalyze AI - Study Streak Component
 * 学習ストリーク表示コンポーネント - 再構築版
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { StreakData } from '../../application/services/StatisticsService';

interface StudyStreakProps {
  data: StreakData;
}

export const StudyStreak: React.FC<StudyStreakProps> = ({ data }) => {
  const { colors } = useTheme();
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getEncouragementMessage = () => {
    if (data.currentStreak >= 30) return '🔥 驚異的な継続力！';
    if (data.currentStreak >= 14) return '✨ 素晴らしい努力です！';
    if (data.currentStreak >= 7) return '🌟 いい調子です！';
    if (data.currentStreak >= 3) return '💪 継続は力なり！';
    if (data.currentStreak > 0) return '👏 一歩ずつ前に進もう！';
    return '🚀 今日から始めよう！';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.card, opacity: fadeAnim },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}20` }]}>
          <Ionicons name="flame" size={28} color={colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>学習ストリーク</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {getEncouragementMessage()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* 現在のストリーク */}
        <Animated.View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.streakLabel, { color: colors.textInverse }]}>現在の連続日数</Text>
          <View style={styles.streakValueContainer}>
            <Animated.Text
              style={[
                styles.streakValue,
                { color: colors.textInverse },
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              {data.currentStreak}
            </Animated.Text>
            <Text style={[styles.streakUnit, { color: colors.textInverse }]}>日</Text>
          </View>
          {data.currentStreak > 0 && (
            <View style={styles.fireIconContainer}>
              <Ionicons name="flame" size={20} color={colors.textInverse} />
            </View>
          )}
        </Animated.View>

        {/* 統計情報 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>最長記録</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{data.longestStreak} 日</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>総学習日数</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{data.totalStudyDays} 日</Text>
          </View>
        </View>
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
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  content: {
    gap: spacing.md,
  },
  streakCard: {
    backgroundColor: defaultColors.primary,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  streakLabel: {
    ...textStyles.body,
    color: defaultColors.textInverse,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  streakValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  streakValue: {
    fontSize: 64,
    fontWeight: '800',
    color: defaultColors.textInverse,
    letterSpacing: -2,
  },
  streakUnit: {
    ...textStyles.h2,
    color: defaultColors.textInverse,
    opacity: 0.9,
  },
  fireIconContainer: {
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: defaultColors.background,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  statValue: {
    ...textStyles.h3,
    color: defaultColors.primary,
    fontWeight: '700',
  },
});

