/**
 * Catalyze AI - Sign Up Screen
 * アカウント作成画面
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

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { colors: colors } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
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
    } else if (password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください';
    }
    
    // パスワード確認の検証
    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワードを再入力してください';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    // 表示名の検証
    if (!displayName.trim()) {
      newErrors.displayName = '表示名を入力してください';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = '表示名は2文字以上で入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      // Firebase認証とAccountServiceの実装を動的にインポート
      const { signUpWithEmail } = await import('../../infrastructure/auth');
      const { AccountService } = await import('../../application/services/AccountService');
      const { FirebaseAccountService } = await import('../../application/services/FirebaseAccountService');
      
      // Firebase認証でアカウントを作成
      const user = await signUpWithEmail(email.trim(), password, displayName.trim());
      
      // FirestoreとAsyncStorageの両方にプロフィールを保存
      await Promise.all([
        FirebaseAccountService.initializeDefaultProfile(user.uid, email.trim(), displayName.trim()),
        FirebaseAccountService.initializeDefaultSettings(),
        AccountService.initializeDefaultProfile(user.uid, email.trim(), displayName.trim()),
        AccountService.initializeDefaultSettings(),
      ]);
      
      // プロフィール更新（displayNameを設定）
      await Promise.all([
        FirebaseAccountService.updateProfile(user.uid, { displayName: displayName.trim() }),
        AccountService.updateProfile({ displayName: displayName.trim() }),
      ]);
      
      Alert.alert(
        '成功',
        'アカウントが作成されました',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'アカウント作成に失敗しました';
      
      // Firebase エラーメッセージの日本語化
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '無効なメールアドレスです';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: defaultColors.background }]} edges={['top']}>
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
            <Text style={[styles.title, { color: defaultColors.text }]}>
              アカウント作成
            </Text>
            <Text style={[styles.subtitle, { color: defaultColors.textSecondary }]}>
              StudyNextへようこそ
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="表示名"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (errors.displayName) {
                  setErrors({ ...errors, displayName: undefined });
                }
              }}
              placeholder="山田太郎"
              autoCapitalize="words"
              error={errors.displayName}
            />

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
              placeholder="6文字以上"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.password}
            />

            <Input
              label="パスワード（確認）"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              placeholder="パスワードを再入力"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.confirmPassword}
            />

            <Button
              title="アカウントを作成"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.signUpButton}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: defaultColors.textSecondary }]}>
                すでにアカウントをお持ちですか？
              </Text>
              <TouchableOpacity onPress={handleGoToLogin} disabled={loading}>
                <Text style={[styles.linkText, { color: defaultColors.primary }]}>
                  ログイン
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
  signUpButton: {
    marginTop: spacing.lg,
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
