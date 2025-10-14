/**
 * StudyNext - Account Service
 * アカウント管理サービス（AsyncStorage使用）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, UserSettings } from '../../types';

const PROFILE_KEY = '@studynext:profile';
const SETTINGS_KEY = '@studynext:settings';

export class AccountService {
  /**
   * プロフィールを取得
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (!data) return null;
      
      const profile = JSON.parse(data);
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  /**
   * プロフィールを保存
   */
  static async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      console.debug('[AccountService] saveProfile success', { userId: profile.userId });
      try {
        const saved = await AsyncStorage.getItem(PROFILE_KEY);
        console.debug('[AccountService] verify saveProfile readback', { raw: saved ? saved.length : 0 });
      } catch (e) {
        console.error('[AccountService] verify saveProfile readback failed', e);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * プロフィールを更新
   */
  static async updateProfile(
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>
  ): Promise<UserProfile> {
    const current = await this.getProfile();
    if (!current) {
      throw new Error('Profile not found');
    }

    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveProfile(updated);
    return updated;
  }

  /**
   * 設定を取得
   */
  static async getSettings(): Promise<UserSettings | null> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!data) return null;
      
      const settings = JSON.parse(data);
      return {
        ...settings,
        updatedAt: new Date(settings.updatedAt),
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return null;
    }
  }

  /**
   * 設定を保存
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.debug('[AccountService] saveSettings success', { userId: settings.userId });
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        console.debug('[AccountService] verify saveSettings readback', { raw: saved ? saved.length : 0 });
      } catch (e) {
        console.error('[AccountService] verify saveSettings readback failed', e);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * 設定を更新
   */
  static async updateSettings(
    updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>
  ): Promise<UserSettings> {
    const current = await this.getSettings();
    if (!current) {
      throw new Error('Settings not found');
    }

    const updated: UserSettings = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveSettings(updated);
    return updated;
  }

  /**
   * 総学習時間を更新（学習セッション記録時に呼ばれる）
   */
  static async addStudyHours(hours: number): Promise<UserProfile> {
    const current = await this.getProfile();
    if (!current) {
      throw new Error('Profile not found');
    }

    const updated: UserProfile = {
      ...current,
      totalStudyHours: current.totalStudyHours + hours,
      updatedAt: new Date(),
    };

    await this.saveProfile(updated);
    return updated;
  }

  /**
   * デフォルトプロフィールを初期化
   */
  static async initializeDefaultProfile(userId: string, email: string, displayName?: string): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      displayName: displayName || 'ユーザー',
      avatar: '👨‍💼',
      email,
      level: 1,
      totalStudyHours: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveProfile(profile);
    return profile;
  }

  /**
   * デフォルト設定を初期化
   */
  static async initializeDefaultSettings(): Promise<UserSettings> {
    const profile = await this.getProfile();
    if (!profile) {
      throw new Error('Profile not found - cannot initialize settings');
    }

    const settings: UserSettings = {
      userId: profile.userId,
      notifications: true,
      darkMode: false,
      soundEffects: true,
      dailyReminder: true,
      weeklyReport: true,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      updatedAt: new Date(),
    };

    await this.saveSettings(settings);
    return settings;
  }

  /**
   * すべてのデータをクリア（ログアウト時）
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PROFILE_KEY, SETTINGS_KEY]);
      console.debug('[AccountService] clearAll success');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}
