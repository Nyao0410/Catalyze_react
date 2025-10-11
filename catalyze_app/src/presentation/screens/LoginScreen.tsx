/**
 * Catalyze AI - Login Screen
 * ログイン画面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors, textStyles, spacing } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors: themeColors } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // メールアドレスの検証
    if (!email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    // パスワードの検証
    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Firebase認証とAccountServiceの実装を動的にインポート
      const { signInWithEmail } = await import('../../infrastructure/auth');
      const { AccountService } = await import('../../application/services/AccountService');
      const { FirebaseAccountService } = await import('../../application/services/FirebaseAccountService');
      
      // Firebase認証でログイン
      const user = await signInWithEmail(email.trim(), password);
      
      // Firestoreからプロフィールと設定を取得してAsyncStorageに同期
      const [firestoreProfile, firestoreSettings] = await Promise.all([
        FirebaseAccountService.getProfile(user.uid),
        FirebaseAccountService.getSettings(user.uid),
      ]);
      
      if (firestoreProfile) {
        await AccountService.saveProfile(firestoreProfile);
      }
      
      if (firestoreSettings) {
        await AccountService.saveSettings(firestoreSettings);
      }
      
      Alert.alert(
        '成功',
        'ログインしました',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'ログインに失敗しました';
      
      // Firebase エラーメッセージの日本語化
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'ユーザーが見つかりません';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが正しくありません';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレスです';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'このアカウントは無効化されています';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.alert('パスワードリセット', '機能は近日公開予定です');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              ログイン
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              アカウントにログイン
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="メールアドレス"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="パスワード"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: undefined });
                }
              }}
              placeholder="パスワードを入力"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
              disabled={loading}
            >
              <Text style={[styles.forgotPasswordText, { color: themeColors.primary }]}>
                パスワードを忘れた場合
              </Text>
            </TouchableOpacity>

            <Button
              title="ログイン"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
                アカウントをお持ちでない方は
              </Text>
              <TouchableOpacity onPress={handleGoToSignUp} disabled={loading}>
                <Text style={[styles.linkText, { color: themeColors.primary }]}>
                  新規登録
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    ...textStyles.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.body,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...textStyles.body,
  },
  linkText: {
    ...textStyles.body,
    fontWeight: '600',
  },
});
