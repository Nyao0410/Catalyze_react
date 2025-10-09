/**
 * StudyNext - Button Component
 * 再利用可能なボタンコンポーネント
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, textStyles, spacing } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...props
}) => {
  const { isTablet } = useTheme();
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    isTablet && styles[`button_tablet_${size}`],
    fullWidth && styles.buttonFullWidth,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles_custom = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
    isTablet && styles[`buttonText_tablet_${size}`],
    disabled && styles.buttonTextDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text style={textStyles_custom}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonFullWidth: {
    width: '100%',
  },

  // Variants
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button_text: {
    backgroundColor: 'transparent',
  },

  // Sizes
  button_small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  button_medium: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },

  // Tablet variants (scaled up padding & minHeight)
  button_tablet_small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  button_tablet_medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  button_tablet_large: {
  paddingVertical: spacing.lg,
  paddingHorizontal: spacing['2xl'],
    minHeight: 68,
  },

  // Disabled
  buttonDisabled: {
    opacity: 0.5,
  },

  // Text
  buttonText: {
    ...textStyles.button,
  },
  buttonText_primary: {
    color: colors.textInverse,
  },
  buttonText_secondary: {
    color: colors.textInverse,
  },
  buttonText_outline: {
    color: colors.primary,
  },
  buttonText_text: {
    color: colors.primary,
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  buttonText_tablet_small: {
    fontSize: 16,
  },
  buttonText_tablet_medium: {
    fontSize: 18,
  },
  buttonText_tablet_large: {
    fontSize: 20,
  },
  buttonTextDisabled: {
    // 親要素のopacityで対応
  },
});
