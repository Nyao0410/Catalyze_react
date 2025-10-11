import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, textStyles } from '../theme';
import { addDays } from 'date-fns';
import type { RootStackScreenProps } from '../navigation/types';
import { useCreateSession, useDailyTasksByPlan, useUpdateSession, useStudySession } from '../hooks';
import { useRecordReview } from '../hooks/useReviewItems';
import { StudySessionEntity, ProgressAnalysisService } from 'catalyze-ai';
import { studyPlanService, studySessionService } from '../../services';
import { t } from '../../locales';
import { useTopToast } from '../hooks/useTopToast';

type RouteProps = RootStackScreenProps<'RecordSession'>;

export const RecordSessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps['route']>();
  const { planId, taskId, sessionId, elapsedMinutes, startUnit: paramStartUnit, endUnit: paramEndUnit, fromTimer } = route.params as any;

  const userId = 'user-001';
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const recordReview = useRecordReview();
  const queryClient = useQueryClient();
  const toast = useTopToast();

  // 編集モードかどうか
  const isEditMode = !!sessionId;

  // 編集モードの場合、既存のセッションを取得
  const existingSessionQuery = useStudySession(sessionId || '');
  const existingSession = existingSessionQuery.data;

  const [unitsCompleted, setUnitsCompleted] = useState('');
  const [unitsInput, setUnitsInput] = useState(''); // ユーザーが入力する「やった単元数」
  const [durationMinutes, setDurationMinutes] = useState('5');
  const [concentration, setConcentration] = useState(0.6);
  const [difficulty, setDifficulty] = useState(3);
  const [round, setRound] = useState<number | undefined>(undefined);

  // タスクが渡されていればデフォルト値を取得
  const tasksQuery = useDailyTasksByPlan(planId);
  const tasks = tasksQuery.data || [];
  const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;

  // 計画を取得
  const planQuery = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => studyPlanService.getPlanById(planId),
  });
  const plan = planQuery.data;

  // セッションを取得
  const sessionsQuery = useQuery({
    queryKey: ['sessions', planId],
    queryFn: () => studySessionService.getSessionsByPlanId(planId),
  });
  const sessions = sessionsQuery.data || [];

  // 進捗を計算
  const progressAnalysisService = new ProgressAnalysisService();
  const progress = plan ? progressAnalysisService.calculateProgress(plan, sessions) : null;

  React.useEffect(() => {
    if (isEditMode && existingSession) {
      // 編集モードの場合、既存のセッションの値をセット
      setUnitsCompleted(String(existingSession.unitsCompleted));
      setDurationMinutes(String(existingSession.durationMinutes));
      setConcentration(existingSession.concentration);
      setDifficulty(existingSession.difficulty);
      setRound(existingSession.round);
    } else if (task) {
      // 新規作成の場合、タスクのデフォルト値をセット
      setUnitsCompleted(String(task.units));
      setUnitsInput(String(task.units ?? 1));
      // タイマーからの経過時間があればそれを使う
      setDurationMinutes(elapsedMinutes ? String(elapsedMinutes) : String(task.estimatedMinutes));
      setRound(task.round);
    } else if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
      // タイマーから直接来た場合、startUnitとendUnitから完了単元数を計算
      const calculatedUnits = paramEndUnit - paramStartUnit + 1;
      setUnitsCompleted(String(calculatedUnits));
      setUnitsInput(String(calculatedUnits));
      setDurationMinutes(elapsedMinutes ? String(elapsedMinutes) : '25');
    } else if (elapsedMinutes) {
      // タスクはないがタイマーからの経過時間がある場合
      setDurationMinutes(String(elapsedMinutes));
    }
  }, [task, existingSession, isEditMode, elapsedMinutes, paramStartUnit, paramEndUnit]);

  // プレビュー計算: タイマーなどで start/end が直接渡されていればそれを優先して表示する。
  // そうでなければ、これまでの合計から開始単元を決め、入力値から終了単元を計算する。
  const cumulativeCompleted = Array.isArray(sessions) ? sessions.reduce((s: number, it: any) => s + (it.unitsCompleted || 0), 0) : 0;
  let previewStartUnit: number;
  let previewEndUnit: number;
  if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
    // タイマーなどから渡された絶対単元番号をそのまま表示
    previewStartUnit = paramStartUnit;
    previewEndUnit = paramEndUnit;
  } else if (plan && (plan.unitRange as any)?.start !== undefined && (plan.unitRange as any)?.end !== undefined) {
    // プランに unitRange がある場合は、累計完了数を unitRange.start でオフセットして絶対単元を算出
    const range = plan.unitRange as { start: number; end: number };
    previewStartUnit = range.start + cumulativeCompleted;
    const previewUnitsNumber = unitsInput && !isNaN(parseInt(unitsInput, 10))
      ? Math.max(1, parseInt(unitsInput, 10))
      : (task?.units ?? 1);
    previewEndUnit = Math.min(range.end, previewStartUnit + previewUnitsNumber - 1);
  } else {
    previewStartUnit = cumulativeCompleted + 1;
    const previewUnitsNumber = unitsInput && !isNaN(parseInt(unitsInput, 10))
      ? Math.max(1, parseInt(unitsInput, 10))
      : (task?.units ?? 1);
    previewEndUnit = previewStartUnit + previewUnitsNumber - 1;
  }

  // ...existing code...

  const handleSave = async () => {
    // determine units: for edit keep existing value, for new derive from task/timer/default
    const duration = parseInt(durationMinutes);
    let unitsNumber: number;
    if (isEditMode && existingSession) {
      unitsNumber = existingSession.unitsCompleted;
    } else {
      // 新規時はユーザー入力（unitsInput）を優先、なければ task/timer/default
      if (unitsInput && !isNaN(parseInt(unitsInput, 10))) {
        unitsNumber = Math.max(1, parseInt(unitsInput, 10));
      } else if (task) {
        unitsNumber = task.units ?? 1;
      } else if (paramStartUnit !== undefined && paramEndUnit !== undefined) {
        unitsNumber = paramEndUnit - paramStartUnit + 1;
      } else {
        unitsNumber = 1;
      }
    }

    // guard against invalid duration
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(t('common.error'), t('today.sessionRecord.validation.durationRequired'));
      return;
    }

    try {
      if (isEditMode && existingSession) {
        // 編集モードの場合、既存のセッションを更新
        const updatedSession = new StudySessionEntity({
          ...existingSession,
          unitsCompleted: unitsNumber,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? existingSession.round,
        });

        await updateSession.mutateAsync(updatedSession);

        // --- 自動 SM-2 適用: 編集時にも難易度を反映する ---
        try {
          // determine start/end units for the session
          let startUnit: number | undefined = (existingSession as any).startUnit ?? paramStartUnit;
          let endUnit: number | undefined = (existingSession as any).endUnit ?? paramEndUnit;

          // fallback: attempt to reconstruct using other sessions if missing
          if (startUnit === undefined || endUnit === undefined) {
            const otherSessions = Array.isArray(sessions) ? sessions.filter((s) => s.id !== existingSession.id) : [];
            const cumulativeBefore = otherSessions.reduce((s: number, it: any) => s + (it.unitsCompleted || 0), 0);
            if (startUnit === undefined) startUnit = cumulativeBefore + 1;
            if (endUnit === undefined) endUnit = startUnit + updatedSession.unitsCompleted - 1;
          }

          if (typeof startUnit === 'number' && typeof endUnit === 'number') {
            const difficultyValue = typeof difficulty === 'number' ? difficulty : Number(difficulty);
            let quality = Number.isNaN(difficultyValue) ? 4 : 6 - Math.round(difficultyValue);
            quality = Math.max(0, Math.min(5, quality));

            const { reviewItemService } = await import('../../services');
            const items: any[] = (await reviewItemService.getReviewItemsByPlanId(planId)) || [];
            const targets = items.filter((it) => {
              const n = Number(it.unitNumber);
              return !Number.isNaN(n) && n >= startUnit! && n <= endUnit!;
            });
            if (targets.length > 0) {
              await Promise.all(targets.map((it) => recordReview.mutateAsync({ itemId: it.id, quality })));
            }
          }
        } catch (e) {
          console.warn('Failed to auto-apply SM-2 on edit:', e);
        }
      } else {
        // 新規作成はサービスの統合メソッドに委譲
        const session = new StudySessionEntity({
          id: `session-${Date.now()}`,
          userId,
          planId,
          date: new Date(),
          unitsCompleted: unitsNumber,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? task?.round ?? 1,
        });
        // startUnit を「これまでに完了した合計 + 1」に自動設定し、endUnit をユーザー入力から計算
        const cumulativeCompleted = Array.isArray(sessions) ? sessions.reduce((s: number, it: any) => s + (it.unitsCompleted || 0), 0) : 0;
        const autoStartUnit = cumulativeCompleted + 1;
        const computedEndUnit = autoStartUnit + unitsNumber - 1;

        // compute initialQuality from difficulty (6 - difficulty, clamped 0..5)
        const difficultyValue = typeof difficulty === 'number' ? difficulty : Number(difficulty);
        let initialQuality = Number.isNaN(difficultyValue) ? 4 : 6 - Math.round(difficultyValue);
        initialQuality = Math.max(0, Math.min(5, initialQuality));

        await (await import('../../services')).studySessionService.recordSessionWithReviewItems(
          session,
          planId,
          autoStartUnit,
          computedEndUnit,
          initialQuality
        );
        // 新規セッション作成経路は service を直接呼んでいるため React Query のキャッシュ更新が行われない。
        // 保存後に関連クエリを無効化して TasksScreen / Review リストが最新化されるようにする。
        try {
          queryClient.invalidateQueries({ queryKey: ['dailyTasks', userId] });
          queryClient.invalidateQueries({ queryKey: ['upcomingTasks', userId] });
          queryClient.invalidateQueries({ queryKey: ['tasksForDate', userId] });
          queryClient.invalidateQueries({ queryKey: ['reviewItems', 'due', userId] });
          queryClient.invalidateQueries({ queryKey: ['studySessions', 'user', userId] });
          // PlanDetail uses the ['studySessions', planId] key; invalidate it so the detail view refreshes
          queryClient.invalidateQueries({ queryKey: ['studySessions', planId] });
          queryClient.invalidateQueries({ queryKey: ['dailyTasks', 'plan', planId] });
        } catch (e) {
          // ignore
        }
      }
      // 成功時はトーストを表示して戻る
      try {
        toast.show(isEditMode ? 'セッションが更新されました' : t('today.sessionRecord.success'));
      } catch (e) {}
      // If opened from Timer, close both RecordSession and Timer by popping two screens.
      try {
        if (fromTimer) {
          // pop two (RecordSession + TimerScreen)
          (navigation as any).pop?.(2);
          return;
        }
      } catch (e) {}
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), isEditMode ? 'セッションの更新に失敗しました' : t('today.sessionRecord.error'));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditMode ? '編集' : t('today.sessionRecord.title')}
        </Text>
      </View>
      <View style={styles.content}>
        {/* ユーザーが入力する「やった単元数」 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>完了した単元数</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={Math.max(1, plan?.totalUnits ?? 100)}
              step={1}
              value={parseInt(unitsInput) || 1}
              onValueChange={(value) => setUnitsInput(String(Math.round(value)))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={unitsInput}
              onChangeText={(v) => setUnitsInput(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="例: 10"
            />
          </View>
          <Text style={styles.mutedText}>終了範囲: {previewStartUnit} 〜 {previewEndUnit}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('today.sessionRecord.duration')}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={300}
              step={10}
              value={parseInt(durationMinutes) || 5}
              onValueChange={(value) => setDurationMinutes(String(Math.round(value)))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              placeholder="60"
            />
          </View>
        </View>

        <View style={[styles.formGroup, styles.centerAlignedGroup]}>
          <Text style={styles.label}>{t('today.sessionRecord.concentration')}</Text>
          <View style={styles.centeredRow}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((value) => (
              <TouchableOpacity
                key={String(value)}
                style={[
                  styles.iconButton,
                  concentration === value && styles.iconButtonActive,
                ]}
                onPress={() => setConcentration(value)}
              >
                <Text style={concentration === value ? styles.ratingButtonTextActive : styles.ratingButtonText}>
                  {value === 0.2 ? '😩' : value === 0.4 ? '☹️' : value === 0.6 ? '🙂' : value === 0.8 ? '😊' : '😁'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, styles.centerAlignedGroup]}>
          <Text style={styles.label}>{t('today.sessionRecord.difficulty')}</Text>
          <View style={styles.centeredRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setDifficulty(value)}
                style={styles.starButton}
              >
                <Ionicons name={value <= difficulty ? 'star' : 'star-outline'} size={28} color={value <= difficulty ? colors.primary : colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {typeof round !== 'undefined' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('today.sessionRecord.round')}</Text>
            <Text style={styles.roundText}>R{round}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={createSession.isPending}>
          <Text style={styles.saveButtonText}>{createSession.isPending ? t('today.sessionRecord.saving') : t('today.sessionRecord.save')}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...textStyles.h1, color: colors.text },
  content: { padding: spacing.lg },
  formGroup: { marginBottom: spacing.lg },
  label: { ...textStyles.body, fontWeight: '600', marginBottom: spacing.sm },
  input: { ...textStyles.body, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, backgroundColor: colors.background },
  saveButton: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { ...textStyles.button, color: colors.white },
  ratingButtons: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  ratingButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
  ratingButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ratingButtonText: { ...textStyles.bodySmall, color: colors.textSecondary },
  ratingButtonTextActive: { color: colors.textInverse },
  roundText: { ...textStyles.body, fontWeight: '700' },
  mutedText: { ...textStyles.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  slider: { width: 250, marginRight: spacing.md },
  stepperButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { ...textStyles.body, fontWeight: '700', color: colors.text },
  // new styles for centered icon controls
  centerAlignedGroup: { alignItems: 'center' },
  centeredRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  iconButton: { padding: spacing.sm, borderRadius: 8, marginHorizontal: spacing.xs, backgroundColor: colors.backgroundSecondary },
  iconButtonActive: { backgroundColor: colors.primary },
  starButton: { paddingHorizontal: spacing.sm, marginHorizontal: spacing.xs },
});

export default RecordSessionScreen;
