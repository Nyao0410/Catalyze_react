/**
 * StudyNext - Create Plan Screen
 * 新規計画作成画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import { t } from '../../locales';
import { useCreatePlan, useStudyPlan, useUpdatePlan } from '../hooks/useStudyPlans';
import { useTopToast } from '../hooks/useTopToast';
import { PlanDifficulty, PlanStatus, StudyPlanEntity } from 'catalyze-ai';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePlan' | 'EditPlan'>;

export const CreatePlanScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mutate: createPlan, isPending } = useCreatePlan();
  const toast = useTopToast();
  const planId = route?.params?.planId as string | undefined;
  const { data: existingPlan } = useStudyPlan(planId || '');
  const { mutate: updatePlanMutate } = useUpdatePlan();
  
  const [title, setTitle] = useState('');
  const [startUnit, setStartUnit] = useState('1');
  const [endUnit, setEndUnit] = useState('1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [difficulty, setDifficulty] = useState<PlanDifficulty>(PlanDifficulty.NORMAL);
  const [studyDays, setStudyDays] = useState<number[]>([]);
  // advanced settings
  const [targetRounds, setTargetRounds] = useState('1');
  const [rounds, setRounds] = useState('1');
  const [estimatedMinutesPerUnit, setEstimatedMinutesPerUnit] = useState('30');
  const [unitLabel, setUnitLabel] = useState('問');
  const [isEditMode, setIsEditMode] = useState(false);

  // when editing, load existing plan
  React.useEffect(() => {
    if (existingPlan) {
      setIsEditMode(true);
      setTitle(existingPlan.title || '');
      setStartUnit(String(existingPlan.unitRange?.start ?? 1));
      setEndUnit(String(existingPlan.unitRange?.end ?? existingPlan.totalUnits ?? 1));
      setDifficulty(existingPlan.difficulty ?? PlanDifficulty.NORMAL);
      setTargetRounds(String(existingPlan.targetRounds ?? 1));
      setRounds(String(existingPlan.rounds ?? 1));
      setEstimatedMinutesPerUnit(String(Math.round((existingPlan.estimatedTimePerUnit ?? 30 * 60 * 1000) / 60000)));
      setUnitLabel(existingPlan.unit ?? '問');
  setStudyDays(Array.from((existingPlan.studyDays ?? [])).map((d: number) => (d === 7 ? 0 : d)));
      setSelectedDate(existingPlan.deadline ? new Date(existingPlan.deadline) : null);
    }
  }, [existingPlan]);

  const weekdays: number[] = [0, 1, 2, 3, 4, 5, 6];
  const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];

  const toggleStudyDay = (day: number) => {
    if (studyDays.includes(day)) {
      setStudyDays(studyDays.filter(d => d !== day));
    } else {
      setStudyDays([...studyDays, day].sort());
    }
  };

  const [advancedVisible, setAdvancedVisible] = useState(false);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert(t('errors.validation'), t('createPlan.validation.titleRequired'));
      return false;
    }
    
    const start = parseInt(startUnit, 10);
    const end = parseInt(endUnit, 10);
    if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
      Alert.alert(t('errors.validation'), t('createPlan.validation.unitsInvalid'));
      return false;
    }

    if (!selectedDate) {
      Alert.alert(t('errors.validation'), t('createPlan.validation.deadlineInvalid'));
      return false;
    }
    const deadlineDate = selectedDate;
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      Alert.alert(t('errors.validation'), t('createPlan.validation.deadlineInvalid'));
      return false;
    }
    
    if (studyDays.length === 0) {
      Alert.alert(t('errors.validation'), t('createPlan.validation.studyDaysRequired'));
      return false;
    }
    // advanced settings validation
    const tRounds = parseInt(targetRounds, 10);
    const r = parseInt(rounds, 10);
    const est = parseInt(estimatedMinutesPerUnit, 10);
    if (isNaN(tRounds) || tRounds < 1) {
      Alert.alert(t('errors.validation'), t('createPlan.advancedValidation.targetRoundsInvalid'));
      return false;
    }
    if (isNaN(r) || r < 1) {
      Alert.alert(t('errors.validation'), t('createPlan.advancedValidation.roundsInvalid'));
      return false;
    }
    if (r > tRounds) {
      Alert.alert(t('errors.validation'), t('createPlan.advancedValidation.roundsExceedTarget'));
      return false;
    }
    if (isNaN(est) || est < 1) {
      Alert.alert(t('errors.validation'), t('createPlan.advancedValidation.estimatedMinutesInvalid'));
      return false;
    }
    if (!unitLabel || !unitLabel.trim()) {
      Alert.alert(t('errors.validation'), t('createPlan.advancedValidation.unitLabelRequired'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const start = parseInt(startUnit, 10);
    const end = parseInt(endUnit, 10);
    const totalUnits = end - start + 1;
    // selectedDate is guaranteed by validateForm()
    const deadlineDate = selectedDate as Date;

  // normalize studyDays: UI uses 0=Sun..6=Sat, domain expects 1=Mon..7=Sun
  const normalizedStudyDays = studyDays.map((d) => (d === 0 ? 7 : d));

  const newPlan = new StudyPlanEntity({
      id: `plan-${Date.now()}`,
      userId: 'user-001',
      title: title.trim(),
      totalUnits,
    // `unit` is a label for the unit (e.g., '問'). Don't set it to the range string.
    unit: unitLabel || existingPlan?.unit || '問',
    unitRange: { start, end },
      createdAt: new Date(),
      deadline: deadlineDate,
      rounds: parseInt(rounds, 10) || 1,
      targetRounds: parseInt(targetRounds, 10) || 1,
      estimatedTimePerUnit: (parseInt(estimatedMinutesPerUnit, 10) || 30) * 60 * 1000,
      difficulty,
  studyDays: normalizedStudyDays,
      status: PlanStatus.ACTIVE,
  } as any);
    if (isEditMode && existingPlan) {
      // update existing plan (keep same id)
  const props = { ...newPlan, id: existingPlan.id, studyDays: Array.from(existingPlan.studyDays ?? []) } as any;
  const updated = new StudyPlanEntity(props);
  updatePlanMutate(updated);
      //Alert.alert(t('createPlan.success'), t('createPlan.updateSuccessMessage') || t('createPlan.successMessage'));
      navigation.goBack();
    } else {
      createPlan(newPlan, {
        onSuccess: () => {
          // トーストを表示して戻る
          try { toast.show(t('createPlan.successMessage') || '計画を作成しました'); } catch (e) { /* no-op */ }
          navigation.goBack();
        },
        onError: () => {
          Alert.alert(t('errors.saveFailed'), t('createPlan.error'));
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isPending}>
          <Text style={styles.cancelButton}>{t('createPlan.cancel')}</Text>
        </TouchableOpacity>
        {/* ナビゲータのタイトルと重複するため、ここでの中央タイトルは表示しない */}
        <View style={{ width: 1 }} />
        <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
          <Text style={[styles.saveButton, isPending && styles.saveButtonDisabled]}>
            {isPending ? t('createPlan.saving') : t('createPlan.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* タイトル */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createPlan.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('createPlan.titlePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            editable={!isPending}
          />
        </View>

        {/* 総単元数 */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t('createPlan.startUnit', { defaultValue: '開始単元' })}</Text>
            <TextInput
              style={styles.input}
              value={startUnit}
              onChangeText={setStartUnit}
              placeholder="1"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              editable={!isPending}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t('createPlan.endUnit', { defaultValue: '終了単元' })}</Text>
            <TextInput
              style={styles.input}
              value={endUnit}
              onChangeText={setEndUnit}
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              editable={!isPending}
            />
          </View>
        </View>

        {/* 期限 */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createPlan.deadline')}</Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton]}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={selectedDate ? styles.dateText : styles.datePlaceholder}>
              {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : t('createPlan.deadlinePlaceholder')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>{t('createPlan.deadlineHint')}</Text>
        </View>

        {/* カレンダーモーダル */}
        <Modal visible={calendarVisible} animationType="slide" transparent={true}>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                  <Text style={styles.calendarNav}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>{format(calendarMonth, 'yyyy年M月')}</Text>
                <TouchableOpacity onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                  <Text style={styles.calendarNav}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarGrid}>
                {(() => {
                  const start = startOfMonth(calendarMonth);
                  const end = endOfMonth(calendarMonth);
                  const days = eachDayOfInterval({ start, end });
                  return days.map((d) => (
                    <TouchableOpacity
                      key={d.toISOString()}
                      style={[styles.calendarDay, selectedDate && d.toDateString() === selectedDate.toDateString() && styles.calendarDaySelected]}
                      onPress={() => {
                        setSelectedDate(d);
                        setCalendarVisible(false);
                      }}
                    >
                      <Text style={styles.calendarDayText}>{format(d, 'd')}</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>
              <TouchableOpacity style={styles.calendarClose} onPress={() => setCalendarVisible(false)}>
                <Text style={styles.calendarCloseText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 難易度 */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createPlan.difficulty')}</Text>
          <View style={styles.difficultyButtons}>
            {[PlanDifficulty.EASY, PlanDifficulty.NORMAL, PlanDifficulty.HARD].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  difficulty === level && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty(level)}
                disabled={isPending}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    difficulty === level && styles.difficultyButtonTextActive,
                  ]}
                >
                  {t(`plans.difficulty.${level}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 学習曜日 */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createPlan.studyDays')}</Text>
          <View style={styles.weekdaysContainer}>
            {weekdays.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.weekdayButton,
                  studyDays.includes(day) && styles.weekdayButtonActive,
                ]}
                onPress={() => toggleStudyDay(day)}
                disabled={isPending}
              >
                <Text
                  style={[
                    styles.weekdayButtonText,
                    studyDays.includes(day) && styles.weekdayButtonTextActive,
                  ]}
                >
                  {weekdayLabels[day]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 説明テキスト */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{t('createPlan.info')}</Text>
        </View>

        {/* 詳細設定 */}
        <View style={styles.field}>
          <TouchableOpacity onPress={() => setAdvancedVisible(!advancedVisible)}>
            <Text style={[styles.label, { color: colors.primary }]}>{advancedVisible ? t('createPlan.advanced.close') : t('createPlan.advanced.open')}</Text>
          </TouchableOpacity>
          {advancedVisible && (
            <View style={styles.advancedContainer}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>{t('createPlan.advanced.targetRounds')}</Text>
                  <TextInput
                    style={styles.input}
                    value={targetRounds}
                    onChangeText={setTargetRounds}
                    keyboardType="number-pad"
                    editable={!isPending}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>{t('createPlan.advanced.rounds')}</Text>
                  <TextInput
                    style={styles.input}
                    value={rounds}
                    onChangeText={setRounds}
                    keyboardType="number-pad"
                    editable={!isPending}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>{t('createPlan.advanced.unitLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    value={unitLabel}
                    onChangeText={setUnitLabel}
                    editable={!isPending}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.label}>{t('createPlan.advanced.estimatedMinutesPerUnit')}</Text>
                  <TextInput
                    style={styles.input}
                    value={estimatedMinutesPerUnit}
                    onChangeText={setEstimatedMinutesPerUnit}
                    keyboardType="number-pad"
                    editable={!isPending}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.text,
  },
  cancelButton: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  saveButton: {
    ...textStyles.button,
    color: colors.primary,
  },
  saveButtonDisabled: {
    color: colors.textTertiary,
  },

  // コンテンツ
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },

  // フィールド
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...textStyles.body,
    color: colors.text,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // range inputs (start/end) row
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  fieldHalf: {
    flex: 1,
  },
  // date display button
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    ...textStyles.body,
    color: colors.text,
  },
  datePlaceholder: {
    ...textStyles.body,
    color: colors.textTertiary,
  },
  hint: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // 難易度ボタン
  difficultyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  difficultyButtonText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  difficultyButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // 曜日ボタン
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  weekdayButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  weekdayButtonText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  weekdayButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // 情報
  infoContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  // Calendar modal styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    width: '92%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendarNav: {
    ...textStyles.body,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  calendarTitle: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 6,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
  },
  calendarDayText: {
    ...textStyles.body,
    color: colors.text,
  },
  calendarClose: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  calendarCloseText: {
    ...textStyles.body,
    color: colors.primary,
  },
  advancedContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
});
