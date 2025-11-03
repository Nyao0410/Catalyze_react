/**
 * StudyNext - AI Competition Detail Screen
 * AI競争の詳細ページ
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, textStyles, colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAIMatch, useUpdateAIMatchProgress, useCancelAIMatch, useAICompetitorDetail } from '../hooks';
import { AIProgressSimulator } from '../../application/services';

type Props = NativeStackScreenProps<any, 'AICompetitionDetail'>;

export const AICompetitionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { matchId } = route.params as { matchId: string };
  
  const { data: match, isLoading } = useAIMatch(matchId);
  const { data: competitor } = useAICompetitorDetail(match?.aiCompetitorId || '');
  const updateProgress = useUpdateAIMatchProgress();
  const cancelMatch = useCancelAIMatch();

  const [localUserProgress, setLocalUserProgress] = useState(0);

  useEffect(() => {
    if (match) {
      navigation.setOptions({
        title: `${competitor?.avatar} ${competitor?.name} との競争`,
      });
      setLocalUserProgress(match.userProgress);
    }
  }, [match, competitor, navigation]);

  const handleUpdateProgress = async (newProgress: number) => {
    if (!match || !competitor) return;

    try {
      await updateProgress.mutateAsync({
        matchId,
        progress: newProgress,
      });
    } catch (error) {
      Alert.alert('エラー', '進捗の更新に失敗しました');
    }
  };

  const handleCancelMatch = () => {
    Alert.alert(
      '確認',
      'この競争をキャンセルしてもよろしいですか？',
      [
        { text: 'キャンセル', onPress: () => {}, style: 'cancel' },
        {
          text: 'キャンセルする',
          onPress: async () => {
            try {
              await cancelMatch.mutateAsync(matchId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', 'キャンセルに失敗しました');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (isLoading || !match || !competitor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userRatio = match.userProgress / match.targetProgress;
  const aiRatio = match.aiProgress / match.targetProgress;
  const userPercentage = Math.min(userRatio * 100, 100);
  const aiPercentage = Math.min(aiRatio * 100, 100);

  const isUserWinning = match.userProgress > match.aiProgress;
  const isUserLeadingSignificantly = userRatio > aiRatio + 0.2;

  const aiStatus = AIProgressSimulator.getAIStatus(
    match.aiProgress,
    match.targetProgress,
    match.userProgress,
    competitor.personality
  );

  const remainingDays = Math.ceil(
    (new Date(match.endDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
  );

  const requiredDailyProgress = AIProgressSimulator.calculateRequiredDailyProgress(
    match.userProgress,
    match.targetProgress,
    Math.max(1, remainingDays)
  );

  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    header: [styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    matchTypeLabel: [styles.matchTypeLabel, { backgroundColor: colors.primaryLight, color: colors.primary }],
    winnerBadge: [styles.winnerBadge, { backgroundColor: isUserWinning ? colors.success : colors.warning }],
    progressFill: [styles.progressFill, { backgroundColor: colors.primary }],
    aiFill: [styles.progressFill, { backgroundColor: colors.warning }],
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={dynamicStyles.header}>
          <Text style={styles.headerTitle}>進行中の競争</Text>
          <View style={styles.headerContent}>
            <View style={styles.competitorInfo}>
              <Text style={styles.competitorAvatar}>{competitor.avatar}</Text>
              <View>
                <Text style={styles.competitorName}>{competitor.name}</Text>
                <Text style={styles.competitorLevel}>Lv.{competitor.level}</Text>
              </View>
            </View>
            <View style={dynamicStyles.matchTypeLabel}>
              <Text style={styles.matchTypeText}>
                {match.matchType === 'studyHours' ? '勉強時間' : match.matchType === 'points' ? 'ポイント' : 'ストリーク'}
              </Text>
            </View>
          </View>
        </View>

        {/* ステータス表示 */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.aiStatusText}>{aiStatus}</Text>
            <Text style={styles.aiNameSmall}>{competitor.name}</Text>
          </View>
        </View>

        {/* 進捗表示 */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={styles.sectionTitle}>現在の進捗</Text>

          {/* ユーザー進捗 */}
          <View style={styles.playerProgressSection}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerLabel}>あなた</Text>
              <Text style={styles.progressValue}>
                {match.userProgress} / {match.targetProgress}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[dynamicStyles.progressFill, { width: `${userPercentage}%` }]} />
            </View>
            <Text style={[styles.percentage, { color: colors.text }]}>
              {Math.round(userPercentage)}%
            </Text>
          </View>

          {/* VS */}
          <View style={styles.vsContainer}>
            <View style={[styles.vsLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>
            <View style={[styles.vsLine, { backgroundColor: colors.border }]} />
          </View>

          {/* AI進捗 */}
          <View style={styles.playerProgressSection}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerLabel}>{competitor.avatar} {competitor.name}</Text>
              <Text style={styles.progressValue}>
                {Math.round(match.aiProgress)} / {match.targetProgress}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[dynamicStyles.aiFill, { width: `${aiPercentage}%` }]} />
            </View>
            <Text style={[styles.percentage, { color: colors.text }]}>
              {Math.round(aiPercentage)}%
            </Text>
          </View>
        </View>

        {/* 戦況分析 */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={styles.sectionTitle}>戦況分析</Text>

          <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {isUserWinning ? (
              <>
                <View style={styles.analysisRow}>
                  <Ionicons name="medal" size={24} color={colors.success} />
                  <Text style={[styles.analysisText, { color: colors.text }]}>
                    {isUserLeadingSignificantly ? 'あなたが大きくリード中!' : 'あなたがわずかにリード中!'}
                  </Text>
                </View>
                <Text style={[styles.analysisSubtext, { color: colors.textSecondary }]}>
                  このペースを保てば勝利が近い!
                </Text>
              </>
            ) : (
              <>
                <View style={styles.analysisRow}>
                  <Ionicons name="flash" size={24} color={colors.warning} />
                  <Text style={[styles.analysisText, { color: colors.text }]}>
                    AIが一歩リード中
                  </Text>
                </View>
                <Text style={[styles.analysisSubtext, { color: colors.textSecondary }]}>
                  {requiredDailyProgress > 0
                    ? `1日あたり${Math.ceil(requiredDailyProgress)}以上必要です`
                    : '追い上げのチャンス!'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* 目標達成まで */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={styles.sectionTitle}>目標達成までの進捗</Text>

          <View style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>残り日数</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{Math.max(0, remainingDays)}</Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>日</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>目標まで</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(0, match.targetProgress - match.userProgress)}
              </Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>
                {match.matchType === 'studyHours' ? '時間' : match.matchType === 'points' ? 'pt' : '日'}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>勝利時報酬</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                +{match.reward}
              </Text>
              <Text style={[styles.statUnit, { color: colors.textSecondary }]}>pt</Text>
            </View>
          </View>
        </View>

        {/* アクション */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleCancelMatch}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              競争をキャンセル
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  header: {
    backgroundColor: defaultColors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  headerTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  competitorAvatar: {
    fontSize: 48,
  },
  competitorName: {
    ...textStyles.h4,
    color: defaultColors.text,
  },
  competitorLevel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  matchTypeLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: defaultColors.primaryLight,
  },
  matchTypeText: {
    ...textStyles.caption,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginBottom: spacing.md,
  },
  statusCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: defaultColors.border,
  },
  aiStatusText: {
    fontSize: 32,
  },
  aiNameSmall: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  playerProgressSection: {
    marginBottom: spacing.lg,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  playerLabel: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  progressValue: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  progressBar: {
    height: 12,
    backgroundColor: defaultColors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: defaultColors.primary,
  },
  percentage: {
    ...textStyles.caption,
    textAlign: 'right',
    fontWeight: '600',
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: defaultColors.border,
  },
  vsText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  analysisText: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  analysisSubtext: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginLeft: 32,
  },
  statsGrid: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...textStyles.h2,
    color: defaultColors.text,
    fontWeight: 'bold',
  },
  statUnit: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: defaultColors.border,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: defaultColors.border,
    gap: spacing.sm,
  },
  cancelButtonText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  winnerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
});
