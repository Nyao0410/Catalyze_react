/**
 * StudyNext - Task Card Component
 * タスク表示用カードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DailyTaskEntity, StudyPlanEntity, AchievabilityStatus } from 'catalyze-ai';
import { colors, spacing, textStyles } from '../theme';
import { ProgressBar } from './ProgressBar';
import { t } from '../../locales';

interface TaskCardProps {
  task: DailyTaskEntity;
  plan: StudyPlanEntity;
  progress: number; // 0.0 ~ 1.0
  achievability: AchievabilityStatus;
  onPress?: () => void;
  onComplete?: () => void;
  onStartTimer?: () => void;
}

// 達成可能性に応じた色を返す
const getAchievabilityColor = (status: AchievabilityStatus): string => {
  switch (status) {
    case 'achieved':
    case 'comfortable':
      return colors.success;
    case 'onTrack':
      return colors.primary;
    case 'challenging':
      return colors.warning;
    case 'atRisk':
    case 'overdue':
    case 'impossible':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};

// 達成可能性のラベルを返す
const getAchievabilityLabel = (status: AchievabilityStatus): string => {
  switch (status) {
    case 'achieved':
      return t('achievability.achieved');
    case 'comfortable':
      return t('achievability.comfortable');
    case 'onTrack':
      return t('achievability.onTrack');
    case 'challenging':
      return t('achievability.challenging');
    case 'atRisk':
      return t('achievability.atRisk');
    case 'overdue':
      return t('achievability.overdue');
    case 'impossible':
      return t('achievability.impossible');
    default:
      return t('achievability.onTrack');
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  plan,
  progress,
  achievability,
  onPress,
  onComplete,
  onStartTimer,
}) => {
  const achievabilityColor = getAchievabilityColor(achievability);
  const achievabilityLabel = getAchievabilityLabel(achievability);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {plan.title}
          </Text>
          <View style={styles.rightBadges}>
            {String(task.id).startsWith('review-') && (
              <View style={styles.reviewLabel}>
                <Text style={styles.reviewLabelText}>復習</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: achievabilityColor }]}>
              <Text style={styles.badgeText}>{achievabilityLabel}</Text>
            </View>
          </View>
        </View>
        {task.round && task.round > 1 && (
          <Text style={styles.roundText}>{t('today.task.round')} {task.round}</Text>
        )}
      </View>

      {/* タスク詳細 */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="book-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>
            {task.startUnit} - {task.endUnit} ({task.units} {plan.unit})
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.detailText}>
            {t('today.task.about')} {task.estimatedMinutes}{t('today.task.minutes')}
          </Text>
        </View>
      </View>

      {/* 進捗バー */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{t('today.task.progress')}</Text>
          <Text style={styles.progressValue}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <ProgressBar progress={progress} height={8} />
      </View>

      {/* アドバイス */}
      {task.advice && (
        <View style={styles.adviceSection}>
          <Ionicons name="bulb-outline" size={16} color={colors.warning} />
          <Text style={styles.adviceText}>{task.advice}</Text>
        </View>
      )}

      {/* アクションボタン */}
      {(onComplete || onStartTimer) && (
        <View style={styles.actionButtons}>
          {onStartTimer && (
            <TouchableOpacity
              style={[styles.actionButton, styles.timerButton]}
              onPress={(e) => {
                e.stopPropagation();
                onStartTimer();
              }}
            >
              <Ionicons name="timer-outline" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>タイマー</Text>
            </TouchableOpacity>
          )}
          {onComplete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={(e) => {
                e.stopPropagation();
                onComplete();
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>{t('today.task.complete')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewLabel: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  reviewLabelText: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  title: {
    ...textStyles.h3,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  roundText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  details: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...textStyles.caption,
    color: colors.text,
  },
  progressSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  progressValue: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  adviceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  adviceText: {
    ...textStyles.caption,
    color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: 8,
  },
  timerButton: {
    backgroundColor: colors.warning,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
});
