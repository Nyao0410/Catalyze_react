/**
 * StudyNext - Select AI Competitor Screen
 * AI競争を開始する際のAI選択と設定画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, textStyles, colors as defaultColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAvailableAICompetitors, useStartAICompetition, useCurrentUserId } from '../hooks';
import type { CompetitionMatchType, AICompetitor } from '../../types';

type Props = NativeStackScreenProps<any, 'SelectAICompetitor'>;

const MATCH_TYPES: { value: CompetitionMatchType; label: string; description: string }[] = [
  {
    value: 'studyHours',
    label: '勉強時間',
    description: '50時間の勉強を目指してAIと競争',
  },
  {
    value: 'points',
    label: 'ポイント',
    description: '1000ポイントを目指してAIと競争',
  },
  {
    value: 'streak',
    label: 'ストリーク',
    description: '30日連続達成を目指してAIと競争',
  },
];

const QUICK_DURATIONS: { value: number; label: string }[] = [
  { value: 1, label: '1日' },
  { value: 3, label: '3日' },
  { value: 7, label: '1週間' },
  { value: 14, label: '2週間' },
  { value: 30, label: '1ヶ月' },
];

// シンプルなカレンダー用の日付生成関数
const generateCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
};

export const SelectAICompetitorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { userId } = useCurrentUserId();
  const { data: competitors = [], isLoading } = useAvailableAICompetitors();
  const startCompetition = useStartAICompetition();

  const [selectedAI, setSelectedAI] = useState<AICompetitor | null>(null);
  const [selectedMatchType, setSelectedMatchType] = useState<CompetitionMatchType>('studyHours');
  
  // 終了日選択関連のState
  const today = new Date();
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 7); // デフォルトは7日後
  
  const [selectedEndDate, setSelectedEndDate] = useState<Date>(defaultEndDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(today));
  const [isStarting, setIsStarting] = useState(false);

  // 選択日数を計算
  const calculateDuration = (endDate: Date): number => {
    const diffTime = Math.abs(endDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // 最小1日
  };

  const selectedDuration = calculateDuration(selectedEndDate);

  const handleStartCompetition = async () => {
    if (!selectedAI || !userId) {
      Alert.alert('エラー', 'AIを選択してください');
      return;
    }

    setIsStarting(true);
    try {
      await startCompetition.mutateAsync({
        userId,
        aiId: selectedAI.id,
        matchType: selectedMatchType,
        duration: selectedDuration,
      });

      Alert.alert('成功', '競争が開始されました!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('エラー', '競争の開始に失敗しました');
    } finally {
      setIsStarting(false);
    }
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(calendarDate);
    newDate.setDate(day);
    setSelectedEndDate(newDate);
    setShowCalendar(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const dynamicStyles = {
    container: [styles.container, { backgroundColor: colors.background }],
    competitorCard: [
      styles.competitorCard,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: selectedAI?.id === undefined ? 1 : 2,
        borderTopColor:
          selectedAI?.id === undefined
            ? colors.border
            : colors.primary,
      },
    ],
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AIキャラクター選択 */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={styles.sectionTitle}>1. AIキャラクターを選択</Text>

          {competitors.map((competitor) => {
            const isSelected = selectedAI?.id === competitor.id;
            return (
              <TouchableOpacity
                key={competitor.id}
                style={[
                  styles.competitorCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedAI(competitor)}
              >
                <View style={styles.competitorHeader}>
                  <Text style={styles.competitorAvatar}>{competitor.avatar}</Text>
                  <View style={styles.competitorInfo}>
                    <Text style={styles.competitorName}>{competitor.name}</Text>
                    <Text style={[styles.competitorDifficulty, { color: colors.textSecondary }]}>
                      難易度: {competitor.personality.difficulty}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={32} color={colors.primary} />}
                </View>

                <Text style={[styles.competitorBio, { color: colors.textSecondary }]}>
                  {competitor.bio}
                </Text>

                <View style={styles.competitorStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      Lv.{competitor.level}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={16} color={colors.primary} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {Math.round(competitor.baseWinRate * 100)}%勝率
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flash" size={16} color={colors.success} />
                    <Text style={[styles.statText, { color: colors.text }]}>
                      {competitor.personality.dailyRate}/日
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedAI && (
          <>
            {/* 競争タイプ選択 */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <Text style={styles.sectionTitle}>2. 競争タイプを選択</Text>

              {MATCH_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        selectedMatchType === type.value
                          ? colors.primary
                          : colors.border,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedMatchType(type.value)}
                >
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {type.label}
                    </Text>
                    {selectedMatchType === type.value && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 終了日選択 */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <Text style={styles.sectionTitle}>3. 終了日を選択</Text>

              <TouchableOpacity
                style={[
                  styles.dateSelector,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                <View style={styles.dateSelectorContent}>
                  <Text style={[styles.dateSelectorLabel, { color: colors.textSecondary }]}>
                    終了日
                  </Text>
                  <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                    {selectedEndDate.toLocaleDateString('ja-JP', { 
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <Ionicons 
                  name={showCalendar ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>

              {showCalendar && (
                <View
                  style={[
                    styles.calendarContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* カレンダーヘッダー */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                    >
                      <Ionicons name="chevron-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.calendarTitle, { color: colors.text }]}>
                      {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                    >
                      <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* 曜日ラベル */}
                  <View style={styles.weekdaysRow}>
                    {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                      <Text
                        key={day}
                        style={[
                          styles.weekdayLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>

                  {/* カレンダー日付 */}
                  <View style={styles.daysGrid}>
                    {generateCalendarDays(calendarDate).map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          !day && styles.dayButtonEmpty,
                          day && selectedEndDate.getDate() === day && 
                            selectedEndDate.getMonth() === calendarDate.getMonth() && 
                            selectedEndDate.getFullYear() === calendarDate.getFullYear()
                            ? [styles.dayButtonSelected, { backgroundColor: colors.primary }]
                            : day && new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day) < today
                            ? styles.dayButtonDisabled
                            : {},
                        ]}
                        onPress={() => day && new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day) >= today && handleDateSelect(day)}
                        disabled={!day || new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day) < today}
                      >
                        {day && (
                          <Text
                            style={[
                              styles.dayText,
                              selectedEndDate.getDate() === day &&
                              selectedEndDate.getMonth() === calendarDate.getMonth() &&
                              selectedEndDate.getFullYear() === calendarDate.getFullYear()
                                ? { color: colors.white }
                                : { color: colors.text },
                            ]}
                          >
                            {day}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* クイック選択ボタン */}
                  <View style={styles.quickSelectContainer}>
                    {QUICK_DURATIONS.map((duration) => (
                      <TouchableOpacity
                        key={duration.value}
                        style={[
                          styles.quickSelectButton,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => {
                          const newDate = new Date(today);
                          newDate.setDate(newDate.getDate() + duration.value);
                          setSelectedEndDate(newDate);
                          setShowCalendar(false);
                        }}
                      >
                        <Text style={[styles.quickSelectText, { color: colors.primary }]}>
                          {duration.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View
                style={[
                  styles.durationInfo,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.durationInfoText, { color: colors.primary }]}>
                  期間: {selectedDuration}日間
                </Text>
              </View>
            </View>

            {/* 競争開始ボタン */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: colors.primary },
                  isStarting && { opacity: 0.6 },
                ]}
                onPress={handleStartCompetition}
                disabled={isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color={colors.white} />
                    <Text style={styles.startButtonText}>競争を開始する!</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 概要 */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  競争概要
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    対戦相手:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedAI.avatar} {selectedAI.name}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    期間:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedEndDate.toLocaleDateString('ja-JP', { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}まで ({selectedDuration}日)
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    勝利報酬:
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: colors.success }]}
                  >
                    +{selectedAI.level * 10}pt
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    marginBottom: spacing.md,
  },
  competitorCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: defaultColors.border,
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  competitorAvatar: {
    fontSize: 48,
  },
  competitorInfo: {
    flex: 1,
  },
  competitorName: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginBottom: spacing.xs,
  },
  competitorDifficulty: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  competitorBio: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  competitorStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...textStyles.caption,
    color: defaultColors.text,
    fontWeight: '600',
  },
  optionCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: defaultColors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  optionDescription: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  durationText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: defaultColors.border,
  },
  dateSelectorContent: {
    flex: 1,
  },
  dateSelectorLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateSelectorValue: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calendarTitle: {
    ...textStyles.h4,
    color: defaultColors.text,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  weekdayLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    fontWeight: '600',
    width: '14.28%',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  dayButtonEmpty: {
    backgroundColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: defaultColors.primary,
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: defaultColors.border,
    paddingTop: spacing.md,
  },
  quickSelectButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  quickSelectText: {
    ...textStyles.caption,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: defaultColors.primaryLight,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: defaultColors.primary,
  },
  durationInfoText: {
    ...textStyles.body,
    color: defaultColors.primary,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: defaultColors.primary,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  startButtonText: {
    ...textStyles.body,
    color: defaultColors.white,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: defaultColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  summaryTitle: {
    ...textStyles.h4,
    color: defaultColors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  summaryLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  summaryValue: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
});
