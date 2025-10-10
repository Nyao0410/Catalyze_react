/**
 * Catalyze AI - PlanCard Component
 * 学習計画カードコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudyPlanEntity, PlanStatus, PlanDifficulty } from 'catalyze-ai';
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
  // Ensure we have a StudyPlanEntity instance. Some data sources (navigation params, JSON) may
  // provide plain objects that lost prototype methods like isOverdue(). Convert when needed.
  let effectivePlan: StudyPlanEntity = plan as StudyPlanEntity;
  if (typeof (plan as any).isOverdue !== 'function') {
    try {
      // Debug logging removed: conversion from plain object to StudyPlanEntity
      effectivePlan = new StudyPlanEntity({
        id: (plan as any).id,
        userId: (plan as any).userId,
        title: (plan as any).title,
        totalUnits: (plan as any).totalUnits,
        unit: (plan as any).unit,
        unitRange: (plan as any).unitRange,
        createdAt: (plan as any).createdAt ? new Date((plan as any).createdAt) : new Date(),
        deadline: (plan as any).deadline ? new Date((plan as any).deadline) : new Date(),
        rounds: (plan as any).rounds,
        targetRounds: (plan as any).targetRounds,
        estimatedTimePerUnit: (plan as any).estimatedTimePerUnit ?? 0,
        difficulty: (plan as any).difficulty,
        studyDays: (plan as any).studyDays,
        status: (plan as any).status,
        dailyQuota: (plan as any).dailyQuota,
        dynamicDeadline: (plan as any).dynamicDeadline ? new Date((plan as any).dynamicDeadline) : undefined,
      });
    } catch (e) {
      // Conversion failed; keep using original plan. (Debug logs removed.)
      // fallback: keep using original plan (may still crash elsewhere)
      effectivePlan = plan as unknown as StudyPlanEntity;
    }
  }
  // ...existing code...
  // 進捗率の計算
  // 表示用の調整: completedUnits が totalUnits を超える場合は周回数を繰り上げて
  // カードには「現在の周回内での完了単元数」を表示する。
  // 例: totalUnits=200, completedUnits=374 -> completedFullRounds=1, remainder=174 -> 表示: 174/200, round=2
  const totalUnits = effectivePlan.totalUnits;
  const safeCompleted = Math.max(0, completedUnits || 0);
  let displayCompletedUnits = safeCompleted;
  let displayRound = effectivePlan.rounds ?? 1;

  if (totalUnits > 0) {
    const fullRounds = Math.floor(safeCompleted / totalUnits);
    const remainder = safeCompleted % totalUnits;
    if (remainder === 0 && fullRounds > 0) {
      // ちょうど区切りがいい場合はその周回が完了している扱い
      displayCompletedUnits = totalUnits;
      displayRound = fullRounds;
    } else {
      displayCompletedUnits = remainder;
      displayRound = fullRounds + 1;
    }
  }

  // 表示上の targetRounds は、完了数に応じて少なくとも displayRound 以上にする
  const displayTargetRounds = Math.max(effectivePlan.targetRounds ?? 1, displayRound);
  // 表示上は周回番号を1引く（初回表示を0にする要望に対応）
  const shownRound = Math.max(0, displayRound - 1);
  const progressPercentage = totalUnits > 0 ? displayCompletedUnits / totalUnits : 0;

  // ステータスに応じた表示
  const getStatusInfo = () => {
    switch (effectivePlan.status) {
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
    switch (effectivePlan.difficulty) {
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
    switch (effectivePlan.difficulty) {
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
              {displayCompletedUnits}/{plan.totalUnits}{plan.unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="reload-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
              {shownRound}/{displayTargetRounds}{t('plans.card.rounds')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>
                {effectivePlan.isOverdue()
                  ? t('achievability.overdue')
                  : `${t('plans.card.remaining')}${effectivePlan.remainingDays}${t('plans.card.days')}`}
            </Text>
          </View>
        </View>

        {/* 期限 */}
        <View style={styles.footer}>
          <Text style={styles.deadlineText}>
            {t('plans.card.deadline')}: {format(effectivePlan.deadline, 'yyyy年M月d日(E)', { locale: ja })}
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
