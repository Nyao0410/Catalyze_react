import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, textStyles, colors as defaultColors } from '../theme';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onDismiss: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  level,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // アニメーション開始
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // 2秒後に自動閉鎖
      const timer = setTimeout(() => {
        handleDismiss();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // リセット
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const scale = scaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.1, 1],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale }],
            },
          ]}
        >
          {/* 背景グロー */}
          <View
            style={[
              styles.glowBackground,
              { backgroundColor: colors.primary + '20' },
            ]}
          />

          {/* メインコンテンツ */}
          <View style={[styles.content, { backgroundColor: colors.card }]}>
            {/* 星のアイコン（回転） */}
            <Animated.View
              style={[
                styles.starContainer,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <Ionicons name="star" size={80} color={colors.warning} />
            </Animated.View>

            {/* テキスト */}
            <Text style={[styles.levelUpText, { color: colors.primary }]}>
              レベルアップ!
            </Text>

            <Text style={[styles.levelText, { color: colors.text }]}>
              Level {level}
            </Text>

            <Text
              style={[
                styles.congratsText,
                { color: colors.textSecondary },
              ]}
            >
              おめでとうございます！
            </Text>

            {/* クローズボタン */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onDismiss}
            >
              <Text style={styles.buttonText}>続ける</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 320,
  },
  glowBackground: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    borderRadius: 200,
    zIndex: 0,
  },
  content: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  starContainer: {
    marginBottom: spacing.lg,
  },
  levelUpText: {
    ...textStyles.h1,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  levelText: {
    ...textStyles.h2,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  congratsText: {
    ...textStyles.body,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 120,
  },
  buttonText: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
