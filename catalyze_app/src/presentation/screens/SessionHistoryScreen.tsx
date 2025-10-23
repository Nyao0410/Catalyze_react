/**
 * StudyNext - Session History Screen
 * 計画の全学習セッション履歴を表示する画面
 */

import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { RootStackScreenProps } from '../navigation/types';
import { useStudyPlan, useStudySessions, useDeleteSession } from '../hooks';
import { spacing, colors as defaultColors, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { StudySessionEntity } from 'catalyze-ai';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import InlineMenu from '../components/InlineMenu';

type Props = RootStackScreenProps<'SessionHistory'>;

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
const getPerformanceColor = (colors: any, performanceFactor?: number) => {
  const pf = typeof performanceFactor === 'number' && Number.isFinite(performanceFactor) ? performanceFactor : 0;
  if (pf >= 0.8) return colors.success;
  if (pf >= 0.6) return colors.primary;
  if (pf >= 0.4) return colors.warning;
  return colors.error;
};

export const SessionHistoryScreen: React.FC<Props> = ({ route }) => {
  const { planId } = route.params;
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const deleteSession = useDeleteSession();

  // Use OS default header by setting the navigation title and hiding any custom header UI
  useLayoutEffect(() => {
    navigation.setOptions({
      title: '学習履歴',
    });
  }, [navigation]);

  // データ取得
  const { data: plan, isLoading: planLoading } = useStudyPlan(planId);
  const { data: sessions = [], isLoading: sessionsLoading } = useStudySessions(planId);

  React.useEffect(() => {
    console.log('[SessionHistoryScreen] Rendered with sessions:', {
      planId,
      sessionCount: sessions.length,
      sessions: sessions.slice(0, 3).map((s: any) => ({
        id: s.id,
        date: s.date,
        unitsCompleted: s.unitsCompleted,
      })),
    });
  }, [sessions, planId]);

  // フィルタリングとソート用のステート
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'week' | 'month'>('all');
  const [searchText, setSearchText] = useState('');

  // ローディング状態
  if (planLoading || sessionsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // エラー状態
  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[textStyles.body, { color: colors.error, marginTop: spacing.md }]}>
            計画が見つかりません
          </Text>
        </View>
      </View>
    );
  }

  // フィルター適用
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredSessions = sessions.filter((session) => {
    if (!session.date) return false;
    
    const sessionDate = new Date(session.date);
    if (isNaN(sessionDate.getTime())) return false;
    
    // 日付範囲フィルタ
    if (filterDateRange === 'week' && sessionDate < weekAgo) return false;
    if (filterDateRange === 'month' && sessionDate < monthAgo) return false;

    // 検索テキストフィルタ（ここでは日付で検索）
    if (searchText) {
      const dateStr = format(sessionDate, 'yyyy-MM-dd');
      return dateStr.includes(searchText);
    }

    return true;
  });

  // グループ化してソート
  const groupedSessions = Object.entries(groupSessionsByDate(filteredSessions))
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, daySessions]) => ({
      date,
      sessions: daySessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));

  // 統計情報を計算（フィルタリングされたセッションベース）
  const totalSessions = filteredSessions.length;
  const totalUnits = filteredSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const averageConcentration = filteredSessions.length > 0
    ? Math.round((filteredSessions.reduce((sum, s) => sum + s.concentration, 0) / filteredSessions.length) * 100)
    : 0;

  // 動的スタイル
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    headerCard: [styles.headerCard, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    statCard: [styles.statCard, { backgroundColor: colors.card }],
    sessionCard: [styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }],
    filterButton: (active: boolean) => [
      styles.filterButton,
      active ? { backgroundColor: colors.primary } : { backgroundColor: colors.backgroundSecondary },
    ],
    filterButtonText: (active: boolean) => [
      styles.filterButtonText,
      active ? { color: colors.white } : { color: colors.text },
    ],
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Use OS default header; keep a compact header card below to show plan title */}
      <View style={[dynamicStyles.headerCard, { paddingVertical: spacing.sm }]}> 
        <Text style={[textStyles.body, { color: colors.textSecondary }]}> {plan.title} </Text>
      </View>

      {/* 統計サマリー */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={dynamicStyles.statCard}>
          <Ionicons name="layers-outline" size={24} color={colors.primary} />
          <Text style={[textStyles.h4, { color: colors.text, maxWidth: 72, textAlign: 'center' }]} numberOfLines={1} ellipsizeMode="tail">{totalSessions}</Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, maxWidth: 90, textAlign: 'center' }]}>セッション数</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text style={[textStyles.h4, { color: colors.text, maxWidth: 72, textAlign: 'center' }]} numberOfLines={1} ellipsizeMode="tail">{totalUnits}</Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, maxWidth: 90, textAlign: 'center' }]}> 
            {plan.unit}
          </Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={[textStyles.h4, { color: colors.text, maxWidth: 72, textAlign: 'center' }]} numberOfLines={1} ellipsizeMode="tail">
            {Math.floor(totalMinutes / 60)}h{totalMinutes % 60}m
          </Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, maxWidth: 90, textAlign: 'center' }]}>学習時間</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Ionicons name="pulse-outline" size={24} color={colors.primary} />
          <Text style={[textStyles.h4, { color: colors.text, maxWidth: 72, textAlign: 'center' }]} numberOfLines={1} ellipsizeMode="tail">{averageConcentration}%</Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, maxWidth: 90, textAlign: 'center' }]}>平均集中度</Text>
        </View>
      </ScrollView>

      {/* フィルタボタン */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={dynamicStyles.filterButton(filterDateRange === 'all')}
          onPress={() => setFilterDateRange('all')}
        >
          <Text style={dynamicStyles.filterButtonText(filterDateRange === 'all')}>
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.filterButton(filterDateRange === 'week')}
          onPress={() => setFilterDateRange('week')}
        >
          <Text style={dynamicStyles.filterButtonText(filterDateRange === 'week')}>
            過去7日
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.filterButton(filterDateRange === 'month')}
          onPress={() => setFilterDateRange('month')}
        >
          <Text style={dynamicStyles.filterButtonText(filterDateRange === 'month')}>
            過去30日
          </Text>
        </TouchableOpacity>
      </View>

      {/* セッションリスト */}
      {groupedSessions.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
          <Text style={[textStyles.h3, { color: colors.text, marginTop: spacing.md }]}>
            セッションがありません
          </Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            {filterDateRange === 'all'
              ? 'まだ学習セッションがありません'
              : '選択した期間にセッションがありません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedSessions}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.dateGroupContainer}>
              <Text style={[styles.dateHeader, { color: colors.text }]}>
                {format(new Date(item.date), 'yyyy年MM月dd日 (E)', { locale: ja })}
              </Text>
              {item.sessions.map((session) => (
                <View key={session.id} style={dynamicStyles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTime}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.sessionTimeText, { color: colors.textSecondary }]}>
                        {format(session.date, 'HH:mm', { locale: ja })}
                      </Text>
                    </View>
                    <View style={styles.sessionPerformance}>
                      <View
                        style={[
                          styles.performanceDot,
                          { backgroundColor: getPerformanceColor(colors, session.performanceFactor) },
                        ]}
                      />
                      <Text style={[styles.performanceText, { color: colors.textSecondary }]}>
                        {Math.round(session.performanceFactor * 100)}%
                      </Text>
                    </View>
                    <InlineMenu
                      items={[
                        {
                          key: 'edit-session',
                          label: '編集',
                          icon: <Ionicons name="pencil" size={16} color={colors.primary} />,
                          onPress: () =>
                            navigation.navigate('RecordSession', {
                              planId: plan.id,
                              sessionId: session.id,
                            }),
                        },
                        {
                          key: 'delete-session',
                          label: '削除',
                          icon: <Ionicons name="trash" size={16} color={colors.error} />,
                          color: defaultColors.error,
                          onPress: () => {
                            Alert.alert('確認', 'このセッションを削除しますか？', [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: '削除',
                                style: 'destructive',
                                onPress: () => {
                                  deleteSession.mutate(session.id, {
                                    onSuccess: () => {
                                      try {
                                        queryClient.invalidateQueries({
                                          queryKey: ['studySessions', plan.id],
                                        });
                                      } catch (e) {}
                                    },
                                  });
                                },
                              },
                            ]);
                          },
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionStats}>
                      <View style={styles.sessionStat}>
                        <Ionicons name="book-outline" size={16} color={colors.primary} />
                        <Text style={[styles.sessionStatText, { color: colors.text }]}>
                          {session.unitsCompleted} {plan.unit}
                        </Text>
                      </View>
                      <View style={styles.sessionStat}>
                        <Ionicons name="timer-outline" size={16} color={colors.primary} />
                        <Text style={[styles.sessionStatText, { color: colors.text }]}>
                          {session.durationMinutes}分
                        </Text>
                      </View>
                      <View style={styles.sessionStat}>
                        <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                        <Text style={[styles.sessionStatText, { color: colors.text }]}>
                          難易度 {session.difficulty}/5
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sessionQuality}>
                      <Text style={[styles.sessionQualityLabel, { color: colors.textSecondary }]}>
                        集中度
                      </Text>
                      <View style={[styles.concentrationBar, { backgroundColor: colors.background }]}>
                        <View
                          style={[
                            styles.concentrationFill,
                            { backgroundColor: colors.primary, width: `${session.concentration * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.concentrationText, { color: colors.textSecondary }]}>
                        {Math.round(session.concentration * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default SessionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    padding: spacing.lg,
    backgroundColor: defaultColors.card,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsScroll: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    // Ensure the horizontal stats area has enough height so following elements don't overlap
    minHeight: 96,
  },
  // Add spacing below header card to separate from stats area
  headerSpacer: {
    height: spacing.sm,
  },
  statsContainer: {
    // Use row layout and center alignment to avoid unsupported 'gap' behavior on some RN versions
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    // horizontal spacing between cards handled by card marginRight
  },
  statCard: {
    minWidth: 100,
    padding: spacing.md,
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    alignItems: 'center',
    // prevent cards from shrinking when the container is constrained
    flexShrink: 0,
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    // add a bit of top margin so filters don't visually press into the stats area
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: defaultColors.backgroundSecondary,
  },
  filterButtonText: {
    ...textStyles.caption,
    fontWeight: '600',
    color: defaultColors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  dateGroupContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  dateHeader: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginBottom: spacing.sm,
  },
  sessionCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: defaultColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: defaultColors.textSecondary,
  },
  sessionPerformance: {
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
    color: defaultColors.textSecondary,
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
    color: defaultColors.text,
    fontWeight: '500',
  },
  sessionQuality: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionQualityLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    minWidth: 50,
  },
  concentrationBar: {
    flex: 1,
    height: 6,
    backgroundColor: defaultColors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  concentrationFill: {
    height: '100%',
    backgroundColor: defaultColors.primary,
    borderRadius: 3,
  },
  concentrationText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
