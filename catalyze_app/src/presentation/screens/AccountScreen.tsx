/**
 * StudyNext - Account Screen
 * ユーザーアカウント設定とプロフィール管理
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabScreenProps } from '../navigation/types';
import { useProfile, useSettings, useUpdateProfile, useUpdateSettings, useInitializeProfile, useInitializeSettings } from '../hooks/useAccount';
import { useTopToast } from '../hooks';
import { useCurrentUserId, useAuthState } from '../hooks/useAuth';
import type { UserSettings } from '../../types';
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  scheduleDailyReminder,
  cancelAllNotifications,
  sendTestNotification,
} from '../../infrastructure/notifications';
import { getCurrentUser, onAuthStateChange, getCurrentUserId } from '../../infrastructure/auth';

export const AccountScreen: React.FC<MainTabScreenProps<'Account'>> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { mode: themeMode, setMode: setThemeMode, colors: themeColors } = useTheme();
  
  // データ取得
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  
  // ミューテーション
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateSettings();
  const { mutate: initializeProfile } = useInitializeProfile();
  const { mutate: initializeSettings } = useInitializeSettings();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('user-001');
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationTimeout, setInitializationTimeout] = useState<NodeJS.Timeout | null>(null);

  // 初期化タイムアウトを設定
  useEffect(() => {
    if (!profile || !settings) {
      const timeout = setTimeout(() => {
        setInitializationError('初期化がタイムアウトしました。アプリを再起動してください。');
      }, 10000); // 10秒
      setInitializationTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    } else {
      // データが取得できた場合はタイムアウトをクリア
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
        setInitializationTimeout(null);
      }
      setInitializationError(null);
    }
  }, [profile, settings, initializationTimeout]);

  // 編集用のローカルstate
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍💼');
  const [pomodoroWorkMinutesInput, setPomodoroWorkMinutesInput] = useState('');
  const [pomodoroBreakMinutesInput, setPomodoroBreakMinutesInput] = useState('');

  // 認証状態の確認
  useEffect(() => {
    const checkAuthState = async () => {
      const currentUser = getCurrentUser();
      const userId = await getCurrentUserId(); // Firebase UIDまたはフォールバック値を取得
      // 匿名ユーザーは認証済みとみなさない（メール/パスワードログインのみを認証済みとする）
      const isLoggedIn = !!(currentUser && !currentUser.isAnonymous);
      setIsAuthenticated(isLoggedIn);
      setCurrentUserEmail(currentUser?.email || null);
      setCurrentUserId(userId);
    };
    
    checkAuthState();
    
    // 認証状態の変更を監視
    const unsubscribe = onAuthStateChange(async (user) => {
      const userId = await getCurrentUserId(); // Firebase UIDまたはフォールバック値を取得
      // 匿名ユーザーは認証済みとみなさない（メール/パスワードログインのみを認証済みとする）
      const isLoggedIn = !!(user && !user.isAnonymous);
      setIsAuthenticated(isLoggedIn);
      setCurrentUserEmail(user?.email || null);
      setCurrentUserId(userId);
    });
    
    return unsubscribe;
  }, []);
  
  // プロフィール・設定の初期化
  useEffect(() => {
    if (!profile && currentUserId && !isLoadingProfile) {
      // ログイン済みユーザーの場合は実際のメールアドレスを使用、匿名ユーザーの場合は生成したメールアドレスを使用
      const emailToUse = currentUserEmail || `${currentUserId}@local`;
      console.log('[AccountScreen] Initializing profile for userId:', currentUserId, 'email:', emailToUse);
      initializeProfile({ userId: currentUserId, email: emailToUse });
    }
  }, [profile, currentUserEmail, currentUserId, isLoadingProfile]);

  // プロフィールが初期化された後に設定を初期化
  useEffect(() => {
    if (profile && !settings && currentUserId && !isLoadingSettings) {
      console.log('[AccountScreen] Initializing settings for userId:', currentUserId);
      initializeSettings();
    }
  }, [profile, settings, currentUserId, isLoadingSettings]);
  
  // プロフィール更新時に編集フォームを初期化
  useEffect(() => {
    if (profile) {
      setTempDisplayName(profile.displayName);
      setSelectedAvatar(profile.avatar);
    }
  }, [profile]);

  // 設定更新時に入力フィールドを初期化
  useEffect(() => {
    if (settings) {
      setPomodoroWorkMinutesInput(settings.pomodoroWorkMinutes?.toString() || '');
      setPomodoroBreakMinutesInput(settings.pomodoroBreakMinutes?.toString() || '');
    }
  }, [settings]);

  const toast = useTopToast();

  const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨', '👩', '🧔', '👱‍♀️', '👨‍🔬', '👩‍🔬', '🧑'];

  const handleSaveProfile = () => {
    updateProfile(
      {
        displayName: tempDisplayName,
        avatar: selectedAvatar,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          // トーストで成功を表示
          toast.show('プロフィールを更新しました');
        },
      }
    );
  };

  const handleCancelEdit = () => {
    if (profile) {
      setTempDisplayName(profile.displayName);
      setSelectedAvatar(profile.avatar);
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              // Firebase認証を動的にインポート
              const { signOut } = await import('../../infrastructure/auth');
              
              // ログアウト処理
              await signOut();
              
              // ローカルデータは保持して、非ログイン状態でアカウント画面に留まる
              toast.show('ログアウトしました');
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  const toggleSetting = async (key: keyof UserSettings) => {
    if (settings && key !== 'userId' && key !== 'updatedAt') {
      const newValue = !settings[key];
      
      // 通知の場合は特別な処理
      if (key === 'notifications') {
        if (newValue) {
          // 通知を有効化
          const granted = await requestNotificationPermissions();
          if (!granted) {
            // 許可されなかった場合は設定を変更しない
            return;
          }
        }
      }
      
      // dailyReminderの場合はスケジュール設定
      if (key === 'dailyReminder') {
        if (newValue) {
          await scheduleDailyReminder(20, 0); // 20:00にリマインダー
        } else {
          await cancelAllNotifications();
        }
      }
      
      // ダークモードの場合はテーマを切り替え
      if (key === 'darkMode') {
        setThemeMode(newValue ? 'dark' : 'light');
      }
      
      updateSettings({ [key]: newValue });
    }
  };
  
  // ローディング中
  if (isLoadingProfile || isLoadingSettings) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  // データがない場合（初期化中）
  if (!profile || !settings) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>初期化中...</Text>
        {initializationError && (
          <Text style={styles.errorText}>{initializationError}</Text>
        )}
      </View>
    );
  }

  const renderProfileSection = () => (
    <View style={styles.section}>
            {!isAuthenticated && (
        <View style={styles.guestStatus}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <View style={styles.guestTextContainer}>
            <Text style={styles.guestText}>ゲストとして利用中</Text>
            <Text style={styles.guestSubtext}>アカウントを作成すると学習データをクラウドに保存できます</Text>
          </View>
        </View>
      )}
      <View style={[styles.profileHeader, { backgroundColor: themeColors.card }]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarLarge}>{isEditing ? selectedAvatar : profile.avatar}</Text>
          <View style={[styles.levelBadge, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="star" size={12} color={themeColors.white} />
            <Text style={styles.levelText}>{profile.level}</Text>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={[styles.totalHoursLabel, { color: themeColors.textSecondary }]}>総学習時間</Text>
          <Text style={[styles.totalHours, { color: themeColors.primary }]}>{Math.floor(profile.totalStudyHours)}時間</Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>表示名</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={tempDisplayName}
              onChangeText={setTempDisplayName}
              placeholder="表示名を入力"
              placeholderTextColor={themeColors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>アバター選択</Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && [styles.avatarOptionSelected, { backgroundColor: themeColors.primaryLight, borderColor: themeColors.primary }],
                    { backgroundColor: themeColors.background, borderColor: themeColors.border },
                  ]}
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editButtons}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: themeColors.background, borderColor: themeColors.border }]} onPress={handleCancelEdit}>
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.primary }]} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.profileDetails, { backgroundColor: themeColors.card }]}>
          <View style={[styles.profileRow, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.profileLabel, { color: themeColors.textSecondary }]}>表示名</Text>
            <Text style={[styles.profileValue, { color: themeColors.text }]}>{profile.displayName}</Text>
          </View>
          {isAuthenticated && currentUserEmail && (
            <View style={[styles.profileRow, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.profileLabel, { color: themeColors.textSecondary }]}>メール</Text>
              <Text style={[styles.profileValue, { color: themeColors.text }]}>{currentUserEmail}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.editProfileButtonText, { color: themeColors.primary }]}>プロフィールを編集</Text>
          </TouchableOpacity>
          
          {!isAuthenticated && (
            <TouchableOpacity 
              style={[styles.createAccountButton, { backgroundColor: themeColors.primary }]} 
              onPress={() => navigation.navigate('SignUp')}
            >
              <Ionicons name="person-add-outline" size={20} color={themeColors.white} />
              <Text style={styles.createAccountButtonText}>アカウントを作成</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>設定</Text>
      
      <View style={[styles.settingCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>通知</Text>
              <Text style={styles.settingDescription}>プッシュ通知を受け取る</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => toggleSetting('notifications')}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.notifications ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="moon-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>ダークモード</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>外観を暗くする</Text>
            </View>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSetting('darkMode')}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.darkMode ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="volume-high-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>効果音</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>音声フィードバック</Text>
            </View>
          </View>
          <Switch
            value={settings.soundEffects}
            onValueChange={() => toggleSetting('soundEffects')}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.soundEffects ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="alarm-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>毎日のリマインダー</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>学習時間を通知</Text>
            </View>
          </View>
          <Switch
            value={settings.dailyReminder}
            onValueChange={() => toggleSetting('dailyReminder')}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.dailyReminder ? colors.primary : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="timer-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>ポモドーロ作業時間</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>集中する時間（分）</Text>
            </View>
          </View>
          <TextInput
            style={styles.numberInput}
            value={pomodoroWorkMinutesInput}
            placeholder="25"
            onChangeText={setPomodoroWorkMinutesInput}
            onBlur={() => {
              const value = parseInt(pomodoroWorkMinutesInput) || 25;
              updateSettings({ pomodoroWorkMinutes: Math.max(1, Math.min(60, value)) });
            }}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="cafe-outline" size={24} color={themeColors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: themeColors.text }]}>ポモドーロ休憩時間</Text>
              <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>休憩する時間（分）</Text>
            </View>
          </View>
          <TextInput
            style={styles.numberInput}
            value={pomodoroBreakMinutesInput}
            placeholder="5"
            onChangeText={setPomodoroBreakMinutesInput}
            onBlur={() => {
              const value = parseInt(pomodoroBreakMinutesInput) || 5;
              updateSettings({ pomodoroBreakMinutes: Math.max(0, Math.min(30, value)) });
            }}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>
    </View>
  );

  const renderOtherSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>その他</Text>
      
      <View style={[styles.menuCard, { backgroundColor: themeColors.card }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]} onPress={() => navigation.navigate('Help')}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={24} color={themeColors.text} />
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>ヘルプ・サポート</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]} onPress={() => navigation.navigate('Terms')}>
          <View style={styles.menuLeft}>
            <Ionicons name="document-text-outline" size={24} color={themeColors.text} />
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>利用規約</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: themeColors.border }]} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <View style={styles.menuLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color={themeColors.text} />
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>プライバシーポリシー</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
          <View style={styles.menuLeft}>
            <Ionicons name="information-circle-outline" size={24} color={themeColors.text} />
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>アプリについて</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isAuthenticated && (
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: themeColors.card }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={themeColors.error} />
          <Text style={[styles.logoutButtonText, { color: themeColors.error }]}>ログアウト</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 動的スタイル（テーマ対応）
  const dynamicStyles = StyleSheet.create({
    container: {
      ...styles.container,
      backgroundColor: themeColors.background,
    },
    header: {
      ...styles.header,
      backgroundColor: themeColors.card,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      ...styles.headerTitle,
      color: themeColors.text,
    },
    // その他の動的スタイルも同様に追加...
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>アカウント</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderProfileSection()}
        {renderSettingsSection()}
        {renderOtherSection()}
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textStyles.h2,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    fontSize: 64,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 2,
  },
  levelText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  totalHoursLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalHours: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  profileDetails: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  profileValue: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  editProfileButtonText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: spacing.sm,
  },
  createAccountButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
  },
  editContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...textStyles.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  avatarOptionText: {
    fontSize: 32,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...textStyles.body,
    color: colors.white,
    fontWeight: '600',
  },
  settingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuTitle: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  logoutButtonText: {
    ...textStyles.body,
    color: colors.error,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...textStyles.body,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  numberInput: {
    width: 60,
    textAlign: 'center',
    ...textStyles.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
  },
  guestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  guestTextContainer: {
    flex: 1,
  },
  guestText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  guestSubtext: {
    ...textStyles.caption,
    color: colors.primary,
  },
});
