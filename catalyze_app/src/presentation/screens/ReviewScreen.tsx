/**
 * StudyNext - Review Screen
 * 復習管理画面 - SM-2アルゴリズムベースの復習システム
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
// import type { MainTabScreenProps } from '../navigation/types';
import { t } from '../../locales';
import { useDueReviewItems, useRecordReview } from '../hooks/useReviewItems';
import { useStudyPlans } from '../hooks/useStudyPlans';
import { useCurrentUserId } from '../hooks/useAuth';
import type { ReviewItemEntity } from 'catalyze-ai';

// type Props = MainTabScreenProps<'Review'>;
type Props = {};

export const ReviewScreen: React.FC<Props> = () => {
  // 実際のユーザーIDを取得（未ログイン時でもローカルIDが返される）
  const { userId: currentUserId, isLoading: isLoadingUserId } = useCurrentUserId();
  const userId = currentUserId === 'error' ? 'local-default' : (isLoadingUserId ? 'loading' : currentUserId);
  const effectiveUserId = (userId === 'loading' || userId === 'error') ? '' : userId;
  
  const { data: reviewItems, isLoading: isLoadingReviews } = useDueReviewItems(effectiveUserId);
  const { data: plans } = useStudyPlans(effectiveUserId);
  const { mutate: recordReview, isPending } = useRecordReview();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // ローディング状態
  if (isLoadingReviews) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('review.loading')}</Text>
      </View>
    );
  }

  // 復習項目がない場合
  if (!reviewItems || reviewItems.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>{t('review.empty.title')}</Text>
        <Text style={styles.emptyDescription}>{t('review.empty.description')}</Text>
      </View>
    );
  }

  const currentItem = reviewItems[currentIndex];
  const currentPlan = plans?.find(p => p.id === currentItem.planId);

  // 回答評価を記録して次へ
  const handleQualityRating = (quality: number) => {
    recordReview(
      { itemId: currentItem.id, quality },
      {
        onSuccess: () => {
          // 次の項目へ進む
          if (currentIndex < reviewItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
          } else {
            // すべての復習完了
            setCurrentIndex(0);
            setShowAnswer(false);
          }
        },
      }
    );
  };

  // 進捗情報
  const progress = {
    current: currentIndex + 1,
    total: reviewItems.length,
    percentage: Math.round(((currentIndex + 1) / reviewItems.length) * 100),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ヘッダー: 進捗 */}
      <View style={styles.header}>
        <Text style={styles.progressText}>
          {progress.current} / {progress.total}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
        </View>
      </View>

      {/* プラン情報 */}
      {currentPlan && (
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{currentPlan.title}</Text>
        </View>
      )}

      {/* 問題カード */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('review.question')}</Text>
        <Text style={styles.cardContent}>
          {t('review.unit', { number: currentItem.unitNumber })}
        </Text>
      </View>

      {/* 答え表示ボタン / 答えカード */}
      {!showAnswer ? (
        <TouchableOpacity
          style={styles.showAnswerButton}
          onPress={() => setShowAnswer(true)}
          disabled={isPending}
        >
          <Text style={styles.showAnswerButtonText}>{t('review.showAnswer')}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={[styles.card, styles.answerCard]}>
            <Text style={styles.cardLabel}>{t('review.answer')}</Text>
            <Text style={styles.cardContent}>
              {t('review.checkYourAnswer')}
            </Text>
          </View>

          {/* SM-2統計情報 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('review.stats.repetitions')}</Text>
              <Text style={styles.statValue}>{currentItem.repetitions}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('review.stats.interval')}</Text>
              <Text style={styles.statValue}>{currentItem.intervalDays}{t('review.stats.days')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('review.stats.easeFactor')}</Text>
              <Text style={styles.statValue}>{currentItem.easeFactor.toFixed(2)}</Text>
            </View>
          </View>

          {/* 評価ボタン (0-5) */}
          <View style={styles.qualityContainer}>
            <Text style={styles.qualityTitle}>{t('review.quality.title')}</Text>
            
            {[
              { quality: 0, label: t('review.quality.0'), color: colors.error },
              { quality: 1, label: t('review.quality.1'), color: '#FF6B6B' },
              { quality: 2, label: t('review.quality.2'), color: '#FFA500' },
              { quality: 3, label: t('review.quality.3'), color: '#FFD700' },
              { quality: 4, label: t('review.quality.4'), color: '#90EE90' },
              { quality: 5, label: t('review.quality.5'), color: colors.success },
            ].map(({ quality, label, color }) => (
              <TouchableOpacity
                key={quality}
                style={[styles.qualityButton, { borderColor: color }]}
                onPress={() => handleQualityRating(quality)}
                disabled={isPending}
              >
                <View style={[styles.qualityIndicator, { backgroundColor: color }]} />
                <Text style={styles.qualityButtonText}>
                  {quality}: {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SM-2アルゴリズム説明 */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>{t('review.info')}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  // ヘッダー
  header: {
    marginBottom: spacing.lg,
  },
  progressText: {
    ...textStyles.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },

  // プラン情報
  planInfo: {
    marginBottom: spacing.md,
  },
  planName: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // カード
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerCard: {
    backgroundColor: colors.primaryLight,
  },
  cardLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  cardContent: {
    ...textStyles.h4,
    color: colors.text,
  },

  // 答え表示ボタン
  showAnswerButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  showAnswerButtonText: {
    ...textStyles.button,
    color: colors.white,
  },

  // 統計情報
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.h4,
    color: colors.text,
  },

  // 評価ボタン
  qualityContainer: {
    marginBottom: spacing.lg,
  },
  qualityTitle: {
    ...textStyles.h4,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  qualityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  qualityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  qualityButtonText: {
    ...textStyles.body,
    color: colors.text,
    flex: 1,
  },

  // 情報
  infoContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
  },
  infoText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // 空状態
  emptyTitle: {
    ...textStyles.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ローディング
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
