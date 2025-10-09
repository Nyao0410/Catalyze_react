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
import type { UserSettings } from '../../types';
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  scheduleDailyReminder,
  cancelAllNotifications,
  sendTestNotification,
} from '../../infrastructure/notifications';

const CURRENT_USER_ID = 'user-001';
const CURRENT_USER_EMAIL = 'user@studynext.app';

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
  
  // 編集用のローカルstate
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍💼');
  
  // プロフィール・設定の初期化
  useEffect(() => {
    if (!profile) {
      initializeProfile({ userId: CURRENT_USER_ID, email: CURRENT_USER_EMAIL });
    }
    if (!settings) {
      initializeSettings(CURRENT_USER_ID);
    }
  }, [profile, settings, initializeProfile, initializeSettings]);
  
  // プロフィール更新時に編集フォームを初期化
  useEffect(() => {
    if (profile) {
      setTempDisplayName(profile.displayName);
      setSelectedAvatar(profile.avatar);
    }
  }, [profile]);

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
          Alert.alert('保存完了', 'プロフィールを更新しました');
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
      </View>
    );
  }

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarLarge}>{isEditing ? selectedAvatar : profile.avatar}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="star" size={12} color={colors.white} />
            <Text style={styles.levelText}>{profile.level}</Text>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.totalHoursLabel}>総学習時間</Text>
          <Text style={styles.totalHours}>{profile.totalStudyHours}時間</Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>表示名</Text>
            <TextInput
              style={styles.input}
              value={tempDisplayName}
              onChangeText={setTempDisplayName}
              placeholder="表示名を入力"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>アバター選択</Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.editButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileDetails}>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>表示名</Text>
            <Text style={styles.profileValue}>{profile.displayName}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>メール</Text>
            <Text style={styles.profileValue}>{profile.email}</Text>
          </View>
          
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.editProfileButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>設定</Text>
      
      <View style={styles.settingCard}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>通知</Text>
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
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>ダークモード</Text>
              <Text style={styles.settingDescription}>外観を暗くする</Text>
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
            <Ionicons name="volume-high-outline" size={24} color={colors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>効果音</Text>
              <Text style={styles.settingDescription}>音声フィードバック</Text>
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
            <Ionicons name="alarm-outline" size={24} color={colors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>毎日のリマインダー</Text>
              <Text style={styles.settingDescription}>学習時間を通知</Text>
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
            <Ionicons name="analytics-outline" size={24} color={colors.text} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>週次レポート</Text>
              <Text style={styles.settingDescription}>毎週の進捗レポート</Text>
            </View>
          </View>
          <Switch
            value={settings.weeklyReport}
            onValueChange={() => toggleSetting('weeklyReport')}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.weeklyReport ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderOtherSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>その他</Text>
      
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Help')}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={styles.menuTitle}>ヘルプ・サポート</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Terms')}>
          <View style={styles.menuLeft}>
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text style={styles.menuTitle}>利用規約</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <View style={styles.menuLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
            <Text style={styles.menuTitle}>プライバシーポリシー</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
          <View style={styles.menuLeft}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
            <Text style={styles.menuTitle}>アプリについて</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={24} color={colors.error} />
        <Text style={styles.logoutButtonText}>ログアウト</Text>
      </TouchableOpacity>
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
});
