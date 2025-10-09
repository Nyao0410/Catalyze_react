/**
 * StudyNext - Tasks Screen
 * タスク画面（今日・予定タブ）
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { CalendarView } from '../components/CalendarView';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabScreenProps } from '../navigation/types';
import { useDailyTasks, useStudyPlans, useUserSessions, useCreateSession, useTasksForDate, useUpcomingTasks } from '../hooks';
import { useUpdateSession, useDeleteSession } from '../hooks/useStudySessions';
import { TaskCard, EmptyState } from '../components';
import { StudySessionEntity, ProgressAnalysisService, PlanStatus, DailyTaskEntity } from 'catalyze-ai';
import { format, isToday, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { t } from '../../locales';
import { useDueReviewItems, useRecordReview } from '../hooks/useReviewItems';
import { PlansScreen } from './PlansScreen';

type Props = MainTabScreenProps<'Tasks'>;

// パフォーマンス係数に基づいて色を返す関数
const getPerformanceColor = (performanceFactor: number) => {
  if (performanceFactor >= 0.8) return colors.success;
  if (performanceFactor >= 0.6) return colors.primary;
  if (performanceFactor >= 0.4) return colors.warning;
  return colors.error;
};

// セッション記録モーダルのステート
interface SessionForm {
  unitsCompleted: string;
  durationMinutes: string;
  concentration: number;
  difficulty: number;
}

export const TodayScreen: React.FC<Props> = () => {
  const userId = 'user-001'; // TODO: 実際のユーザーIDを取得
  const navigation = useNavigation();
  const [index, setIndex] = useState(1);
  const [routes] = useState([
    { key: 'history', title: '履歴' },
    { key: 'today', title: '今日' },
    { key: 'upcoming', title: '予定' },
  ]);

  // メニュー用のstate
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<StudySessionEntity | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // メニュー操作関数
  const handleMenuPress = (session: StudySessionEntity, event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setSelectedSession(session);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (selectedSession) {
      setMenuVisible(false);
      // 編集画面に遷移（RecordSessionを編集モードで使用）
      navigation.navigate('RecordSession', { 
        planId: selectedSession.planId, 
        sessionId: selectedSession.id
      });
    }
  };

  const handleDelete = () => {
    if (selectedSession) {
      Alert.alert(
        'セッションを削除',
        'この学習セッションを削除しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除',
            style: 'destructive',
            onPress: () => {
              deleteSession.mutate(selectedSession.id, {
                onSuccess: () => {
                  setMenuVisible(false);
                  setSelectedSession(null);
                },
                onError: () => {
                  Alert.alert('エラー', 'セッションの削除に失敗しました');
                },
              });
            },
          },
        ]
      );
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedSession(null);
  };

  const { data: todayTasks = [], isLoading: todayTasksLoading, refetch: refetchToday } = useDailyTasks(userId);
  const { data: plans = [] } = useStudyPlans(userId);
  const { data: sessions = [] } = useUserSessions(userId);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const progressAnalysisService = new ProgressAnalysisService();
  const { isTablet } = useTheme();

  // リフレッシュ処理
  const onRefresh = React.useCallback(async () => {
    await refetchToday();
  }, [refetchToday]);

  // 完了記録ページに遷移
  const handleOpenSessionModal = (task: DailyTaskEntity) => {
    navigation.navigate('RecordSession', { planId: task.planId, taskId: task.id });
  };

  // 履歴タスクコンポーネント
  const HistoryTab = () => {
    const { data: sessions = [], isLoading } = useUserSessions(userId);
    const { data: plans = [] } = useStudyPlans(userId);

    // 日付ごとにセッションをグループ化
    const groupedSessions = React.useMemo(() => {
      const groups: { [date: string]: typeof sessions } = {};
      sessions.forEach((session) => {
        const dateKey = format(session.date, 'yyyy-MM-dd');
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(session);
      });

      // 日付でソート（新しい順）
      return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, sessions]) => ({
          date,
          sessions: sessions.sort((a, b) => b.date.getTime() - a.date.getTime()),
        }));
    }, [sessions]);

    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {groupedSessions.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="学習記録がありません"
            description="学習を始めて記録を残しましょう"
          />
        ) : (
          <FlatList
            data={groupedSessions}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <View style={styles.dateGroup}>
                <Text style={styles.dateHeader}>
                  {format(new Date(item.date), 'yyyy年MM月dd日 (E)', { locale: ja })}
                </Text>
                {item.sessions.map((session) => {
                  const plan = plans.find((p) => p.id === session.planId);
                  return (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.planTitle}>
                          {plan ? plan.title : '不明な計画'}
                        </Text>
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={(event) => handleMenuPress(session, event)}
                        >
                          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
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
                              {session.unitsCompleted} {plan ? plan.unit : 'ユニット'}
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
                  );
                })}
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  };

  // 今日のタスクコンポーネント
  const TodayTab = () => {
    // 完了していないタスクのみ表示
    const activeTasks = todayTasks
      .map((task) => {
        const plan = plans.find((p) => p.id === task.planId);
        if (!plan) return null;

        // 進捗と達成可能性を計算
        const planSessions = sessions.filter((s) => s.planId === plan.id);
        const taskSessions = planSessions.filter((s) => task.round === undefined || s.round === task.round);
        
        // 範囲ベースの進捗計算: タスクの範囲とセッションの範囲の重複を計算
        let completedUnitsInTaskRange = 0;
        taskSessions.forEach((session) => {
          // セッションに範囲情報がある場合は範囲ベースで計算
          if (session.startUnit !== undefined && session.endUnit !== undefined) {
            const overlapStart = Math.max(task.startUnit, session.startUnit);
            const overlapEnd = Math.min(task.endUnit, session.endUnit);
            if (overlapStart <= overlapEnd) {
              completedUnitsInTaskRange += (overlapEnd - overlapStart + 1);
            }
          } else {
            // 範囲情報がない場合は従来通り unitsCompleted を使用（後方互換性）
            completedUnitsInTaskRange += session.unitsCompleted;
          }
        });
        
        const taskProgress = Math.min(completedUnitsInTaskRange / task.units, 1);
        const progress = progressAnalysisService.calculateProgress(plan, planSessions);
        const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

        console.log(`Task ${task.id}: round=${task.round}, range=${task.startUnit}-${task.endUnit}, completedInRange=${completedUnitsInTaskRange}, totalUnits=${task.units}, progress=${taskProgress}, sessions=${taskSessions.length}`);

        return { task, plan, taskProgress, achievability };
      })
      .filter((item) => item !== null && item.taskProgress < 1);

    // 統計サマリーを計算
    const totalUnits = activeTasks.reduce((sum, item) => sum + item!.task.units, 0);
    const totalMinutes = activeTasks.reduce((sum, item) => sum + item!.task.estimatedMinutes, 0);

    if (todayTasksLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text style={textStyles.body}>{t('common.loading')}</Text>
        </View>
      );
    }

    // If tablet, show split view: left calendar + right today's tasks
    if (isTablet) {
      const [selectedDate, setSelectedDate] = useState(new Date());
      const activeTasksForDate = todayTasks.filter((t) => startOfDay(t.date).getTime() === startOfDay(selectedDate).getTime());

      return (
        <View style={styles.splitContainer}>
          <View style={styles.leftPaneCalendar}>
            <CalendarView
              selectedDate={selectedDate}
              onDayPress={(day: { dateString: string }) => setSelectedDate(new Date(day.dateString))}
              markedDates={{}}
            />
          </View>
          <View style={styles.rightPaneTasks}>
            <View style={styles.header}>
              <Text style={textStyles.h1}>{format(selectedDate, 'M月d日(E)', { locale: ja })}</Text>
            </View>
            <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}> 
              <View style={styles.tasksSection}>
                {activeTasksForDate.length === 0 ? (
                  <EmptyState icon="calendar-outline" title={t('today.empty.title')} description={t('today.empty.description')} />
                ) : (
                  activeTasksForDate.map((task) => {
                    const plan = plans.find((p) => p.id === task.planId);
                    if (!plan) return null;
                    // calculate progress simplification
                    const taskSessions = sessions.filter((s) => s.planId === plan.id && s.date >= startOfDay(selectedDate));
                    const completedUnits = taskSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
                    const taskProgress = Math.min(completedUnits / task.units, 1);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        plan={plan}
                        progress={taskProgress}
                        achievability={progressAnalysisService.evaluateAchievability(plan, sessions)}
                        onComplete={() => handleOpenSessionModal(task)}
                      />
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={textStyles.h1}>{t('today.title')}</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'M月d日(E)', { locale: ja })}
          </Text>
        </View>

        {/* サマリーカード */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="list-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{activeTasks.length}</Text>
              <Text style={styles.summaryLabel}>{t('today.summary.plans')}</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{totalUnits}</Text>
              <Text style={styles.summaryLabel}>{t('today.summary.units')}</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryValue}>{Math.round(totalMinutes / 60 * 10) / 10}h</Text>
              <Text style={styles.summaryLabel}>{t('today.summary.estimatedTime')}</Text>
            </View>
          </View>
        </View>

        {/* タスクリスト */}
        <View style={styles.tasksSection}>
          {activeTasks.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={t('today.empty.title')}
              description={t('today.empty.description')}
            />
          ) : (
            activeTasks.map((item) => (
              <TaskCard
                key={item!.task.id}
                task={item!.task}
                plan={item!.plan}
                progress={item!.taskProgress}
                achievability={item!.achievability}
                onComplete={() => handleOpenSessionModal(item!.task)}
              />
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  // 予定のタスクコンポーネント
  const UpcomingTab = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { data: tasksForDate, isLoading: tasksForDateLoading } = useTasksForDate(userId, selectedDate);
    const { data: upcomingTasks = [] } = useUpcomingTasks(userId, 30); // 30日分のタスクを取得

    // タスクがある日をマーク
    const markedDates = React.useMemo(() => {
      const dates: { [key: string]: any } = {};
      upcomingTasks.forEach((task) => {
        const dateKey = format(task.date, 'yyyy-MM-dd');
        dates[dateKey] = { marked: true, dotColor: colors.primary };
      });
      // 選択された日もマーク
      const selectedKey = format(selectedDate, 'yyyy-MM-dd');
      dates[selectedKey] = { 
        selected: true, 
        selectedColor: colors.primary,
        marked: dates[selectedKey]?.marked || false,
        dotColor: dates[selectedKey]?.dotColor || colors.primary
      };
      return dates;
    }, [upcomingTasks, selectedDate]);

    // Tablet: split view with calendar on left and upcoming list on right
    if (isTablet) {
      return (
        <View style={styles.splitContainer}>
          <View style={styles.leftPaneCalendar}>
            <CalendarView selectedDate={selectedDate} onDayPress={(day: { dateString: string }) => setSelectedDate(new Date(day.dateString))} markedDates={{}} />
          </View>
          <View style={styles.rightPaneTasks}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}>
              <View style={styles.tasksSection}>
                {tasksForDateLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : tasksForDate && tasksForDate.length > 0 ? (
                  tasksForDate.map((item) => {
                    const plan = plans.find((p) => p.id === item.planId);
                    if (!plan) return null;
                    // simplified task item
                    const taskSessions = sessions.filter((s) => s.planId === plan.id && s.date >= startOfDay(selectedDate));
                    const completedUnits = taskSessions.reduce((sum, s) => sum + s.unitsCompleted, 0);
                    const taskProgress = Math.min(completedUnits / item.units, 1);
                    return (
                      <TaskCard key={item.id} task={item} plan={plan} progress={taskProgress} achievability={progressAnalysisService.evaluateAchievability(plan, sessions)} onComplete={() => handleOpenSessionModal(item)} />
                    );
                  })
                ) : (
                  <EmptyState icon="calendar-outline" title="この日のタスクはありません" description="別の日を選択するか、学習計画を追加しましょう" />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      >
        {/* カレンダー */}
        <CalendarView
          selectedDate={selectedDate}
          onDayPress={(day: { dateString: string }) => {
            setSelectedDate(new Date(day.dateString));
          }}
          markedDates={markedDates}
        />

        {/* 選択された日のタスク */}
        <View style={styles.tasksSection}>
          <Text style={styles.dateHeader}>
            {format(selectedDate, 'M月d日(E)', { locale: ja })}のタスク
          </Text>
          {tasksForDateLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : tasksForDate && tasksForDate.length > 0 ? (
            tasksForDate
              .map((task) => {
                const plan = plans.find((p) => p.id === task.planId);
                if (!plan) return null;

                // 進捗と達成可能性を計算（範囲ベース）
                const planSessions = sessions.filter((s) => s.planId === plan.id);
                const taskSessions = planSessions.filter((s) => task.round === undefined || s.round === task.round);
                
                // 範囲ベースの進捗計算
                let completedUnitsInTaskRange = 0;
                taskSessions.forEach((session) => {
                  if (session.startUnit !== undefined && session.endUnit !== undefined) {
                    const overlapStart = Math.max(task.startUnit, session.startUnit);
                    const overlapEnd = Math.min(task.endUnit, session.endUnit);
                    if (overlapStart <= overlapEnd) {
                      completedUnitsInTaskRange += (overlapEnd - overlapStart + 1);
                    }
                  } else {
                    completedUnitsInTaskRange += session.unitsCompleted;
                  }
                });
                
                const taskProgress = Math.min(completedUnitsInTaskRange / task.units, 1);
                const progress = progressAnalysisService.calculateProgress(plan, planSessions);
                const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

                return { task, plan, taskProgress, achievability };
              })
              .filter((item) => {
                if (!item) return false;
                // 今日以前の完了(taskProgress >= 1)は除外するが、将来日の完了は残す
                const today = startOfDay(new Date()).getTime();
                const taskDate = startOfDay(item.task.date).getTime();
                const isFuture = taskDate > today;
                if (isFuture) return true; // 将来日は常に表示
                return item.taskProgress < 1; // 今日または過去は未完のみ表示
              })
              .map((item) => (
                <TaskCard
                  key={item!.task.id}
                  task={item!.task}
                  plan={item!.plan}
                  progress={item!.taskProgress}
                  achievability={item!.achievability}
                  onComplete={() => handleOpenSessionModal(item!.task)}
                />
              ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="この日のタスクはありません"
              description="別の日を選択するか、学習計画を追加しましょう"
            />
          )}
        </View>
      </ScrollView>
    );
  };

  const renderScene = SceneMap({
    history: HistoryTab,
    today: TodayTab,
    upcoming: UpcomingTab,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.primary }}
      style={{ backgroundColor: colors.white }}
      labelStyle={{ color: colors.text }}
      activeColor={colors.primary}
      inactiveColor={colors.textSecondary}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: 100 }}
      />
      
      {/* メニューModal */}
      {menuVisible && (
        <TouchableOpacity style={styles.menuOverlay} onPress={closeMenu}>
          <View
            style={[
              styles.menuModal,
              {
                position: 'absolute',
                left: menuPosition.x - 180, // メニューの幅分左にずらす
                top: menuPosition.y - 100, // もう少し上に表示
                zIndex: 1000, // 最前面に表示
              },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>編集</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>削除</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryTextContainer: {
    alignItems: 'center',
  },
  summaryValue: {
    ...textStyles.h2,
    color: colors.primary,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  dateHeader: {
    ...textStyles.h4,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tasksSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...textStyles.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingButtonText: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  ratingButtonTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  planCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planStatus: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.xl * 2,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  sessionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planTitle: {
    ...textStyles.h4,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
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
  // メニューModalスタイル
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 背景を暗くしない
  },
  menuModal: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuItemText: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  // Split view for tablet: calendar on left, tasks on right
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  leftPaneCalendar: {
    width: '36%',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.white,
  },
  rightPaneTasks: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    padding: spacing.md,
  },
});
