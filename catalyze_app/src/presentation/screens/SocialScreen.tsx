/**
 * StudyNext - Social Screen
 * フレンドと協力・競争するソーシャル機能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, textStyles, colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabScreenProps } from '../navigation/types';
import { useFriends, useCooperationGoals, useRanking, useUserPoints, useActiveAIMatches, useAvailableAICompetitors } from '../hooks';
import { useAuthState, useCurrentUserId } from '../hooks/useAuth';

type TabType = 'cooperation' | 'ranking' | 'ai-competition';

export const SocialScreen: React.FC<MainTabScreenProps<'Social'>> = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('cooperation');
  const loggedIn = useAuthState();
  const { userId: currentUserId } = useCurrentUserId();
  
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('FriendsList')}
        >
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.primary]);
  
  // データ取得
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUserId);
  const { data: goals = [], isLoading: isLoadingGoals } = useCooperationGoals(currentUserId);
  const { data: userPoints } = useUserPoints(currentUserId);
  
  // AI競争のデータ取得
  const { data: activeMatches = [], isLoading: isLoadingMatches } = useActiveAIMatches(currentUserId);
  const { data: aiCompetitors = [], isLoading: isLoadingAICompetitors } = useAvailableAICompetitors();
  
  // ランキング用のユーザーID（自分 + フレンド）
  const rankingUserIds = [currentUserId, ...friends.map(f => f.id)];
  const { data: ranking = [], isLoading: isLoadingRanking } = useRanking(rankingUserIds);

  // 動的スタイル（テーマ対応）
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    loginPromptContainer: [styles.loginPromptContainer, { backgroundColor: colors.background }],
    loginButton: [styles.loginButton, { backgroundColor: colors.primary }],
    tabContainer: [styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    tabButton: [styles.tabButton, { backgroundColor: colors.background }],
    tabButtonActive: [styles.tabButtonActive, { backgroundColor: colors.primaryLight }],
    tabButtonText: [styles.tabButtonText, { color: colors.textSecondary }],
    tabButtonTextActive: [styles.tabButtonTextActive, { color: colors.primary }],
  };

  // ログインを促すUI
  const renderLoginPrompt = () => (
    <View style={dynamicStyles.loginPromptContainer}>
      <Ionicons name="lock-closed-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.loginPromptTitle}>ログインが必要です</Text>
      <Text style={styles.loginPromptText}>
        ソーシャル機能を使用するには{'\n'}
        ログインしてください
      </Text>
      <TouchableOpacity
        style={dynamicStyles.loginButton}
        onPress={() => navigation.navigate('Auth' as any)}
      >
        <Ionicons name="log-in-outline" size={20} color={colors.white} />
        <Text style={styles.loginButtonText}>ログイン</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={[dynamicStyles.tabButton, activeTab === tab && dynamicStyles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? colors.primary : colors.textSecondary} 
      />
      <Text style={[dynamicStyles.tabButtonText, activeTab === tab && dynamicStyles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCooperationMode = () => {
    if (isLoadingGoals) {
      return (
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>進行中の協力目標</Text>
          {goals.map((goal) => {
            // 参加者のフレンド情報を取得
            const participants = friends.filter(f => goal.participantIds.includes(f.id));
            
            return (
              <View key={goal.id} style={styles.goalCard}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                
                <View style={styles.participantsContainer}>
                  {participants.map((participant) => (
                    <View key={participant.id} style={styles.participantAvatar}>
                      <Text style={styles.avatarText}>{participant.avatar}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(goal.currentProgress / goal.targetProgress) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {goal.currentProgress} / {goal.targetProgress} 時間
                  </Text>
                </View>

                <View style={styles.goalFooter}>
                  <View style={styles.deadlineContainer}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.deadlineText}>
                      期限: {new Date(goal.deadline).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>詳細</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateCooperationGoal')}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.createButtonText}>新しい協力目標を作成</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderRankingMode = () => {
    if (isLoadingRanking) {
      return (
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今週のランキング</Text>
          
          <View style={styles.rankingCard}>
            {ranking.map((entry, index) => (
              <View key={entry.userId} style={styles.rankingItem}>
                <View style={styles.rankingLeft}>
                  <View style={[
                    styles.rankBadge,
                    index === 0 && styles.rankBadgeGold,
                    index === 1 && styles.rankBadgeSilver,
                    index === 2 && styles.rankBadgeBronze,
                  ]}>
                    <Text style={styles.rankNumber}>{entry.rank}</Text>
                  </View>
                  
                  <View style={styles.rankingAvatarContainer}>
                    <Text style={styles.rankingAvatar}>{entry.avatar}</Text>
                    {entry.status === 'online' && <View style={styles.onlineIndicator} />}
                  </View>
                  
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{entry.name}</Text>
                    <View style={styles.levelContainer}>
                      <Ionicons name="star" size={14} color={colors.warning} />
                      <Text style={styles.levelText}>Lv.{entry.level}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rankingRight}>
                  <Text style={styles.pointsText}>{entry.points}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={32} color={colors.primary} />
              <Text style={styles.statValue}>
                {ranking.find(r => r.userId === currentUserId)?.rank || '-'}位
              </Text>
              <Text style={styles.statLabel}>今週の順位</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={32} color={colors.success} />
              <Text style={styles.statValue}>+{userPoints?.weeklyPoints || 0}</Text>
              <Text style={styles.statLabel}>今週の獲得pt</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAICompetitionMode = () => {
    if (isLoadingMatches || isLoadingAICompetitors) {
      return (
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>進行中のAI競争</Text>
          
          {activeMatches.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="beaker-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>AI競争がありません</Text>
              <Text style={styles.emptyStateText}>
                AIキャラクターと競争して、{'\n'}
                学習のモチベーションを上げましょう!
              </Text>
            </View>
          ) : (
            activeMatches.map((match) => {
              const competitor = aiCompetitors.find(c => c.id === match.aiCompetitorId);
              const userProgress = (match.userProgress / match.targetProgress) * 100;
              const aiProgress = (match.aiProgress / match.targetProgress) * 100;

              return (
                <View key={match.id} style={styles.aiMatchCard}>
                  <View style={styles.aiMatchHeader}>
                    <Text style={styles.matchTypeLabel}>{match.matchType === 'studyHours' ? '勉強時間' : match.matchType === 'points' ? 'ポイント' : 'ストリーク'}</Text>
                  </View>

                  <View style={styles.competitionContainer}>
                    {/* ユーザーの進捗 */}
                    <View style={styles.playerRow}>
                      <View style={styles.playerInfo}>
                        <Text style={[styles.playerLabel, { color: colors.text }]}>あなた</Text>
                        <Text style={[styles.playerStats, { color: colors.textSecondary }]}>
                          {Math.round(match.userProgress)} / {match.targetProgress}
                          {match.matchType === 'studyHours' ? '時間' : match.matchType === 'points' ? 'pt' : '日'}
                        </Text>
                      </View>
                      <View style={styles.progressSection}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${Math.min(userProgress, 100)}%`,
                                backgroundColor: colors.primary,
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.text }]}>
                          {Math.round(userProgress)}%
                        </Text>
                      </View>
                    </View>

                    {/* AIの進捗 */}
                    <View style={styles.playerRow}>
                      <View style={styles.playerInfo}>
                        <Text style={[styles.playerLabel, { color: colors.text }]}>{competitor?.avatar} {competitor?.name}</Text>
                        <Text style={[styles.playerStats, { color: colors.textSecondary }]}>
                          {Math.round(match.aiProgress)} / {match.targetProgress}
                          {match.matchType === 'studyHours' ? '時間' : match.matchType === 'points' ? 'pt' : '日'}
                        </Text>
                      </View>
                      <View style={styles.progressSection}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.progressFill,
                              { 
                                width: `${Math.min(aiProgress, 100)}%`,
                                backgroundColor: colors.warning,
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.text }]}>
                          {Math.round(aiProgress)}%
                        </Text>
                      </View>
                    </View>

                    {/* 勝者予想 */}
                    {userProgress !== aiProgress && (
                      <View style={[styles.winnerPredictor, { backgroundColor: userProgress > aiProgress ? colors.success : colors.warning }]}>
                        <Ionicons 
                          name={userProgress > aiProgress ? "trophy" : "alert-circle"} 
                          size={16} 
                          color={colors.white} 
                        />
                        <Text style={[styles.winnerPredictorText, { color: colors.white }]}>
                          {userProgress > aiProgress ? 'あなたがリード中!' : 'AIに追い上げられています'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.matchFooter}>
                    <View style={styles.deadlineContainer}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.deadlineText}>
                        期限: {new Date(match.endDate).toLocaleDateString('ja-JP')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.detailButton}
                      onPress={() => navigation.navigate('AICompetitionDetail' as any, { matchId: match.id })}
                    >
                      <Text style={styles.detailButtonText}>詳細</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('SelectAICompetitor' as any)}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.createButtonText}>新しいAI競争を開始</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.tabContainer}>
        {renderTabButton('cooperation', '協力モード', 'people')}
        {renderTabButton('ranking', 'ランキング', 'trophy')}
        {renderTabButton('ai-competition', 'AI競争', 'sparkles')}
      </View>

      {!loggedIn && activeTab !== 'ai-competition' ? renderLoginPrompt() : activeTab === 'cooperation' ? renderCooperationMode() : activeTab === 'ranking' ? renderRankingMode() : renderAICompetitionMode()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loginPromptTitle: {
    ...textStyles.h2,
    color: defaultColors.text,
  },
  loginPromptText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: defaultColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  loginButtonText: {
    ...textStyles.body,
    color: defaultColors.white,
    fontWeight: '600',
  },
  headerButton: {
    padding: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: defaultColors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: defaultColors.background,
    gap: spacing.sm,
  },
  tabButtonActive: {
    backgroundColor: defaultColors.primaryLight,
  },
  tabButtonText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: defaultColors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginBottom: spacing.md,
  },
  goalCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  goalTitle: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginBottom: spacing.xs,
  },
  goalDescription: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginBottom: spacing.md,
  },
  participantsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: defaultColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: defaultColors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: defaultColors.primary,
  },
  progressText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    textAlign: 'right',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deadlineText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailButtonText: {
    ...textStyles.body,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: defaultColors.primary,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  createButtonText: {
    ...textStyles.body,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  rankingCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: defaultColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#FFD700',
  },
  rankBadgeSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBadgeBronze: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    ...textStyles.body,
    fontWeight: 'bold',
    color: defaultColors.white,
  },
  rankingAvatarContainer: {
    position: 'relative',
  },
  rankingAvatar: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: defaultColors.success,
    borderWidth: 2,
    borderColor: defaultColors.card,
  },
  rankingInfo: {
    gap: spacing.xs,
  },
  rankingName: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    ...textStyles.h4,
    color: defaultColors.primary,
    fontWeight: 'bold',
  },
  pointsLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    ...textStyles.h3,
    color: defaultColors.text,
    fontWeight: 'bold',
  },
  statLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    textAlign: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    marginVertical: spacing.xl,
  },
  emptyStateTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginTop: spacing.md,
  },
  emptyStateText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  aiMatchCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  aiMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiMatchTitle: {
    ...textStyles.h4,
    color: defaultColors.text,
  },
  matchTypeLabel: {
    ...textStyles.caption,
    backgroundColor: defaultColors.primaryLight,
    color: defaultColors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  competitionContainer: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerInfo: {
    width: '35%',
    paddingRight: spacing.sm,
  },
  playerLabel: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  playerStats: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  progressSection: {
    flex: 1,
    gap: spacing.xs,
  },
  progressPercent: {
    ...textStyles.caption,
    color: defaultColors.text,
    textAlign: 'right',
    fontWeight: '600',
  },
  winnerPredictor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  winnerPredictorText: {
    ...textStyles.body,
    color: defaultColors.white,
    fontWeight: '600',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: defaultColors.border,
  },
});

