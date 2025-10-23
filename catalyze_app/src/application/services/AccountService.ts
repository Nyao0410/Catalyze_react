/**
 * StudyNext - Account Service
 * アカウント管理サービス（AsyncStorage使用）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, UserSettings } from '../../types';
import { UserLevelService } from './UserLevelService';

const PROFILE_KEY = '@studynext:profile';
const SETTINGS_KEY = '@studynext:settings';

export class AccountService {
  /**
   * プロフィールを取得
   */
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (!data) {
        return null;
      }
      
      const profile = JSON.parse(data);
      
      // 古いプロフィールに新しいフィールドが無い場合はデフォルト値を追加
      const updatedProfile: UserProfile = {
        ...profile,
        // ポイント・レベルシステムのデフォルト値
        totalPoints: profile.totalPoints ?? 0,
        currentPoints: profile.currentPoints ?? 0,
        pointsToNextLevel: profile.pointsToNextLevel ?? 100,
        levelUpProgress: profile.levelUpProgress ?? 0,
        level: profile.level ?? 1,
        totalStudyHours: profile.totalStudyHours ?? 0,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
      
      // 新しいフィールドが追加された場合は保存し直す
      if (updatedProfile.totalPoints !== profile.totalPoints ||
          updatedProfile.currentPoints !== profile.currentPoints ||
          updatedProfile.pointsToNextLevel !== profile.pointsToNextLevel ||
          updatedProfile.levelUpProgress !== profile.levelUpProgress) {
        await this.saveProfile(updatedProfile);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('[AccountService] getProfile error:', error);
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
      console.log('[AccountService] getSettings called');
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!data) {
        console.log('[AccountService] getSettings: no data found');
        return null;
      }
      
      const settings = JSON.parse(data);
      console.log('[AccountService] getSettings: data found', { userId: settings.userId });
      return {
        ...settings,
        updatedAt: new Date(settings.updatedAt),
      };
    } catch (error) {
      console.error('[AccountService] getSettings error:', error);
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
    console.log('[AccountService] initializeDefaultProfile called', { userId, email, displayName });
    const profile: UserProfile = {
      userId,
      displayName: displayName || 'ユーザー',
      avatar: '👨‍💼',
      email,
      level: 1,
      totalStudyHours: 0,
      // ポイント・レベルシステム
      totalPoints: 0,
      currentPoints: 0,
      pointsToNextLevel: 100,
      levelUpProgress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveProfile(profile);
    console.log('[AccountService] initializeDefaultProfile success', { userId });
    return profile;
  }

  /**
   * デフォルト設定を初期化
   */
  static async initializeDefaultSettings(): Promise<UserSettings> {
    console.log('[AccountService] initializeDefaultSettings called');
    const profile = await this.getProfile();
    if (!profile) {
      console.error('[AccountService] initializeDefaultSettings: profile not found');
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
    console.log('[AccountService] initializeDefaultSettings success', { userId: profile.userId });
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

  /**
   * ユーザーポイントを追加
   */
  static async addUserPoints(pointsEarned: number, reason: string = ''): Promise<UserProfile & { leveledUp?: boolean; newLevel?: number }> {
    const profile = await this.getProfile();
    if (!profile) {
      throw new Error('Profile not found');
    }

    // 新しい総ポイントを計算
    const newTotalPoints = profile.totalPoints + pointsEarned;

    // レベルアップをチェック
    const levelUpInfo = UserLevelService.checkLevelUp(profile.totalPoints, newTotalPoints);

    // レベルアップボーナスを追加
    let finalTotalPoints = newTotalPoints;
    if (levelUpInfo.leveledUp) {
      finalTotalPoints += levelUpInfo.bonusPoints;
    }

    // 新しいレベル情報を計算
    const levelInfo = UserLevelService.calculateLevelFromPoints(finalTotalPoints);

    // プロフィール更新
    const updated: UserProfile = {
      ...profile,
      totalPoints: finalTotalPoints,
      level: levelInfo.level,
      currentPoints: levelInfo.currentPoints,
      pointsToNextLevel: levelInfo.pointsToNextLevel,
      levelUpProgress: levelInfo.progress,
      updatedAt: new Date(),
    };

    await this.saveProfile(updated);
    console.log('[AccountService] addUserPoints success', {
      userId: profile.userId,
      pointsEarned,
      reason,
      newLevel: levelInfo.level,
      leveledUp: levelUpInfo.leveledUp,
    });

    // レベルアップ情報を追加して返す
    return {
      ...updated,
      leveledUp: levelUpInfo.leveledUp,
      newLevel: levelUpInfo.newLevel,
    };
  }

  /**
   * ユーザー統計情報を取得
   */
  static async getUserStats() {
    const profile = await this.getProfile();
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      level: profile.level,
      totalPoints: profile.totalPoints,
      currentPoints: profile.currentPoints,
      pointsToNextLevel: profile.pointsToNextLevel,
      levelUpProgress: profile.levelUpProgress,
      totalStudyHours: profile.totalStudyHours,
    };
  }
}

