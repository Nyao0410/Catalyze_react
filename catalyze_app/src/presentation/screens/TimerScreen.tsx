/**
 * StudyNext - Timer Screen
 * タイマー画面（ストップウォッチ/ポモドーロ）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import { Timer, TimerMode } from '../components';
import { spacing, colors as defaultColors, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { useStudyPlan } from '../hooks';
import { useSettings } from '../hooks/useAccount';

type Props = RootStackScreenProps<'TimerScreen'>;

export const TimerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { colors } = useTheme();
  const { planId, taskId, startUnit, endUnit } = route.params;

  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [isTimerStarted, setIsTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState<number>(0);

  const { data: plan } = useStudyPlan(planId);
  const { data: settings } = useSettings();

  const rangeLabel = plan
    ? startUnit !== undefined && endUnit !== undefined
      ? `${startUnit} 〜 ${endUnit} ${plan.unit}`
      : '全範囲'
    : '全範囲';

  // 設定からポモドーロ時間を取得（デフォルト25分、5分）
  const pomodoroWorkMinutes = settings?.pomodoroWorkMinutes || 25;
  const pomodoroBreakMinutes = settings?.pomodoroBreakMinutes || 5;

  // 経過時間の変更ハンドラー（メモ化してレンダリング中の setState を防ぐ）
  const handleElapsedChange = useCallback((s: number, phase: 'work' | 'break', totalWorkSecondsFromTimer: number) => {
    setElapsedSeconds(s);
    setTotalWorkSeconds(totalWorkSecondsFromTimer);
  }, []);

  // set header title to plan title when loaded
  useEffect(() => {
    try {
      // set the OS navigation header to the plan title (fallback to generic label)
      (navigation as any).setOptions({ title: plan?.title || '学習タイマー' });
    } catch (e) {}
  }, [plan?.title]);

  // タイマー完了時（ポモドーロのサイクル完了時、現在は自動継続なので未使用）
  const handleTimerComplete = (elapsedSeconds: number) => {
    // 現在は自動で次のサイクルを開始するため、完了ダイアログは表示しない
  };

  // 手動で記録画面へ
  const handleManualRecord = () => {
    Alert.alert(
      '確認',
      '学習を中断して記録しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '記録する',
          onPress: () => {
            // タイマーを停止して記録画面へ遷移
            // pass elapsedSeconds (converted to minutes) if available
            navigation.navigate('RecordSession', {
              planId,
              taskId,
              elapsedMinutes: Math.floor(totalWorkSeconds / 60),
              startUnit,
              endUnit,
              fromTimer: true,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{rangeLabel}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* タイマー */}
        <Timer
          mode={timerMode}
          pomodoroMinutes={pomodoroWorkMinutes}
          pomodoroBreakMinutes={pomodoroBreakMinutes}
          onComplete={handleTimerComplete}
          onModeChange={(mode) => setTimerMode(mode)}
          onElapsedChange={handleElapsedChange}
        />



        {/* ヒント */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>学習のコツ</Text>
          </View>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            {timerMode === 'stopwatch'
              ? '集中して学習に取り組みましょう。適度に休憩を取ることも大切です。'
              : 'ポモドーロテクニック：25分集中、5分休憩を繰り返すと効果的です。'}
          </Text>
        </View>
      </ScrollView>

      {/* 下部ボタン */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={[styles.recordButton, { backgroundColor: colors.primary }]} onPress={handleManualRecord}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
          <Text style={styles.recordButtonText}>記録する</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: defaultColors.card,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...textStyles.h3,
    color: defaultColors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    backgroundColor: defaultColors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
    marginLeft: spacing.lg + spacing.xs,
  },
  tipsCard: {
    backgroundColor: defaultColors.backgroundSecondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: defaultColors.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...textStyles.body,
    color: defaultColors.text,
    fontWeight: '600',
  },
  tipsText: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: defaultColors.card,
    borderTopWidth: 1,
    borderTopColor: defaultColors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: defaultColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordButtonText: {
    ...textStyles.button,
    color: defaultColors.white,
  },
});
