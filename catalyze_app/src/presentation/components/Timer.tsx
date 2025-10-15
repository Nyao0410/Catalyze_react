/**
 * StudyNext - Timer Component
 * ストップウォッチとポモドーロタイマーの切り替え可能なコンポーネント
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

export type TimerMode = 'stopwatch' | 'pomodoro';

interface TimerProps {
  mode: TimerMode;
  pomodoroMinutes?: number; // ポモドーロの作業時間（分）
  pomodoroBreakMinutes?: number; // ポモドーロの休憩時間（分）
  onComplete?: (elapsedSeconds: number) => void;
  onElapsedChange?: (elapsedSeconds: number, phase: 'work' | 'break', totalWorkSeconds: number) => void;
  onModeChange?: (mode: TimerMode) => void;
}

export const Timer: React.FC<TimerProps> = ({
  mode: initialMode,
  pomodoroMinutes = 25,
  pomodoroBreakMinutes = 5,
  onComplete,
  onElapsedChange,
  onModeChange,
}) => {
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const workTimeAccumulator = useRef(0); // 完了した作業時間の累積

  const { colors } = useTheme();

  const totalPomodoroSeconds = phase === 'work' ? pomodoroMinutes * 60 : pomodoroBreakMinutes * 60;
  const remainingSeconds = mode === 'pomodoro' ? Math.max(0, totalPomodoroSeconds - elapsedSeconds) : 0;

  // 合計作業時間を計算
  const totalWorkSeconds = workTimeAccumulator.current + (phase === 'work' ? elapsedSeconds : 0);

  // タイマーの更新
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          // ポモドーロモードで時間切れ
          if (mode === 'pomodoro' && next >= totalPomodoroSeconds) {
            if (phase === 'work') {
              // 作業完了 → 休憩開始
              workTimeAccumulator.current += next; // 完了した作業時間を累積
              if (pomodoroBreakMinutes === 0) {
                // 休憩時間が0分の場合、すぐに次の作業を開始
                setPhase('work');
              } else {
                setPhase('break');
              }
              return 0; // elapsedSeconds をリセット
            } else {
              // 休憩完了 → 次の作業開始
              setPhase('work');
              return 0; // elapsedSeconds をリセット
            }
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, totalPomodoroSeconds, phase]);

  // elapsedSeconds が変わったら親に通知
  useEffect(() => {
    try {
      onElapsedChange?.(elapsedSeconds, phase, totalWorkSeconds);
    } catch (e) {}
  }, [elapsedSeconds, phase, onElapsedChange, totalWorkSeconds]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setPhase('work');
    workTimeAccumulator.current = 0;
    try {
      onElapsedChange?.(0, 'work', 0);
    } catch (e) {}
  };

  const handleModeToggle = (newMode: TimerMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      setIsRunning(false);
      setElapsedSeconds(0);
      setPhase('work');
      workTimeAccumulator.current = 0;
      onModeChange?.(newMode);
      try {
        onElapsedChange?.(0, 'work', 0);
      } catch (e) {}
    }
  };

  // 時間フォーマット (HH:MM:SS または MM:SS)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 進捗率（ポモドーロモード用）
  const progress = mode === 'pomodoro' ? elapsedSeconds / totalPomodoroSeconds : 0;

  return (
    <View style={styles.container}>
      {/* モード切替 */}
      <View style={[styles.modeSelector, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'stopwatch' && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
          onPress={() => handleModeToggle('stopwatch')}
        >
          <Ionicons
            name="stopwatch-outline"
            size={20}
            color={mode === 'stopwatch' ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeButtonText,
              { color: colors.textSecondary },
              mode === 'stopwatch' && [styles.modeButtonTextActive, { color: colors.white }],
            ]}
          >
            ストップウォッチ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'pomodoro' && [styles.modeButtonActive, { backgroundColor: colors.primary }]]}
          onPress={() => handleModeToggle('pomodoro')}
        >
          <Ionicons
            name="timer-outline"
            size={20}
            color={mode === 'pomodoro' ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeButtonText,
              { color: colors.textSecondary },
              mode === 'pomodoro' && [styles.modeButtonTextActive, { color: colors.white }],
            ]}
          >
            ポモドーロ
          </Text>
        </TouchableOpacity>
      </View>

      {/* タイマー表示 */}
      <View style={styles.timerDisplay}>
        <Text style={[styles.timerText, { color: colors.text }]}>
          {mode === 'stopwatch' ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
        </Text>
        {mode === 'pomodoro' && (
          <Text style={[styles.timerSubtext, { color: colors.textSecondary }]}>
            {phase === 'work' ? '作業中' : '休憩中'}
          </Text>
        )}
      </View>

      {/* コントロールボタン */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={[styles.controlButton, styles.startButton, { backgroundColor: colors.success }]} onPress={handleStart}>
            <Ionicons name="play" size={32} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.controlButton, styles.pauseButton, { backgroundColor: colors.warning }]} onPress={handlePause}>
            <Ionicons name="pause" size={32} color={colors.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.controlButton, styles.resetButton, { backgroundColor: colors.textSecondary }]} onPress={handleReset}>
          <Ionicons name="refresh" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ポモドーロ時のみ統計表示（ストップウォッチ時の「経過時間 XX分」は不要のため非表示） */}
      {mode === 'pomodoro' ? (
        <View style={[styles.stats, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ポモドーロ合計作業時間</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{Math.floor(totalWorkSeconds / 60)}分</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: defaultColors.backgroundSecondary,
    padding: spacing.xs,
    borderRadius: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: defaultColors.primary,
  },
  modeButtonText: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: defaultColors.white,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    position: 'relative',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: defaultColors.text,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    ...textStyles.body,
    color: defaultColors.textSecondary,
    marginTop: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  startButton: {
    backgroundColor: defaultColors.success,
  },
  pauseButton: {
    backgroundColor: defaultColors.warning,
  },
  resetButton: {
    backgroundColor: defaultColors.textSecondary,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: defaultColors.backgroundSecondary,
    padding: spacing.lg,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: defaultColors.textSecondary,
  },
  statValue: {
    ...textStyles.h2,
    color: defaultColors.primary,
    fontWeight: '700',
  },
});
