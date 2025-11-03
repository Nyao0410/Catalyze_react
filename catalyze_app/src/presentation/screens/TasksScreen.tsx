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
  useWindowDimensions,
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { CalendarView } from '../components/CalendarView';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, textStyles, colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabScreenProps } from '../navigation/types';
import { useDailyTasks, useStudyPlans, useUserSessions, useCreateSession, useTasksForDate, useUpcomingTasks } from '../hooks';
import { useUpdateSession, useDeleteSession } from '../hooks/useStudySessions';
import { useCreateDailyReviewTasks } from '../hooks/useCreateDailyReviewTasks';
import { TaskCard, EmptyState } from '../components';
import { StudySessionEntity, ProgressAnalysisService, PlanStatus, DailyTaskEntity } from 'catalyze-ai';
import { format, isToday, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { t } from '../../locales';
import { useDueReviewItems, useRecordReview, useUserReviewItems } from '../hooks/useReviewItems';
import { PlansScreen } from './PlansScreen';
import {
  parseLocalDate,
  getPerformanceColor,
  mergeRanges,
  mergeUnitsToRanges,
  extractCompletedRanges,
  calculateCompletedUnits,
  calculateTaskProgress,
  formatDateHeader,
  formatDateShort,
  formatTime,
  groupSessionsByDate,
} from './tasks/utils';
import { useTodayActiveTasks } from './tasks/useTasksHooks';

const progressAnalysisService = new ProgressAnalysisService();

type Props = MainTabScreenProps<'Tasks'>;

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
  const { isTablet, colors } = useTheme();
  const { width } = useWindowDimensions();
  // default index: on phone show 'today' (index 1), on tablet show first tab (history)
  const [index, setIndex] = useState<number>(isTablet ? 0 : 1);
  const routes = React.useMemo(() => {
    return isTablet
      ? [
          { key: 'history', title: '履歴' },
          { key: 'upcoming', title: '予定' },
        ]
      : [
          { key: 'history', title: '履歴' },
          { key: 'today', title: '今日' },
          { key: 'upcoming', title: '予定' },
        ];
  }, [isTablet]);

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
      // 削除は破壊的操作なので確認ダイアログを表示してから実行する
      Alert.alert(
        '確認',
        'このセッションを削除しますか？',
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
                  // エラーはアラートで通知
                  Alert.alert('エラー', 'セッションの削除に失敗しました');
                },
              });
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedSession(null);
  };

  // セッションアイテムカードコンポーネント
  const SessionItemCard: React.FC<{
    session: StudySessionEntity;
    plan?: any;
    colors: any;
    onMenuPress: (session: StudySessionEntity, event: any) => void;
  }> = ({ session, plan, colors, onMenuPress }) => (
    <View style={dynamicStyles.sessionCard}>
      <View style={styles.cardHeader}>
        <Text style={dynamicStyles.planTitle}>
          {plan ? plan.title : '不明な計画'}
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(event) => onMenuPress(session, event)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionTime}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={dynamicStyles.sessionTimeText}>
            {formatTime(session.date)}
          </Text>
        </View>
        <View style={styles.performanceIndicator}>
          <View
            style={[
              styles.performanceDot,
              { backgroundColor: getPerformanceColor(session.performanceFactor, colors) },
            ]}
          />
          <Text style={dynamicStyles.performanceText}>
            {Math.round(session.performanceFactor * 100)}%
          </Text>
        </View>
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Ionicons name="book-outline" size={16} color={colors.primary} />
            <Text style={dynamicStyles.sessionStatText}>
              {session.unitsCompleted} {plan ? plan.unit : 'ユニット'}
            </Text>
          </View>
          <View style={styles.sessionStat}>
            <Ionicons name="timer-outline" size={16} color={colors.primary} />
            <Text style={dynamicStyles.sessionStatText}>
              {session.durationMinutes}分
            </Text>
          </View>
          <View style={styles.sessionStat}>
            <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
            <Text style={dynamicStyles.sessionStatText}>
              難易度 {session.difficulty}/5
            </Text>
          </View>
        </View>
        <View style={styles.sessionQuality}>
          <Text style={dynamicStyles.sessionQualityLabel}>集中度</Text>
          <View style={dynamicStyles.concentrationBar}>
            <View
              style={[
                dynamicStyles.concentrationFill,
                { width: `${session.concentration * 100}%` },
              ]}
            />
          </View>
          <Text style={dynamicStyles.concentrationText}>
            {Math.round(session.concentration * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );

  const { data: todayTasks = [], isLoading: todayTasksLoading, refetch: refetchToday } = useDailyTasks(userId);
  const { data: plans = [] } = useStudyPlans(userId);
  const { data: sessions = [] } = useUserSessions(userId);
  const { data: dueReviewItems = [] } = useDueReviewItems(userId);
  const { data: allReviewItems = [] } = useUserReviewItems(userId); // 全ての復習アイテム（カレンダーマーク用）
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  // リフレッシュ処理
  const onRefresh = React.useCallback(async () => {
    await refetchToday();
  }, [refetchToday]);

  // 完了記録ページに遷移
  const handleOpenSessionModal = (task: DailyTaskEntity) => {
    navigation.navigate('RecordSession', { planId: task.planId, taskId: task.id });
  };

  // タイマー画面に遷移
  const handleStartTimer = (task: DailyTaskEntity) => {
    navigation.navigate('TimerScreen', {
      planId: task.planId,
      taskId: task.id,
      startUnit: task.startUnit,
      endUnit: task.endUnit,
    });
  };

  // タスク完了ハンドリング: レビュータスクなら ReviewEvaluation へ遷移、それ以外は記録モーダルへ
  const handleTaskComplete = (itemOrTask: any, maybeTask?: any) => {
    const wrapper = itemOrTask;
    const taskObj = maybeTask || (wrapper && (wrapper.task || wrapper));
    
    // 将来のタスク（予定タブで選択した日付）かどうかを判定
    // wrapper.task が存在する場合、それが日次タスク（今日や将来のタスク）
    const isFutureTask = wrapper && wrapper.task && !wrapper.type;
    
    // Detect review tasks by multiple signals:
    // - wrapper.type === 'review' (constructed wrapper)
    // - explicit reviewItemIds on the taskObj
    // - synthetic review task id prefix 'review-'
    const isReviewType = wrapper && wrapper.type === 'review';
    const hasReviewIds = taskObj && (taskObj.reviewItemIds && taskObj.reviewItemIds.length > 0);
    const isReviewIdName = taskObj && typeof taskObj.id === 'string' && String(taskObj.id).startsWith('review-');
    if (isReviewType || hasReviewIds || isReviewIdName) {
      const ids: string[] | undefined = taskObj && taskObj.reviewItemIds && taskObj.reviewItemIds.length > 0 ? taskObj.reviewItemIds : undefined;
      if (ids && ids.length > 0) {
        // Open the RecordSession screen prefilled for the review range so user records a session instead of separate evaluation
        navigation.navigate('RecordSession', { planId: taskObj.planId, startUnit: taskObj.startUnit, endUnit: taskObj.endUnit });
        return;
      }
      // Fallback: if task id encodes a single review or no underlying ids available, attempt single-item navigation
      const reviewId = (taskObj && taskObj.reviewItemIds && taskObj.reviewItemIds.length > 0) ? taskObj.reviewItemIds[0] : null;
      if (reviewId) {
        // Try to resolve review item from dueReviewItems (fetched at top of component) to get plan/unit
        try {
          const found = dueReviewItems.find((r: any) => r.id === reviewId);
          if (found) {
            const unit = typeof found.unitNumber === 'number' ? found.unitNumber : Number(found.unitNumber);
            if (!Number.isNaN(unit)) {
              navigation.navigate('RecordSession', { planId: found.planId, startUnit: unit, endUnit: unit });
              return;
            }
          }
        } catch (e) {
          // ignore and fall back
        }
        // fallback: if we have taskObj context, open RecordSession with its range
        if (taskObj && taskObj.planId) {
          navigation.navigate('RecordSession', { planId: taskObj.planId, startUnit: taskObj.startUnit, endUnit: taskObj.endUnit });
          return;
        }
        // final fallback: open session modal for taskObj
        return;
      }
      // If we detected a synthetic review task (id startsWith 'review-') but no underlying ids, still navigate to the evaluation screen
      // so the user can see context; ReviewEvaluation will no-op if there are no ids — this is better than opening the session recorder.
      if (isReviewIdName) {
        navigation.navigate('RecordSession', { planId: taskObj?.planId, startUnit: taskObj?.startUnit, endUnit: taskObj?.endUnit });
        return;
      }
    }
    
    // 将来のタスクの場合、範囲指定モードで RecordSession を開く
    if (isFutureTask && taskObj && taskObj.startUnit !== undefined && taskObj.endUnit !== undefined) {
      navigation.navigate('RecordSession', { 
        planId: taskObj.planId, 
        startUnit: taskObj.startUnit, 
        endUnit: taskObj.endUnit 
      });
      return;
    }
    
    // fallback: open session modal
    if (taskObj) handleOpenSessionModal(taskObj);
  };

  // 履歴タスクコンポーネント
  const HistoryTab = () => {
    const { data: sessions = [], isLoading } = useUserSessions(userId);
    const { data: plans = [] } = useStudyPlans(userId);

    // 日付ごとにセッションをグループ化
    const groupedSessions = React.useMemo(() => groupSessionsByDate(sessions), [sessions]);

    if (isLoading) {
      return (
        <View style={dynamicStyles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={dynamicStyles.container}>
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
                <Text style={dynamicStyles.dateHeader}>
                  {formatDateHeader(new Date(item.date))}
                </Text>
                {item.sessions.map((session) => {
                  const plan = plans.find((p) => p.id === session.planId);
                  return (
                    <SessionItemCard
                      key={session.id}
                      session={session}
                      plan={plan}
                      colors={colors}
                      onMenuPress={handleMenuPress}
                    />
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
    // 復習タスク自動作成フック呼び出し
    useCreateDailyReviewTasks(userId, todayTasks, sessions, plans);
    
    // 完了していないタスクと今日の復習タスクをマージして表示
    // useTodayActiveTasksフックを使って復習タスクを含めた全てのタスクを取得
    const activeTasks = useTodayActiveTasks(todayTasks, plans, sessions, dueReviewItems, progressAnalysisService);

    // 統計サマリーを計算
    const totalUnits = activeTasks.reduce((sum, item) => sum + (item?.task?.units || 0), 0);
    const totalMinutes = activeTasks.reduce((sum, item) => {
      const task = item?.task;
      // estimatedMinutesが定義されている場合はそれを使用、そうでない場合はestimatedDuration（ミリ秒）を分に変換
      const minutes = task?.estimatedMinutes || (task?.estimatedDuration ? task.estimatedDuration / (1000 * 60) : 0);
      return sum + minutes;
    }, 0);

    if (todayTasksLoading) {
      return (
        <View style={dynamicStyles.centerContainer}>
          <Text style={textStyles.body}>{t('common.loading')}</Text>
        </View>
      );
    }

    // If tablet, show split view: left calendar + right today's tasks
  if (isTablet) {
      const [selectedDate, setSelectedDate] = useState(new Date());
      const activeTasksForDate = todayTasks.filter((t) => startOfDay(t.date).getTime() === startOfDay(selectedDate).getTime());
      // merged tasks (daily + review) for the selected date
      const mergedActiveTasksForDate = activeTasks.filter((it) => {
        const taskObj = (it as any).task || it;
        const taskDate = taskObj.date instanceof Date ? taskObj.date : new Date(taskObj.date);
        return startOfDay(taskDate).getTime() === startOfDay(selectedDate).getTime();
      });

      // load upcoming tasks to compute marked dates for the calendar on tablet
      const { data: upcomingTasks = [] } = useUpcomingTasks(userId, 30);
      const markedDates = React.useMemo(() => {
        const dates: { [key: string]: any } = {};
        
        // 日次タスクをマーク
        upcomingTasks.forEach((task) => {
          try {
            const taskDate = task.date instanceof Date ? task.date : new Date(task.date);
            const dateKey = format(startOfDay(taskDate), 'yyyy-MM-dd');
            dates[dateKey] = { marked: true, dotColor: colors.primary };
          } catch (e) {
            console.warn('[TasksScreen:TodayTab] Failed to format task date:', e);
          }
        });
        
        // 全ての復習アイテムをマーク
        allReviewItems.forEach((reviewItem) => {
          try {
            const reviewDate = reviewItem.nextReviewDate instanceof Date 
              ? reviewItem.nextReviewDate 
              : new Date(reviewItem.nextReviewDate);
            const dateKey = format(startOfDay(reviewDate), 'yyyy-MM-dd');
            dates[dateKey] = { marked: true, dotColor: colors.primary };
          } catch (e) {
            console.warn('[TasksScreen:TodayTab] Failed to format review date:', e);
          }
        });
        
        // 選択された日もマーク
        const selectedKey = format(startOfDay(selectedDate), 'yyyy-MM-dd');
        dates[selectedKey] = {
          selected: true,
          selectedColor: colors.primary,
          marked: dates[selectedKey]?.marked || false,
          dotColor: dates[selectedKey]?.dotColor || colors.primary,
        };
        return dates;
      }, [upcomingTasks, selectedDate, allReviewItems, colors]);

      return (
        <View style={dynamicStyles.splitContainer}>
          <View style={dynamicStyles.leftPaneCalendar}>
            <CalendarView
              selectedDate={selectedDate}
              onDayPress={(day: { dateString: string }) => setSelectedDate(parseLocalDate(day.dateString))}
              markedDates={markedDates}
            />
          </View>
          <View style={dynamicStyles.rightPaneTasks}>
            <View style={dynamicStyles.header}>
              <Text style={textStyles.h1}>{formatDateShort(selectedDate)}</Text>
            </View>
            <ScrollView style={dynamicStyles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}> 
              <View style={styles.tasksSection}>
                {mergedActiveTasksForDate.length === 0 ? (
                  <EmptyState icon="calendar-outline" title={t('today.empty.title')} description={t('today.empty.description')} />
                ) : (
                  mergedActiveTasksForDate.map((item) => {
                    const taskObj = (item as any).task || item;
                    const plan = (item as any).plan || plans.find((p) => p.id === taskObj.planId);
                    if (!plan) return null;
                    return (
                      <TaskCard
                        key={taskObj.id}
                        task={taskObj}
                        plan={plan}
                        progress={(item as any).taskProgress ?? 0}
                        achievability={(item as any).achievability ?? progressAnalysisService.evaluateAchievability(plan, sessions)}
                        onComplete={() => handleTaskComplete(item, taskObj)}
                        onStartTimer={() => handleStartTimer(taskObj)}
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
        style={dynamicStyles.container}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー */}
        <View style={dynamicStyles.header}>
          <Text style={textStyles.h1}>{t('today.title')}</Text>
          <Text style={dynamicStyles.dateText}>
            {formatDateShort(new Date())}
          </Text>
        </View>

        {/* サマリーカード */}
        <View style={dynamicStyles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="list-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={dynamicStyles.summaryValue}>{activeTasks.length}</Text>
              <Text style={dynamicStyles.summaryLabel}>{t('today.summary.plans')}</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={dynamicStyles.summaryValue}>{totalUnits}</Text>
              <Text style={dynamicStyles.summaryLabel}>{t('today.summary.units')}</Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <View style={styles.summaryTextContainer}>
              <Text style={dynamicStyles.summaryValue}>{Math.round(totalMinutes / 60 * 10) / 10}h</Text>
              <Text style={dynamicStyles.summaryLabel}>{t('today.summary.estimatedTime')}</Text>
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
            activeTasks.map((item) => {
              const taskObj = item!.task || item;
              const plan = item!.plan || plans.find((p) => p.id === taskObj.planId);
              if (!plan) return null;
              return (
                <TaskCard
                    key={taskObj.id}
                    task={taskObj}
                    plan={plan}
                    progress={item!.taskProgress ?? 0}
                    achievability={item!.achievability ?? progressAnalysisService.evaluateAchievability(plan, sessions)}
                    onComplete={() => handleTaskComplete(item)}
                    onStartTimer={() => handleStartTimer(taskObj)}
                  />
              );
            })
          )}
        </View>

        {/* 今後の復習予定セクション */}
        <UpcomingReviewsSection userId={userId} />
      </ScrollView>
    );
  };

  // 今後の復習予定セクション
  const UpcomingReviewsSection = ({ userId }: { userId: string }) => {
    const { data: allReviewItems = [] } = useUserReviewItems(userId);
    const today = startOfDay(new Date());

    // 明日以降の復習を抽出してグループ化
    const upcomingReviews = React.useMemo(() => {
      const grouped: { [dateKey: string]: { date: Date; items: any[] } } = {};

      allReviewItems.forEach((reviewItem) => {
        const reviewDate = startOfDay(new Date(reviewItem.nextReviewDate));
        // 本日より後の復習のみ
        if (reviewDate.getTime() <= today.getTime()) return;

        const dateKey = format(reviewDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = { date: reviewDate, items: [] };
        }
        grouped[dateKey].items.push(reviewItem);
      });

      // 日付でソート
      return Object.values(grouped)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 7); // 今後7日分のみ表示
    }, [allReviewItems]);

    if (upcomingReviews.length === 0) {
      return null;
    }

    return (
      <View style={[styles.tasksSection, { marginTop: spacing.lg }]}>
        <Text style={[styles.dateHeader, { paddingHorizontal: spacing.md, marginBottom: spacing.md }]}>
          今後の復習予定
        </Text>
        {upcomingReviews.map(({ date, items }) => (
          <View key={format(date, 'yyyy-MM-dd')} style={{ marginBottom: spacing.md }}>
            <Text style={[textStyles.caption, { color: colors.textSecondary, paddingHorizontal: spacing.md, marginBottom: spacing.sm }]}>
              {format(date, 'M月d日(E)', { locale: ja })} - {items.length}個の復習
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // 予定のタスクコンポーネント
  const UpcomingTab = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { data: tasksForDate, isLoading: tasksForDateLoading } = useTasksForDate(userId, selectedDate);
    const { data: upcomingTasks = [] } = useUpcomingTasks(userId, 30); // 30日分のタスクを取得

    // デバッグログ: 選択日付が変わるたびにログ出力
    React.useEffect(() => {
      console.log('[TasksScreen:UpcomingTab] Date changed:', {
        selectedDate: format(selectedDate, 'yyyy-MM-dd'),
        tasksForDateCount: tasksForDate?.length || 0,
        tasks: tasksForDate?.map(t => ({
          id: t.id.substring(0, 50),
          startUnit: t.startUnit,
          endUnit: t.endUnit,
          units: t.units,
        })) || [],
      });
    }, [selectedDate, tasksForDate]);

    // 選択日付の復習タスクを構築
    const reviewTasksForDate = React.useMemo(() => {
      try {
        const selectedDateKey = startOfDay(selectedDate).getTime();
        const result: any[] = [];
        
        // group review items by planId + date for selected date only
        const groups: { [key: string]: { planId: string; date: Date; units: Array<{unit: number; id: string}> } } = {};
        allReviewItems.forEach((r) => {
          const reviewDate = startOfDay(new Date(r.nextReviewDate));
          // 選択日付の復習アイテムのみ処理
          if (reviewDate.getTime() !== selectedDateKey) return;
          const key = `${r.planId}_${reviewDate.getTime()}`;
          groups[key] = groups[key] || { planId: r.planId, date: reviewDate, units: [] };
          const n = Number(r.unitNumber);
          if (!Number.isNaN(n)) groups[key].units.push({ unit: n, id: r.id });
        });

        for (const key of Object.keys(groups)) {
          const { planId, date, units } = groups[key];
          const plan = plans.find((p) => p.id === planId);
          if (!plan) continue;
          const unitNumbers = units.map((u) => u.unit);
          const ranges = mergeUnitsToRanges(unitNumbers);
          // ★修正: 復習タスク完了判定用に、選択日付のセッションを取得
          // ただしセッションは同じ日に記録されるとは限らないため、全セッションから該当範囲のものを抽出
          const planSessions = sessions.filter((s) => s.planId === planId && startOfDay(s.date).getTime() === selectedDateKey);
          
          ranges.forEach((r, idx) => {
            const reviewTask = {
              id: `review-${planId}-${date.getTime()}-${r.start}-${r.end}-${idx}`,
              planId,
              date,
              startUnit: r.start,
              endUnit: r.end,
              units: r.units,
              estimatedMinutes: r.units * 5,
              round: 1,
              advice: t('today.review.advice') || '復習しましょう！',
              reviewItemIds: units
                .filter((u) => u.unit >= r.start && u.unit <= r.end)
                .map((u) => u.id),
            } as any;

            const completedReviewRanges: Array<{ start: number; end: number }> = [];
            planSessions.forEach((s) => {
              if (s.startUnit !== undefined && s.endUnit !== undefined) {
                const overlapStart = Math.max(r.start, s.startUnit);
                const overlapEnd = Math.min(r.end, s.endUnit);
                if (overlapStart <= overlapEnd) {
                  completedReviewRanges.push({ start: overlapStart, end: overlapEnd });
                }
              }
            });
            
            // マージして重複を排除（utils.tsの関数を使用）
            const mergedReviewCompleted = mergeRanges(completedReviewRanges);
            const completed = mergedReviewCompleted.reduce((sum, rng) => sum + (rng.end - rng.start + 1), 0);

            const taskProgress = Math.min(completed / r.units, 1);
            const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

            if (taskProgress < 1) result.push({ type: 'review' as const, task: reviewTask, plan, taskProgress, achievability });
          });
        }

        return result;
      } catch (e) {
        return [];
      }
    }, [selectedDate, allReviewItems, plans, sessions, progressAnalysisService, colors]);

    // タスクがある日をマーク
    const markedDates = React.useMemo(() => {
      const dates: { [key: string]: any } = {};
      
      // 日次タスクをマーク
      upcomingTasks.forEach((task) => {
        try {
          const taskDate = task.date instanceof Date ? task.date : new Date(task.date);
          const dateKey = format(startOfDay(taskDate), 'yyyy-MM-dd');
          dates[dateKey] = { marked: true, dotColor: colors.primary };
        } catch (e) {
          console.warn('[TasksScreen] Failed to format task date:', e);
        }
      });
      
      // 全ての復習アイテム（今後30日分）をマーク
      allReviewItems.forEach((reviewItem) => {
        try {
          const reviewDate = reviewItem.nextReviewDate instanceof Date 
            ? reviewItem.nextReviewDate 
            : new Date(reviewItem.nextReviewDate);
          const dateKey = format(startOfDay(reviewDate), 'yyyy-MM-dd');
          dates[dateKey] = { marked: true, dotColor: colors.primary };
        } catch (e) {
          console.warn('[TasksScreen] Failed to format review date:', e);
        }
      });
      
      // 選択された日もマーク
      const selectedKey = format(startOfDay(selectedDate), 'yyyy-MM-dd');
      dates[selectedKey] = { 
        selected: true, 
        selectedColor: colors.primary,
        marked: dates[selectedKey]?.marked || false,
        dotColor: dates[selectedKey]?.dotColor || colors.primary
      };
      
      // デバッグログ: マークされた日付の確認
      console.log('[TasksScreen:UpcomingTab] markedDates computed:', {
        totalMarkedDates: Object.keys(dates).length,
        upcomingTasksCount: upcomingTasks.length,
        reviewItemsCount: allReviewItems.length,
        sample: Object.keys(dates).slice(0, 5),
      });
      
      return dates;
    }, [upcomingTasks, selectedDate, allReviewItems, colors]);

    // Tablet: split view with calendar on left and upcoming list on right
    if (isTablet) {
      return (
        <View style={dynamicStyles.splitContainer}>
          <View style={dynamicStyles.leftPaneCalendar}>
            <CalendarView selectedDate={selectedDate} onDayPress={(day: { dateString: string }) => setSelectedDate(parseLocalDate(day.dateString))} markedDates={markedDates} />
          </View>
          <View style={dynamicStyles.rightPaneTasks}>
            <ScrollView style={dynamicStyles.container} contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}>
              <View style={styles.tasksSection}>
                {tasksForDateLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (tasksForDate && tasksForDate.length > 0) || reviewTasksForDate.length > 0 ? (
                  <>
                    {tasksForDate && tasksForDate.map((item) => {
                      const plan = plans.find((p) => p.id === item.planId);
                      if (!plan) return null;
                      // 復習タスクかどうかを判定
                      const isReview = String(item.id).startsWith('review-');
                      // simplified task item
                      const taskSessions = sessions.filter((s) => s.planId === plan.id && startOfDay(s.date).getTime() === startOfDay(selectedDate).getTime());
                      // 範囲ベースで完了ユニット数を計算
                      const completedRanges: Array<{ start: number; end: number }> = [];
                      taskSessions.forEach((session) => {
                        if (session.startUnit !== undefined && session.endUnit !== undefined) {
                          const overlapStart = Math.max(item.startUnit, session.startUnit);
                          const overlapEnd = Math.min(item.endUnit, session.endUnit);
                          if (overlapStart <= overlapEnd) {
                            completedRanges.push({ start: overlapStart, end: overlapEnd });
                          }
                        }
                      });
                      // 重複を排除してマージ
                      const mergedRanges = (ranges: Array<{ start: number; end: number }>) => {
                        if (ranges.length === 0) return [];
                        const sorted = ranges.sort((a, b) => a.start - b.start);
                        const merged: Array<{ start: number; end: number }> = [sorted[0]];
                        for (let i = 1; i < sorted.length; i++) {
                          const last = merged[merged.length - 1];
                          if (sorted[i].start <= last.end + 1) {
                            last.end = Math.max(last.end, sorted[i].end);
                          } else {
                            merged.push(sorted[i]);
                          }
                        }
                        return merged;
                      };
                      const mergedCompleted = mergedRanges(completedRanges);
                      const completedUnitsInTaskRange = mergedCompleted.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
                      const taskProgress = Math.min(completedUnitsInTaskRange / item.units, 1);
                      return (
                        <TaskCard key={item.id} task={item} plan={plan} progress={taskProgress} achievability={progressAnalysisService.evaluateAchievability(plan, sessions)} onComplete={() => handleTaskComplete(item)} onStartTimer={() => handleStartTimer(item)} />
                      );
                    })}
                    {reviewTasksForDate.map((item) => {
                      const taskObj = item.task;
                      const plan = item.plan;
                      return (
                        <TaskCard
                          key={taskObj.id}
                          task={taskObj}
                          plan={plan}
                          progress={item.taskProgress}
                          achievability={item.achievability}
                          onComplete={() => handleTaskComplete(item, taskObj)}
                          onStartTimer={() => handleStartTimer(taskObj)}
                        />
                      );
                    })}
                  </>
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
        style={[dynamicStyles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      >
        {/* カレンダー */}
        <CalendarView
          selectedDate={selectedDate}
          onDayPress={(day: { dateString: string }) => {
            setSelectedDate(parseLocalDate(day.dateString));
          }}
          markedDates={markedDates}
        />

        <View style={styles.tasksSection}>
          <Text style={[styles.dateHeader, { color: colors.text }]}>
            {formatDateShort(selectedDate)}のタスク
          </Text>
          {tasksForDateLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (tasksForDate && tasksForDate.length > 0) || reviewTasksForDate.length > 0 ? (
            <>
              {tasksForDate &&
                tasksForDate
                  .map((task) => {
                    const plan = plans.find((p) => p.id === task.planId);
                    if (!plan) return null;

                    // 進捗と達成可能性を計算（範囲ベース）
                    // ★修正: 選択日付のセッションのみをフィルタリング
                    const planSessions = sessions.filter((s) => s.planId === plan.id && startOfDay(s.date).getTime() === startOfDay(selectedDate).getTime());
                    
                    // 範囲ベースの進捗計算: セッションの完了範囲をマージしてから計算（重複を避ける）
                    const completedRanges: Array<{ start: number; end: number }> = [];
                    planSessions.forEach((session) => {
                      if (session.startUnit !== undefined && session.endUnit !== undefined) {
                        const overlapStart = Math.max(task.startUnit, session.startUnit);
                        const overlapEnd = Math.min(task.endUnit, session.endUnit);
                        if (overlapStart <= overlapEnd) {
                          completedRanges.push({ start: overlapStart, end: overlapEnd });
                        }
                      }
                    });
                    
                    // 重複を排除するためにマージ（utils.tsの関数を使用）
                    const mergedCompleted = mergeRanges(completedRanges);
                    const completedUnitsInTaskRange = mergedCompleted.reduce((sum, r) => sum + (r.end - r.start + 1), 0);
                    
                    const taskProgress = Math.min(completedUnitsInTaskRange / task.units, 1);
                    // ★修正: 完了したタスク（taskProgress === 1）はフィルタリングで除外するためにnullを返す
                    if (taskProgress === 1) return null;
                    
                    const progress = progressAnalysisService.calculateProgress(plan, planSessions);
                    const achievability = progressAnalysisService.evaluateAchievability(plan, planSessions);

                    return { task, plan, taskProgress, achievability };
                  })
                  .filter((item) => item !== null)
                  .map((item) => (
                    <TaskCard
                      key={item!.task.id}
                      task={item!.task}
                      plan={item!.plan}
                      progress={item!.taskProgress}
                      achievability={item!.achievability}
                      onComplete={() => handleTaskComplete(item)}
                      onStartTimer={() => handleStartTimer(item!.task)}
                    />
                  ))}
              {reviewTasksForDate.map((item) => {
                const taskObj = item.task;
                const plan = item.plan;
                return (
                  <TaskCard
                    key={taskObj.id}
                    task={taskObj}
                    plan={plan}
                    progress={item.taskProgress}
                    achievability={item.achievability}
                    onComplete={() => handleTaskComplete(item, taskObj)}
                    onStartTimer={() => handleStartTimer(taskObj)}
                  />
                );
              })}
            </>
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

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'history':
        return <HistoryTab />;
      case 'today':
        return <TodayTab />;
      case 'upcoming':
        return <UpcomingTab />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.primary }}
      style={{ backgroundColor: colors.card }}
      labelStyle={{ color: colors.text }}
      activeColor={colors.primary}
      inactiveColor={colors.textSecondary}
    />
  );

  // Ensure index is within bounds if routes change (e.g., switching to tablet)
  const clampedIndex = Math.max(0, Math.min(index, routes.length - 1));

  // 動的スタイル（テーマ対応）
  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    centerContainer: [styles.centerContainer, { backgroundColor: colors.background }],
    header: [styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }],
    dateText: [styles.dateText, { color: colors.textSecondary }],
    summaryCard: [styles.summaryCard, { backgroundColor: colors.card }],
    summaryValue: [styles.summaryValue, { color: colors.primary }],
    summaryLabel: [styles.summaryLabel, { color: colors.textSecondary }],
    dateHeader: [styles.dateHeader, { color: colors.text }],
    sessionCard: [styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }],
    planTitle: [styles.planTitle, { color: colors.text }],
    sessionTimeText: [styles.sessionTimeText, { color: colors.textSecondary }],
    performanceText: [styles.performanceText, { color: colors.textSecondary }],
    sessionStatText: [styles.sessionStatText, { color: colors.text }],
    sessionQualityLabel: [styles.sessionQualityLabel, { color: colors.textSecondary }],
    concentrationBar: [styles.concentrationBar, { backgroundColor: colors.background }],
    concentrationFill: [styles.concentrationFill, { backgroundColor: colors.primary }],
    concentrationText: [styles.concentrationText, { color: colors.textSecondary }],
    menuModal: [styles.menuModal, { backgroundColor: colors.card }],
    menuItemText: [styles.menuItemText, { color: colors.text }],
    menuDivider: [styles.menuDivider, { backgroundColor: colors.border }],
    splitContainer: [styles.splitContainer, { backgroundColor: colors.background }],
    leftPaneCalendar: [styles.leftPaneCalendar, { borderRightColor: colors.border, backgroundColor: colors.card }],
    rightPaneTasks: [styles.rightPaneTasks, { backgroundColor: colors.background }],
  };

  return (
    <View style={{ flex: 1 }}>
      <TabView
        key={Math.round(width)}
        navigationState={{ index: clampedIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: Math.max(320, width) }}
      />
      
      {/* メニューModal */}
      {menuVisible && (
        <TouchableOpacity style={styles.menuOverlay} onPress={closeMenu}>
          <View
            style={[
              dynamicStyles.menuModal,
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
              <Text style={dynamicStyles.menuItemText}>編集</Text>
            </TouchableOpacity>
            <View style={dynamicStyles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={[dynamicStyles.menuItemText, { color: colors.error }]}>削除</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

// For backward compatibility tests/imports expecting a default export
export default TodayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
    paddingVertical: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultColors.background,
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultColors.card,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  dateText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: defaultColors.card,
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
    color: defaultColors.primary,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  dateHeader: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tasksSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  modalContent: {
    backgroundColor: defaultColors.card,
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
    borderColor: defaultColors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: defaultColors.background,
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
    borderColor: defaultColors.border,
    backgroundColor: defaultColors.background,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: defaultColors.primary,
    borderColor: defaultColors.primary,
  },
  ratingButtonText: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  ratingButtonTextActive: {
    color: defaultColors.white,
  },
  saveButton: {
    backgroundColor: defaultColors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...textStyles.button,
    color: defaultColors.white,
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
    borderColor: defaultColors.border,
    backgroundColor: defaultColors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: defaultColors.primary,
    borderColor: defaultColors.primary,
  },
  filterButtonText: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: defaultColors.white,
  },
  createButton: {
    backgroundColor: defaultColors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createButtonText: {
    ...textStyles.button,
    color: defaultColors.white,
  },
  planCard: {
    backgroundColor: defaultColors.card,
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
    color: defaultColors.textSecondary,
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
    backgroundColor: defaultColors.primary,
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
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
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
    color: defaultColors.text,
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
    color: defaultColors.textSecondary,
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
    backgroundColor: defaultColors.card,
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
    color: defaultColors.text,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: defaultColors.border,
    marginHorizontal: spacing.sm,
  },
  // Split view for tablet: calendar on left, tasks on right
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: defaultColors.background,
  },
  leftPaneCalendar: {
    width: '36%',
    borderRightWidth: 1,
    borderRightColor: defaultColors.border,
    backgroundColor: defaultColors.card,
  },
  rightPaneTasks: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  calendarContainer: {
    padding: spacing.md,
  },
});
