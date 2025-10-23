/**
 * Catalyze AI - Firebase Account Service
 * Firebase認証とFirestoreを使用したアカウント管理サービス
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { getCurrentUserId } from '../../infrastructure/auth';
import type { UserProfile, UserSettings } from '../../types';

const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';

export class FirebaseAccountService {
  /**
   * Firestoreからプロフィールを取得
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return null;
      }
      
      const docRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    } catch (error) {
      console.error('Failed to get profile from Firestore:', error);
      return null;
    }
  }

  /**
   * Firestoreにプロフィールを保存
   */
  static async saveProfile(profile: UserProfile): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const docRef = doc(db, USERS_COLLECTION, profile.userId);
      await setDoc(docRef, {
        ...profile,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
      
      console.debug('[FirebaseAccountService] saveProfile success', { userId: profile.userId });
    } catch (error) {
      console.error('Failed to save profile to Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreでプロフィールを更新
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>
  ): Promise<UserProfile> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const docRef = doc(db, USERS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Profile not found');
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updatedData);
      
      const updated = await this.getProfile(userId);
      if (!updated) {
        throw new Error('Failed to retrieve updated profile');
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update profile in Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreから設定を取得
   */
  static async getSettings(userId: string): Promise<UserSettings | null> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return null;
      }
      
      const docRef = doc(db, SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        userId: docSnap.id,
        notifications: data.notifications ?? false,
        darkMode: data.darkMode ?? false,
        soundEffects: data.soundEffects ?? false,
        dailyReminder: data.dailyReminder ?? false,
        weeklyReport: data.weeklyReport ?? false,
        pomodoroWorkMinutes: data.pomodoroWorkMinutes ?? 25,
        pomodoroBreakMinutes: data.pomodoroBreakMinutes ?? 5,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserSettings;
    } catch (error) {
      console.error('Failed to get settings from Firestore:', error);
      return null;
    }
  }

  /**
   * Firestoreに設定を保存
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const docRef = doc(db, SETTINGS_COLLECTION, settings.userId);
      await setDoc(docRef, {
        ...settings,
        updatedAt: settings.updatedAt,
      });
      
      console.debug('[FirebaseAccountService] saveSettings success', { userId: settings.userId });
    } catch (error) {
      console.error('Failed to save settings to Firestore:', error);
      throw error;
    }
  }

  /**
   * Firestoreで設定を更新
   */
  static async updateSettings(
    userId: string,
    updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>
  ): Promise<UserSettings> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      const docRef = doc(db, SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Settings not found');
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updatedData);
      
      const updated = await this.getSettings(userId);
      if (!updated) {
        throw new Error('Failed to retrieve updated settings');
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update settings in Firestore:', error);
      throw error;
    }
  }

  /**
   * デフォルトプロフィールを初期化（Firestore）
   */
  static async initializeDefaultProfile(userId: string, email: string, displayName?: string): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      displayName: displayName || 'ユーザー',
      avatar: '👨‍💼',
      email,
      level: 1,
      totalStudyHours: 0,
      totalPoints: 0,
      currentPoints: 0,
      pointsToNextLevel: 100,
      levelUpProgress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveProfile(profile);
    return profile;
  }

  /**
   * デフォルト設定を初期化（Firestore）
   */
  static async initializeDefaultSettings(): Promise<UserSettings> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const settings: UserSettings = {
      userId,
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
   * UserIdでユーザーを検索（Firestore）
   */
  static async searchUserByUserId(userId: string): Promise<UserProfile | null> {
    try {
      if (!db) {
        console.warn('Firestore not initialized');
        return null;
      }
      
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Failed to search user by userId:', error);
      return null;
    }
  }
}
