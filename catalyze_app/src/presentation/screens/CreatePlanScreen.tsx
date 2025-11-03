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
import { spacing, colors as defaultColors, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../../locales';
import { useCreatePlan, useStudyPlan, useUpdatePlan } from '../hooks/useStudyPlans';
import { useTopToast } from '../hooks/useTopToast';
import { useCurrentUserId } from '../hooks/useAuth';
import { PlanDifficulty, PlanStatus, StudyPlanEntity } from 'catalyze-ai';
import { format } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CalendarView } from '../components/CalendarView';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePlan' | 'EditPlan'>;

export const CreatePlanScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { mutate: createPlan, isPending } = useCreatePlan();
  const toast = useTopToast();
  const planId = route?.params?.planId as string | undefined;
  const { data: existingPlan } = useStudyPlan(planId || '');
  const { mutate: updatePlanMutate } = useUpdatePlan();
  // 実際のユーザーIDを取得（未ログイン時でもローカルIDが返される）
  const { userId: currentUserId, isLoading: isLoadingUserId } = useCurrentUserId();
  // 'error'の場合はフォールバックを使用、それ以外はそのまま使用
  const userId = currentUserId === 'error' ? 'local-default' : (isLoadingUserId ? 'loading' : currentUserId);
  
  const [title, setTitle] = useState('');
  const [startUnit, setStartUnit] = useState('1');
  const [endUnit, setEndUnit] = useState('1');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [difficulty, setDifficulty] = useState<PlanDifficulty>(PlanDifficulty.NORMAL);
  const [studyDays, setStudyDays] = useState<number[]>([1,2,3,4,5]);
  // advanced settings
  const [targetRounds, setTargetRounds] = useState('1');
  const [rounds, setRounds] = useState('1');
  const [estimatedMinutesPerUnit, setEstimatedMinutesPerUnit] = useState('30');
  const [unitLabel, setUnitLabel] = useState('問');
  const [isEditMode, setIsEditMode] = useState(false);

  // when editing, load existing plan
  React.useEffect(() => {
    if (existingPlan && existingPlan.id) {
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

    // ユーザーIDが読み込まれていない場合はエラー
    if (isLoadingUserId || !userId || userId === 'loading' || userId === 'error') {
      Alert.alert(t('errors.generic'), 'ユーザー情報を読み込めませんでした。しばらく待ってから再度お試しください。');
      return;
    }

    const start = parseInt(startUnit, 10);
    const end = parseInt(endUnit, 10);
    const totalUnits = end - start + 1;
    // selectedDate is guaranteed by validateForm()
    const deadlineDate = selectedDate as Date;

    // normalize studyDays: UI uses 0=Sun..6=Sat, domain expects 1=Mon..7=Sun
    const normalizedStudyDays = studyDays.map((d) => (d === 0 ? 7 : d));

    if (isEditMode && existingPlan) {
      // Create a new properties object for the entity constructor,
      // starting with all of the existing plan's properties, then overriding.
      const updatedProps = {
        ...existingPlan,
        title: title.trim(),
        totalUnits,
        unit: unitLabel,
        unitRange: { start, end },
        deadline: deadlineDate,
        rounds: parseInt(rounds, 10) || 1,
        targetRounds: parseInt(targetRounds, 10) || 1,
        estimatedTimePerUnit:
          (parseInt(estimatedMinutesPerUnit, 10) || 30) * 60 * 1000,
        difficulty,
        studyDays: normalizedStudyDays,
      };
      
      const updatedPlan = new StudyPlanEntity(updatedProps);

      updatePlanMutate(updatedPlan, {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (e) => {
          // eslint-disable-next-line no-console
          console.error('plan update failed', e);
          Alert.alert(t('errors.saveFailed'), t('createPlan.error'));
        },
      });
    } else {
      const newPlan = new StudyPlanEntity({
        id: `plan-${Date.now()}-${Math.random()}`,
        userId: userId,
        title: title.trim(),
        totalUnits,
        unit: unitLabel || '問',
        unitRange: { start, end },
        createdAt: new Date(),
        deadline: deadlineDate,
        rounds: parseInt(rounds, 10) || 1,
        targetRounds: parseInt(targetRounds, 10) || 1,
        estimatedTimePerUnit:
          (parseInt(estimatedMinutesPerUnit, 10) || 30) * 60 * 1000,
        difficulty,
        studyDays: normalizedStudyDays,
        status: PlanStatus.ACTIVE,
      });

      createPlan(newPlan, {
        onSuccess: () => {
          try {
            toast.show(t('createPlan.successMessage') || '計画を作成しました');
          } catch (e) {
            /* no-op */
          }
          navigation.goBack();
        },
        onError: (e) => {
          // eslint-disable-next-line no-console
          console.error('plan creation failed', e);
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
              <CalendarView
                selectedDate={selectedDate || new Date()}
                onDayPress={(day) => {
                  const selected = new Date(day.dateString);
                  setSelectedDate(selected);
                  setCalendarVisible(false);
                }}
                markedDates={selectedDate ? { [format(selectedDate, 'yyyy-MM-dd')]: { selected: true } } : {}}
              />
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
            <Text style={[styles.label, { color: defaultColors.primary }]}>{advancedVisible ? t('createPlan.advanced.close') : t('createPlan.advanced.open')}</Text>
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
    backgroundColor: defaultColors.background,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  headerTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
  },
  cancelButton: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  saveButton: {
    ...textStyles.button,
    color: defaultColors.primary,
  },
  saveButtonDisabled: {
    color: defaultColors.textTertiary,
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
    color: defaultColors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...textStyles.body,
    color: defaultColors.text,
    backgroundColor: defaultColors.card,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: defaultColors.border,
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
    color: defaultColors.text,
  },
  datePlaceholder: {
    ...textStyles.body,
    color: defaultColors.textTertiary,
  },
  hint: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },

  // 難易度ボタン
  difficultyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: defaultColors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: defaultColors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: defaultColors.primaryLight,
    borderColor: defaultColors.primary,
  },
  difficultyButtonText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  difficultyButtonTextActive: {
    color: defaultColors.primary,
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
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: defaultColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: defaultColors.primaryLight,
    borderColor: defaultColors.primary,
  },
  weekdayButtonText: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
  },
  weekdayButtonTextActive: {
    color: defaultColors.primary,
    fontWeight: '600',
  },

  // 情報
  infoContainer: {
    backgroundColor: defaultColors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoText: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
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
    backgroundColor: defaultColors.background,
    borderRadius: 12,
    padding: spacing.md,
    maxHeight: '85%',
  },
  calendarClose: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  calendarCloseText: {
    ...textStyles.body,
    color: defaultColors.primary,
  },
  advancedContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: defaultColors.backgroundSecondary,
    borderRadius: 8,
  },
});
