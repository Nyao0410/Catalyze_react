/**
 * StudyNext - Timer Screen
 * タイマー画面（ストップウォッチ/ポモドーロ）
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackScreenProps } from '../navigation/types';
import { Timer, TimerMode } from '../components';
import { colors, spacing, textStyles } from '../theme';
import { useStudyPlan } from '../hooks';

type Props = RootStackScreenProps<'TimerScreen'>;

export const TimerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { planId, taskId, startUnit, endUnit } = route.params;

  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [isTimerStarted, setIsTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const { data: plan } = useStudyPlan(planId);

  const rangeLabel = plan
    ? startUnit !== undefined && endUnit !== undefined
      ? `${startUnit} 〜 ${endUnit} ${plan.unit}`
      : '全範囲'
    : '全範囲';

  // set header title to plan title when loaded
  useEffect(() => {
    try {
      // set the OS navigation header to the plan title (fallback to generic label)
      (navigation as any).setOptions({ title: plan?.title || '学習タイマー' });
    } catch (e) {}
  }, [plan?.title]);

  // タイマー完了時
  const handleTimerComplete = (elapsedSeconds: number) => {
    const minutes = Math.floor(elapsedSeconds / 60);
    
    Alert.alert(
      '完了',
      `お疲れ様でした！\n${minutes}分間学習しました。\n\n学習記録を評価しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '記録する',
          onPress: () => {
            // 評価画面に遷移（経過時間を渡す）
            navigation.navigate('RecordSession', {
              planId,
              taskId,
              elapsedMinutes: minutes,
              startUnit,
              endUnit,
            });
          },
        },
      ]
    );
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
              elapsedMinutes: Math.floor(elapsedSeconds / 60),
              startUnit,
              endUnit,
            });
          },
        },
      ]
    );
  };

  // ポモドーロ時間の設定
  const pomodoroPresets = [15, 25, 45, 60];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{rangeLabel}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* ポモドーロ時間設定 */}
        {timerMode === 'pomodoro' && (
          <View style={styles.pomodoroSettings}>
            <Text style={styles.settingsTitle}>作業時間を選択</Text>
            <View style={styles.presetButtons}>
              {pomodoroPresets.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.presetButton,
                    pomodoroMinutes === minutes && styles.presetButtonActive,
                  ]}
                  onPress={() => setPomodoroMinutes(minutes)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      pomodoroMinutes === minutes && styles.presetButtonTextActive,
                    ]}
                  >
                    {minutes}分
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* タイマー */}
        <Timer
          mode={timerMode}
          pomodoroMinutes={pomodoroMinutes}
          onComplete={handleTimerComplete}
          onModeChange={(mode) => setTimerMode(mode)}
          onElapsedChange={(s) => setElapsedSeconds(s)}
        />



        {/* ヒント */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipsTitle}>学習のコツ</Text>
          </View>
          <Text style={styles.tipsText}>
            {timerMode === 'stopwatch'
              ? '集中して学習に取り組みましょう。適度に休憩を取ることも大切です。'
              : 'ポモドーロテクニック：25分集中、5分休憩を繰り返すと効果的です。'}
          </Text>
        </View>
      </ScrollView>

      {/* 下部ボタン */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.recordButton} onPress={handleManualRecord}>
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pomodoroSettings: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  presetButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetButtonText: {
    ...textStyles.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.lg + spacing.xs,
  },
  tipsCard: {
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  tipsText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
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
    color: colors.white,
  },
});
