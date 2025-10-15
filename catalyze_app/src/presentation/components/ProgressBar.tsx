/**
 * Catalyze AI - ProgressBar Component
 * 進捗バーコンポーネント
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors as defaultColors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

interface ProgressBarProps {
  progress: number; // 0-1
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = false,
  height = 8,
  color,
  backgroundColor,
  style,
}) => {
  const { colors } = useTheme();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  // デフォルトカラーを動的に設定
  const progressColor = color || colors.progressFill;
  const trackColor = backgroundColor || colors.progressTrack;

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelContainer}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showPercentage && <Text style={[styles.percentage, { color: colors.text }]}>{percentage}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              height,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...textStyles.bodySmall,
    color: defaultColors.textSecondary,
  },
  percentage: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: defaultColors.text,
  },
  track: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 100,
  },
});
