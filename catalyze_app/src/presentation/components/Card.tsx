/**
 * StudyNext - Card Component
 * カード型のコンテナコンポーネント
 */

import React from 'react';
import {
  View,
  StyleSheet,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  style,
  children,
  ...props
}) => {
  const cardStyles = [
    styles.card,
    styles[`card_${variant}`],
    { padding: spacing[padding] },
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  card_default: {
    // No additional styles
  },
  card_outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  card_elevated: {
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
