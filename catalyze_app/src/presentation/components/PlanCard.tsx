/**
 * Catalyze AI - PlanCard Component
 * 学習計画カードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StudyPlanEntity } from 'catalyze-ai';
import { PlanStatus, PlanDifficulty } from 'catalyze-ai';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { colors, spacing, textStyles } from '../theme';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { t } from '../../locales';

interface PlanCardProps {
  plan: StudyPlanEntity;
  onPress: () => void;
  completedUnits?: number; // 完了した単元数
}

export const PlanCard: React.FC<PlanCardProps> = ({ 
  plan, 
  onPress, 
  completedUnits = 0,
}) => {
  // ...existing code...
  // 進捗率の計算
  const progressPercentage = plan.totalUnits > 0 ? completedUnits / plan.totalUnits : 0;

  // ステータスに応じた表示
  const getStatusInfo = () => {
    switch (plan.status) {
      case PlanStatus.ACTIVE:
        return { label: t('status.active'), color: colors.success };
      case PlanStatus.PAUSED:
        return { label: t('status.paused'), color: colors.textSecondary };
      case PlanStatus.COMPLETED:
        return { label: t('status.completed'), color: colors.primary };
      case PlanStatus.COMPLETED_TODAY:
        return { label: t('status.completedToday'), color: colors.accent };
      default:
        return { label: t('common.unknown'), color: colors.textSecondary };
    }
  };

  // 難易度に応じた色
  const getDifficultyColor = () => {
    switch (plan.difficulty) {
      case PlanDifficulty.EASY:
        return colors.difficultyEasy;
      case PlanDifficulty.NORMAL:
        return colors.difficultyNormal;
      case PlanDifficulty.HARD:
        return colors.difficultyHard;
      default:
        return colors.textSecondary;
    }
  };

  // 難易度ラベル
  const getDifficultyLabel = () => {
    switch (plan.difficulty) {
      case PlanDifficulty.EASY:
        return t('plans.difficulty.easy');
      case PlanDifficulty.NORMAL:
        return t('plans.difficulty.normal');
      case PlanDifficulty.HARD:
        return t('plans.difficulty.hard');
      default:
        return '?';
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="md" style={styles.card}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} numberOfLines={1}>
              {plan.title}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.badgeText}>{statusInfo.label}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getDifficultyColor() }]}>
                <Text style={styles.badgeText}>{getDifficultyLabel()}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </View>
        </View>

        {/* 進捗バー */}
        <View style={styles.progressSection}>
          <ProgressBar
            progress={progressPercentage}
            showPercentage
            height={8}
          />
        </View>

        {/* 統計情報 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {completedUnits}/{plan.totalUnits}{plan.unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="reload-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {plan.rounds}/{plan.targetRounds}{t('plans.card.rounds')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {plan.isOverdue() 
                ? t('achievability.overdue') 
                : `${t('plans.card.remaining')}${plan.remainingDays}${t('plans.card.days')}`}
            </Text>
          </View>
        </View>

        {/* 期限 */}
        <View style={styles.footer}>
          <Text style={styles.deadlineText}>
            {t('plans.card.deadline')}: {format(plan.deadline, 'yyyy年M月d日(E)', { locale: ja })}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...textStyles.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...textStyles.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  editButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  deadlineText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
});
