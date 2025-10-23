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

const DURATIONS: { value: number; label: string }[] = [
  { value: 1, label: '1日' },
  { value: 3, label: '3日' },
  { value: 7, label: '1週間' },
  { value: 14, label: '2週間' },
  { value: 30, label: '1ヶ月' },
];

export const SelectAICompetitorScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { userId } = useCurrentUserId();
  const { data: competitors = [], isLoading } = useAvailableAICompetitors();
  const startCompetition = useStartAICompetition();

  const [selectedAI, setSelectedAI] = useState<AICompetitor | null>(null);
  const [selectedMatchType, setSelectedMatchType] = useState<CompetitionMatchType>('studyHours');
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [isStarting, setIsStarting] = useState(false);

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

            {/* 期間選択 */}
            <View style={[styles.section, { backgroundColor: colors.background }]}>
              <Text style={styles.sectionTitle}>3. 競争期間を選択</Text>

              <View style={styles.durationGrid}>
                {DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={[
                      styles.durationButton,
                      {
                        backgroundColor:
                          selectedDuration === duration.value
                            ? colors.primary
                            : colors.card,
                        borderColor:
                          selectedDuration === duration.value
                            ? colors.primary
                            : colors.border,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedDuration(duration.value)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        {
                          color:
                            selectedDuration === duration.value
                              ? colors.white
                              : colors.text,
                        },
                      ]}
                    >
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                    {DURATIONS.find(d => d.value === selectedDuration)?.label}
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
