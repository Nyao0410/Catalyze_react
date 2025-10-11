/**
 * StudyNext - Plan Detail Screen
 * 学習計画の詳細画面
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import { useStudyPlan, usePausePlan, useResumePlan, useCompletePlan, useStudySessions, useDeletePlan } from '../hooks';
import { ProgressBar } from '../components/ProgressBar';
import InlineMenu from '../components/InlineMenu';
import { colors, spacing, textStyles } from '../theme';
import { PlanStatus, PlanDifficulty, type StudySessionEntity } from 'catalyze-ai';
import { ProgressAnalysisService, PerformanceTrend, AchievabilityStatus } from 'catalyze-ai';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Props = RootStackScreenProps<'PlanDetail'>;

// セッションを日付ごとにグループ化する関数
const groupSessionsByDate = (sessions: StudySessionEntity[]) => {
  return sessions.reduce((groups, session) => {
    const dateKey = format(session.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, StudySessionEntity[]>);
};

// パフォーマンス係数に基づいて色を返す関数
const getPerformanceColor = (performanceFactor: number) => {
  if (performanceFactor >= 0.8) return colors.success;
  if (performanceFactor >= 0.6) return colors.primary;
  if (performanceFactor >= 0.4) return colors.warning;
  return colors.error;
};

// トレンドに応じた色とラベルを返す関数
const getTrendInfo = (trend: PerformanceTrend) => {
  switch (trend) {
    case PerformanceTrend.IMPROVING:
      return { color: colors.success, label: '向上中', icon: 'trending-up' };
    case PerformanceTrend.DECLINING:
      return { color: colors.error, label: '低下中', icon: 'trending-down' };
    default:
      return { color: colors.textSecondary, label: '安定', icon: 'remove' };
  }
};

// 達成可能性に応じた色とラベルを返す関数
const getAchievabilityInfo = (status: AchievabilityStatus) => {
  switch (status) {
    case AchievabilityStatus.ACHIEVED:
      return { color: colors.success, label: '達成済み', icon: 'checkmark-circle' };
    case AchievabilityStatus.COMFORTABLE:
      return { color: colors.success, label: '余裕あり', icon: 'thumbs-up' };
    case AchievabilityStatus.ON_TRACK:
      return { color: colors.primary, label: '順調', icon: 'checkmark' };
    case AchievabilityStatus.CHALLENGING:
      return { color: colors.warning, label: '挑戦的', icon: 'alert-circle' };
    case AchievabilityStatus.AT_RISK:
      return { color: colors.warning, label: '要注意', icon: 'warning' };
    case AchievabilityStatus.OVERDUE:
      return { color: colors.error, label: '期限切れ', icon: 'close-circle' };
    case AchievabilityStatus.IMPOSSIBLE:
      return { color: colors.error, label: '達成困難', icon: 'close-circle' };
    default:
      return { color: colors.textSecondary, label: '不明', icon: 'help-circle' };
  }
};

export const PlanDetailScreen: React.FC<Props> = ({ route }) => {
  const { planId } = route.params;
  const navigation = useNavigation();
  
  const { data: plan, isLoading, error } = useStudyPlan(planId);
  const { data: sessions = [] } = useStudySessions(planId);
  const pausePlan = usePausePlan();
  const resumePlan = useResumePlan();
  const completePlan = useCompletePlan();

  // パフォーマンス分析サービス
  const analysisService = new ProgressAnalysisService();

  // ヘッダーメニューは InlineMenu コンポーネントで表示する（OS デフォルトは使わない）
  const onEditPlan = () => navigation.navigate('EditPlan', { planId });
  const onSharePlan = async () => {
    if (!plan) return;
    try {
      await Share.share({
        message: `${plan.title}\n進捗: ${completedUnits}/${plan.totalUnits} ${plan.unit}`,
      });
    } catch (e) {
      Alert.alert('共有に失敗しました');
    }
  };

  const deletePlan = useDeletePlan();
  const confirmDeletePlan = () => {
    if (!plan) return;
    Alert.alert(
      '確認',
      'この学習計画を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deletePlan.mutate(planId, {
              onSuccess: () => navigation.goBack(),
              onError: () => Alert.alert('削除に失敗しました'),
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  // パフォーマンス分析の計算（planが読み込まれた場合のみ）
  const averagePerformance = analysisService.calculateAveragePerformance(sessions);
  const performanceTrend = analysisService.analyzeRecentTrend(sessions, 7);
  const achievability = plan ? analysisService.evaluateAchievability(plan, sessions) : AchievabilityStatus.ON_TRACK;

  // ローディング状態
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={textStyles.body}>読み込み中...</Text>
      </View>
    );
  }

  // エラー状態
  if (error || !plan) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[textStyles.body, styles.errorText]}>
          計画の読み込みに失敗しました
        </Text>
      </View>
    );
  }

  // ステータスバッジの色
  const getStatusColor = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.ACTIVE:
        return colors.success;
      case PlanStatus.PAUSED:
        return colors.warning;
      case PlanStatus.COMPLETED:
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  // ステータスラベル
  const getStatusLabel = (status: PlanStatus) => {
    switch (status) {
      case PlanStatus.ACTIVE:
        return '実行中';
      case PlanStatus.PAUSED:
        return '一時停止中';
      case PlanStatus.COMPLETED:
        return '完了';
      default:
        return status;
    }
  };

  // 難易度ラベル
  const getDifficultyLabel = (difficulty: PlanDifficulty) => {
    switch (difficulty) {
      case PlanDifficulty.EASY:
        return '簡単';
      case PlanDifficulty.NORMAL:
        return '普通';
      case PlanDifficulty.HARD:
        return '難しい';
      default:
        return difficulty;
    }
  };

  // 一時停止/再開ハンドラー
  const handleTogglePause = () => {
    if (plan.status === PlanStatus.ACTIVE) {
      // 確認ダイアログは不要なので即実行
      pausePlan.mutate(planId);
    } else if (plan.status === PlanStatus.PAUSED) {
      resumePlan.mutate(planId);
    }
  };

  // 完了ハンドラー
  const handleComplete = () => {
    // 確認ダイアログ・成功ダイアログは不要のため即実行
    completePlan.mutate(planId, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: () => {
        Alert.alert('エラー', '計画の完了に失敗しました');
      },
    });
  };

  // 進捗計算
  const completedUnits = sessions.reduce((sum: number, session: StudySessionEntity) => sum + session.unitsCompleted, 0);
  const progressPercentage = plan.totalUnits > 0 ? completedUnits / plan.totalUnits : 0;
  // 現在の周（ラウンド）内での完了数を表示する（複数周が経過している場合はモジュロを取る）
  const completedInCurrentRound = plan.totalUnits > 0
    ? (completedUnits % plan.totalUnits === 0 && completedUnits > 0 ? plan.totalUnits : completedUnits % plan.totalUnits)
    : completedUnits;
  const remainingUnits = Math.max(plan.totalUnits - completedInCurrentRound, 0);

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダーセクション */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={textStyles.h1}>{plan.title}</Text>
          <View style={styles.titleActions}>
            <InlineMenu
              items={[
                {
                  key: 'edit',
                  label: '編集',
                  icon: <Ionicons name="pencil" size={18} color={colors.primary} />,
                  onPress: onEditPlan,
                },
                {
                  key: 'share',
                  label: '共有',
                  icon: <Ionicons name="share-social" size={18} color={colors.text} />,
                  onPress: onSharePlan,
                },
                {
                  key: 'delete',
                  label: '削除',
                  icon: <Ionicons name="trash" size={18} color={colors.error} />,
                  color: colors.error,
                  onPress: confirmDeletePlan,
                },
              ]}
            />
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(plan.status)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {format(plan.createdAt, 'yyyy/MM/dd', { locale: ja })} 〜 {format(plan.deadline, 'yyyy/MM/dd', { locale: ja })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{getDifficultyLabel(plan.difficulty)}</Text>
          </View>
        </View>
      </View>

      {/* 進捗セクション */}
      <View style={styles.section}>
        <Text style={textStyles.h3}>進捗状況</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            {/* 現在の周の進捗を表示（例: 185/200 問） */}
            <Text style={textStyles.h2}>
              {completedInCurrentRound} / {plan.totalUnits} {plan.unit}
            </Text>
            {/* 全体の進捗（累計 / 総数）をパーセンテージで表示（例: 193%） */}
            <Text style={textStyles.h2}>
              {Math.round(progressPercentage * 100)}%
            </Text>
          </View>
          <ProgressBar progress={progressPercentage} />
          <View style={styles.progressFooter}>
            <Text style={styles.unitText}>{/* intentionally left blank for alignment */}</Text>
            {/* 右寄せで合計を表示 */}
            <Text style={styles.totalText}>合計：{completedUnits} {plan.unit}</Text>
          </View>
        </View>
      </View>

      {/* 統計セクション */}
      <View style={styles.section}>
        <Text style={textStyles.h3}>統計情報</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="repeat-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>
              {plan.rounds} / {plan.targetRounds}
            </Text>
            <Text style={styles.statLabel}>周回数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>
              {Math.round((plan.estimatedTimePerUnit / 1000 / 60) * plan.totalUnits)}
            </Text>
            <Text style={styles.statLabel}>推定時間（分）</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-number-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{plan.remainingDays}</Text>
            <Text style={styles.statLabel}>残り日数</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>
              {Math.round(plan.timeProgressRatio * 100)}%
            </Text>
            <Text style={styles.statLabel}>時間進捗</Text>
          </View>
        </View>
      </View>

      {/* 学習日設定 */}
      <View style={styles.section}>
        <Text style={textStyles.h3}>学習曜日</Text>
        <View style={styles.daysContainer}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => {
            const isActive = plan.studyDays.includes(index);
            return (
              <View
                key={day}
                style={[
                  styles.dayBadge,
                  isActive ? styles.dayBadgeActive : styles.dayBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isActive ? styles.dayTextActive : styles.dayTextInactive,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>


      {/* パフォーマンス分析 */}
      <View style={styles.section}>
        <Text style={textStyles.h3}>パフォーマンス分析</Text>
        <View style={styles.performanceGrid}>
          {/* 平均効率スコア */}
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Ionicons name="speedometer-outline" size={24} color={colors.primary} />
              <Text style={styles.performanceTitle}>平均効率</Text>
            </View>
            <Text style={styles.performanceValue}>
              {Math.round(averagePerformance.efficiencyScore * 100)}%
            </Text>
            <View style={styles.performanceDetails}>
              <View style={styles.performanceDetail}>
                <Text style={styles.performanceDetailLabel}>集中度</Text>
                <Text style={styles.performanceDetailValue}>
                  {Math.round(averagePerformance.concentration * 100)}%
                </Text>
              </View>
              <View style={styles.performanceDetail}>
                <Text style={styles.performanceDetailLabel}>難易度</Text>
                <Text style={styles.performanceDetailValue}>
                  {averagePerformance.difficulty}/5
                </Text>
              </View>
            </View>
          </View>

          {/* トレンド分析 */}
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Ionicons
                name={getTrendInfo(performanceTrend).icon as any}
                size={24}
                color={getTrendInfo(performanceTrend).color}
              />
              <Text style={styles.performanceTitle}>学習トレンド</Text>
            </View>
            <Text
              style={[
                styles.performanceValue,
                { color: getTrendInfo(performanceTrend).color },
              ]}
            >
              {getTrendInfo(performanceTrend).label}
            </Text>
            <Text style={styles.performanceDescription}>
              過去7日間の学習傾向
            </Text>
          </View>

          {/* 達成可能性評価 */}
          <View style={[styles.performanceCard, styles.achievabilityCard]}>
            <View style={styles.performanceHeader}>
              <Ionicons
                name={getAchievabilityInfo(achievability).icon as any}
                size={24}
                color={getAchievabilityInfo(achievability).color}
              />
              <Text style={styles.performanceTitle}>達成可能性</Text>
            </View>
            <Text
              style={[
                styles.performanceValue,
                { color: getAchievabilityInfo(achievability).color },
              ]}
            >
              {getAchievabilityInfo(achievability).label}
            </Text>
            <Text style={styles.performanceDescription}>
              現在の進捗と期限から評価
            </Text>
          </View>
        </View>
      </View>

      {/* アクションボタン */}
      <View style={styles.actionSection}>
        {plan.status !== PlanStatus.COMPLETED && (
          <>
            {/* タイマーボタン */}
            <TouchableOpacity
              style={[styles.actionButton, styles.timerButton]}
              onPress={() => navigation.navigate('TimerScreen', { planId: plan.id })}
            >
              <Ionicons name="timer-outline" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>タイマーを開始</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                plan.status === PlanStatus.PAUSED
                  ? styles.resumeButton
                  : styles.pauseButton,
              ]}
              onPress={handleTogglePause}
              disabled={pausePlan.isPending || resumePlan.isPending}
            >
              <Ionicons
                name={plan.status === PlanStatus.PAUSED ? 'play' : 'pause'}
                size={20}
                color={colors.white}
              />
              <Text style={styles.actionButtonText}>
                {plan.status === PlanStatus.PAUSED ? '再開' : '一時停止'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
              disabled={completePlan.isPending}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.actionButtonText}>完了</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* セッション履歴 */}
      <View style={styles.section}>
        <Text style={textStyles.h3}>学習履歴</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>まだ学習セッションがありません</Text>
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            {Object.entries(groupSessionsByDate(sessions))
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, daySessions]: [string, StudySessionEntity[]]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>
                    {format(new Date(date), 'yyyy年MM月dd日 (E)', { locale: ja })}
                  </Text>
                  {daySessions.map((session) => (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionTime}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.sessionTimeText}>
                            {format(session.date, 'HH:mm', { locale: ja })}
                          </Text>
                        </View>
                        <View style={styles.performanceIndicator}>
                          <View
                            style={[
                              styles.performanceDot,
                              { backgroundColor: getPerformanceColor(session.performanceFactor) },
                            ]}
                          />
                          <Text style={styles.performanceText}>
                            {Math.round(session.performanceFactor * 100)}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.sessionContent}>
                        <View style={styles.sessionStats}>
                          <View style={styles.sessionStat}>
                            <Ionicons name="book-outline" size={16} color={colors.primary} />
                            <Text style={styles.sessionStatText}>
                              {session.unitsCompleted} {plan.unit}
                            </Text>
                          </View>
                          <View style={styles.sessionStat}>
                            <Ionicons name="timer-outline" size={16} color={colors.primary} />
                            <Text style={styles.sessionStatText}>
                              {session.durationMinutes}分
                            </Text>
                          </View>
                          <View style={styles.sessionStat}>
                            <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                            <Text style={styles.sessionStatText}>
                              難易度 {session.difficulty}/5
                            </Text>
                          </View>
                        </View>
                        <View style={styles.sessionQuality}>
                          <Text style={styles.sessionQualityLabel}>集中度</Text>
                          <View style={styles.concentrationBar}>
                            <View
                              style={[
                                styles.concentrationFill,
                                { width: `${session.concentration * 100}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.concentrationText}>
                            {Math.round(session.concentration * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  unitText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  remainingText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.primary,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeActive: {
    backgroundColor: colors.primary,
  },
  dayBadgeInactive: {
    backgroundColor: colors.backgroundSecondary,
  },
  dayText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  dayTextActive: {
    color: colors.white,
  },
  dayTextInactive: {
    color: colors.textSecondary,
  },
  actionSection: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  timerButton: {
    backgroundColor: colors.warning,
  },
  pauseButton: {
    backgroundColor: colors.textSecondary,
  },
  resumeButton: {
    backgroundColor: colors.success,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  // セッション履歴スタイル
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  sessionsContainer: {
    gap: spacing.lg,
  },
  dateGroup: {
    gap: spacing.sm,
  },
  dateHeader: {
    ...textStyles.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sessionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionTimeText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  performanceText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sessionContent: {
    gap: spacing.sm,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionStatText: {
    ...textStyles.caption,
    color: colors.text,
    fontWeight: '500',
  },
  sessionQuality: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionQualityLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    minWidth: 50,
  },
  concentrationBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  concentrationFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  concentrationText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  totalText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'right',
  },
  // パフォーマンス分析スタイル
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  performanceCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.sm,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  performanceTitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  performanceValue: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
  },
  performanceDetails: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  performanceDetail: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  performanceDetailLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  performanceDetailValue: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  performanceDescription: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  achievabilityCard: {
    minWidth: '100%',
    marginTop: spacing.sm,
  },
});
