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
import { useFriends, useCooperationGoals, useRanking, useUserPoints } from '../hooks';
import { getCurrentUserId, isUserLoggedIn } from '../../infrastructure/auth';

type TabType = 'cooperation' | 'ranking';

export const SocialScreen: React.FC<MainTabScreenProps<'Social'>> = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('cooperation');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  
  useEffect(() => {
    const loadUserId = async () => {
      const userId = await getCurrentUserId();
      const isLoggedIn = isUserLoggedIn();
      if (userId) {
        setCurrentUserId(userId);
        setLoggedIn(isLoggedIn);
      }
    };
    loadUserId();
  }, []);
  
  // データ取得
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUserId);
  const { data: goals = [], isLoading: isLoadingGoals } = useCooperationGoals(currentUserId);
  const { data: userPoints } = useUserPoints(currentUserId);
  
  // ランキング用のユーザーID（自分 + フレンド）
  const rankingUserIds = [currentUserId, ...friends.map(f => f.id)];
  const { data: ranking = [], isLoading: isLoadingRanking } = useRanking(rankingUserIds);

  // 動的スタイル（テーマ対応）
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    loginPromptContainer: [styles.loginPromptContainer, { backgroundColor: colors.background }],
    loginButton: [styles.loginButton, { backgroundColor: colors.primary }],
    header: [styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    tabButton: [styles.tabButton, { borderBottomColor: colors.border }],
    tabButtonActive: [styles.tabButtonActive, { borderBottomColor: colors.primary }],
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

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={styles.headerTitle}>ソーシャル</Text>
        <TouchableOpacity 
          style={styles.addFriendButton}
          onPress={() => navigation.navigate('FriendsList')}
        >
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('cooperation', '協力モード', 'people')}
        {renderTabButton('ranking', 'ランキング', 'trophy')}
      </View>

      {!loggedIn ? renderLoginPrompt() : activeTab === 'cooperation' ? renderCooperationMode() : renderRankingMode()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: defaultColors.card,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  headerTitle: {
    ...textStyles.h2,
    color: defaultColors.text,
  },
  addFriendButton: {
    padding: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: defaultColors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
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
    height: 8,
    backgroundColor: defaultColors.border,
    borderRadius: 4,
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
});
