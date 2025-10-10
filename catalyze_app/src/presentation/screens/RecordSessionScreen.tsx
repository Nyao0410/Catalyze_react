import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, textStyles } from '../theme';
import { addDays } from 'date-fns';
import type { RootStackScreenProps } from '../navigation/types';
import { useCreateSession, useDailyTasksByPlan, useUpdateSession, useStudySession, useAddPoints } from '../hooks';
import { StudySessionEntity, ProgressAnalysisService } from 'catalyze-ai';
import { studyPlanService, studySessionService } from '../../services';
import { t } from '../../locales';
import { useTopToast } from '../hooks/useTopToast';

type RouteProps = RootStackScreenProps<'RecordSession'>;

export const RecordSessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps['route']>();
  const { planId, taskId, sessionId } = route.params;

  const userId = 'user-001';
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const addPoints = useAddPoints();
  const toast = useTopToast();

  // 編集モードかどうか
  const isEditMode = !!sessionId;

  // 編集モードの場合、既存のセッションを取得
  const existingSessionQuery = useStudySession(sessionId || '');
  const existingSession = existingSessionQuery.data;

  const [unitsCompleted, setUnitsCompleted] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [concentration, setConcentration] = useState(0.8);
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
      setDurationMinutes(String(task.estimatedMinutes));
      setRound(task.round);
    }
  }, [task, existingSession, isEditMode]);

  // compute updated end unit if task has startUnit and user entered units
  const computeUpdatedEnd = (): number | null => {
    if (!task || typeof task.startUnit !== 'number') return null;
    const units = parseInt(unitsCompleted);
    if (isNaN(units) || units <= 0) return null;
    return task.startUnit + units - 1;
  };

  const updatedEndUnit = computeUpdatedEnd();

  const handleSave = async () => {
    const units = parseInt(unitsCompleted);
    const duration = parseInt(durationMinutes);
    if (isNaN(units) || units <= 0) {
      Alert.alert(t('common.error'), t('today.sessionRecord.validation.unitsRequired'));
      return;
    }
    if (task && units > task.units) {
      Alert.alert(t('common.error'), '完了した量はタスクの総量を超えることはできません');
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(t('common.error'), t('today.sessionRecord.validation.durationRequired'));
      return;
    }

    try {
      if (isEditMode && existingSession) {
        // 編集モードの場合、既存のセッションを更新
        const updatedSession = new StudySessionEntity({
          ...existingSession,
          unitsCompleted: units,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? existingSession.round,
        });

  await updateSession.mutateAsync(updatedSession);
      } else {
        // 新規作成の場合
        const session = new StudySessionEntity({
          id: `session-${Date.now()}`,
          userId,
          planId,
          date: new Date(),
          unitsCompleted: units,
          durationMinutes: duration,
          concentration,
          difficulty,
          round: round ?? task?.round ?? 1,
        });

        await createSession.mutateAsync(session);

        // セッション保存後に、完了したユニットに対して復習アイテムを自動生成（既存がなければ）
        try {
          const existing = await (await import('../../services')).reviewItemService.getReviewItemsByPlanId(planId);
          // task があれば task.startUnit を基準に完了範囲を算出
          const startUnit = typeof task?.startUnit === 'number' ? task.startUnit : 1;
          const parsedUnits = parseInt(unitsCompleted) || 0;
          const endUnit = updatedEndUnit ?? (startUnit + parsedUnits - 1);

          // 既存アイテムの unitNumber をセット化
          const existingUnits = new Set(existing.map((e) => e.unitNumber));

          const groupTs = Date.now();
          const now = new Date();
          const nextDay = addDays(now, 1);
          for (let u = startUnit; u <= endUnit; u++) {
            if (!existingUnits.has(u)) {
              const ReviewItemEntity = (await import('catalyze-ai')).ReviewItemEntity;
              const newItem = new ReviewItemEntity({
                id: `review-${planId}-${groupTs}-${u}`,
                userId,
                planId,
                unitNumber: u,
                lastReviewDate: now,
                nextReviewDate: nextDay,
              } as any);
              await (await import('../../services')).reviewItemService.createReviewItem(newItem);
            }
          }

        } catch (e) {
          console.error('Failed to auto-create review items:', e);
        }

        // ポイント付与は行うが、成功ダイアログは表示しない
        try {
          const performanceFactor = session.performanceFactor;
          const basePoints = Math.floor(duration * performanceFactor * 10);
          const points = Math.max(1, basePoints);
          await addPoints.mutateAsync({ userId, points });
        } catch (error) {
          console.error('Failed to add points:', error);
        }
      }
      // 成功時はトーストを表示して戻る
      try {
        toast.show(isEditMode ? 'セッションが更新されました' : t('today.sessionRecord.success'));
      } catch (e) {}
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), isEditMode ? 'セッションの更新に失敗しました' : t('today.sessionRecord.error'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditMode ? '編集' : t('today.sessionRecord.title')}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('today.sessionRecord.unitsCompleted')}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={Math.max(progress ? progress.completed + 1 : 1, task ? task.startUnit : 1)}
              maximumValue={task ? task.units : (plan ? plan.totalUnits : 100)}
              step={1}
              value={Math.min(parseInt(unitsCompleted) || Math.max(progress ? progress.completed + 1 : 1, task ? task.startUnit : 1), task ? task.units : (plan ? plan.totalUnits : 100))}
              onValueChange={(value) => setUnitsCompleted(String(Math.round(value)))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={unitsCompleted}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (isNaN(num)) {
                  setUnitsCompleted(text);
                } else {
                  const maxUnits = task ? task.units : (plan ? plan.totalUnits : 100);
                  setUnitsCompleted(String(Math.min(num, maxUnits)));
                }
              }}
              keyboardType="number-pad"
              placeholder="10"
            />
          </View>
          {task && typeof task.startUnit === 'number' && updatedEndUnit !== null && (
            <Text style={styles.mutedText}>
              {`${t('today.sessionRecord.previous')} ${task.startUnit} -> ${t('today.sessionRecord.updated')} ${updatedEndUnit}`}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('today.sessionRecord.duration')}</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={300}
              step={10}
              value={parseInt(durationMinutes) || 60}
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('today.sessionRecord.concentration')}: {concentration === 0.2 ? '😩' : concentration === 0.4 ? '☹️' : concentration === 0.6 ? '🙂' : concentration === 0.8 ? '😊' : '😁'}
          </Text>
          <View style={styles.ratingButtons}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((value) => (
              <TouchableOpacity
                key={String(value)}
                style={[
                  styles.ratingButton,
                  concentration === value && styles.ratingButtonActive,
                ]}
                onPress={() => setConcentration(value)}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    concentration === value && styles.ratingButtonTextActive,
                  ]}
                >
                  {value === 0.2 ? '😩' : value === 0.4 ? '☹️' : value === 0.6 ? '🙂' : value === 0.8 ? '😊' : '😁'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('today.sessionRecord.difficulty')}: {difficulty}/5</Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.ratingButton,
                  difficulty === value && styles.ratingButtonActive,
                ]}
                onPress={() => setDifficulty(value)}
              >
                <Text
                  style={[
                    styles.ratingButtonText,
                    difficulty === value && styles.ratingButtonTextActive,
                  ]}
                >
                  {value}
                </Text>
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
});

export default RecordSessionScreen;
