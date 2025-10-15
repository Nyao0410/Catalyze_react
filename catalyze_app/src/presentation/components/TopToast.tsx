import React, { useEffect } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as defaultColors, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  message: string | null;
  visible: boolean;
  onHidden?: () => void;
};

export const TopToast: React.FC<Props> = ({ message, visible, onHidden }) => {
  const translateY = React.useRef(new Animated.Value(-80)).current;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible && message) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // 自動で消す
        setTimeout(() => {
          Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }).start(() => onHidden && onHidden());
        }, 1800);
      });
    }
  }, [visible, message, translateY, onHidden]);

  if (!visible || !message) return null;

  const topOffset = Math.max(12, insets.top + 6);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], paddingTop: topOffset, height: 64 + topOffset, backgroundColor: colors.primary },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: colors.white }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: defaultColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 18,
    zIndex: 9999,
    elevation: 20,
  },
  text: {
    ...textStyles.button,
    color: defaultColors.white,
  },
});

export default TopToast;
