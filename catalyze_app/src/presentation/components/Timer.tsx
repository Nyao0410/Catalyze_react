/**
 * StudyNext - Timer Component
 * ストップウォッチとポモドーロタイマーの切り替え可能なコンポーネント
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../theme';

export type TimerMode = 'stopwatch' | 'pomodoro';

interface TimerProps {
  mode: TimerMode;
  pomodoroMinutes?: number; // ポモドーロの作業時間（分）
  onComplete?: (elapsedSeconds: number) => void;
  onElapsedChange?: (elapsedSeconds: number) => void;
  onModeChange?: (mode: TimerMode) => void;
}

export const Timer: React.FC<TimerProps> = ({
  mode: initialMode,
  pomodoroMinutes = 25,
  onComplete,
  onElapsedChange,
  onModeChange,
}) => {
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalPomodoroSeconds = pomodoroMinutes * 60;
  const remainingSeconds = mode === 'pomodoro' ? Math.max(0, totalPomodoroSeconds - elapsedSeconds) : 0;

  // タイマーの更新
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          try {
            // notify parent of elapsed change
            onElapsedChange?.(next);
          } catch (e) {}
          // ポモドーロモードで時間切れ
          if (mode === 'pomodoro' && next >= totalPomodoroSeconds) {
            handleStop();
            onComplete?.(next);
            return next;
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
  }, [isRunning, mode, totalPomodoroSeconds]);

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
    try {
      onElapsedChange?.(0);
    } catch (e) {}
  };

  const handleModeToggle = (newMode: TimerMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      setIsRunning(false);
      setElapsedSeconds(0);
      onModeChange?.(newMode);
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
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'stopwatch' && styles.modeButtonActive]}
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
              mode === 'stopwatch' && styles.modeButtonTextActive,
            ]}
          >
            ストップウォッチ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'pomodoro' && styles.modeButtonActive]}
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
              mode === 'pomodoro' && styles.modeButtonTextActive,
            ]}
          >
            ポモドーロ
          </Text>
        </TouchableOpacity>
      </View>

      {/* タイマー表示 */}
      <View style={styles.timerDisplay}>
        {mode === 'pomodoro' && (
          <View style={styles.progressRing}>
            <View style={[styles.progressCircle, { transform: [{ rotate: `${progress * 360}deg` }] }]}>
              <View style={styles.progressFill} />
            </View>
          </View>
        )}
        <Text style={styles.timerText}>
          {mode === 'stopwatch' ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
        </Text>
        {mode === 'pomodoro' && (
          <Text style={styles.timerSubtext}>
            経過: {formatTime(elapsedSeconds)} / {pomodoroMinutes}分
          </Text>
        )}
      </View>

      {/* コントロールボタン */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={handleStart}>
            <Ionicons name="play" size={32} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={handlePause}>
            <Ionicons name="pause" size={32} color={colors.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={handleReset}>
          <Ionicons name="refresh" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* 経過時間の統計 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>経過時間</Text>
          <Text style={styles.statValue}>{Math.floor(elapsedSeconds / 60)}分</Text>
        </View>
        {mode === 'pomodoro' && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>残り時間</Text>
            <Text style={styles.statValue}>{Math.floor(remainingSeconds / 60)}分</Text>
          </View>
        )}
      </View>
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
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: colors.border,
  },
  progressCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    ...textStyles.body,
    color: colors.textSecondary,
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
    backgroundColor: colors.success,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  resetButton: {
    backgroundColor: colors.textSecondary,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: '700',
  },
});
