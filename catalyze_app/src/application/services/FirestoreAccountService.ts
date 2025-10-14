import { doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import { getCurrentUserId, isUserLoggedIn } from '../../infrastructure/auth';
import type { UserProfile, UserSettings } from '../../types';

export class FirestoreAccountService {
  static async getProfile(): Promise<UserProfile | null> {
    try {
      // 未ログイン時はFirestoreにアクセスしない
      if (!isUserLoggedIn()) {
        return null;
      }

      const userId = await getCurrentUserId();
      if (!userId) return null;

      if (!db) throw new Error('Firestore not initialized');
      const firestore = db as Firestore;
      const ref = doc(firestore, 'users', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as any;
      return {
        userId: snap.id,
        displayName: data.displayName,
        avatar: data.avatar,
        email: data.email,
        level: data.level ?? 1,
        totalStudyHours: data.totalStudyHours ?? 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
      };
    } catch (error) {
      console.error('Firestore getProfile error', error);
      return null;
    }
  }

  static async saveProfile(profile: UserProfile): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'users', profile.userId);
    await setDoc(ref, {
      displayName: profile.displayName,
      avatar: profile.avatar,
      email: profile.email,
      level: profile.level,
      totalStudyHours: profile.totalStudyHours,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }, { merge: true });
    console.debug('[FirestoreAccountService] saveProfile success', { userId: profile.userId });
  }

  static async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>): Promise<UserProfile | null> {
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'users', userId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
    console.debug('[FirestoreAccountService] updateProfile success', { userId });
    return this.getProfile();
  }

  static async getSettings(): Promise<UserSettings | null> {
    try {
      // 未ログイン時はFirestoreにアクセスしない
      if (!isUserLoggedIn()) {
        return null;
      }

      const userId = await getCurrentUserId();
      if (!userId) return null;

  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'userSettings', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as any;
      return {
        userId: snap.id,
        notifications: data.notifications ?? false,
        darkMode: data.darkMode ?? false,
        soundEffects: data.soundEffects ?? false,
        dailyReminder: data.dailyReminder ?? false,
        weeklyReport: data.weeklyReport ?? false,
        // Provide defaults for pomodoro settings in case they're missing in Firestore
        pomodoroWorkMinutes: data.pomodoroWorkMinutes ?? 25,
        pomodoroBreakMinutes: data.pomodoroBreakMinutes ?? 5,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
      };
    } catch (error) {
      console.error('Firestore getSettings error', error);
      return null;
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'userSettings', settings.userId);
  await setDoc(ref, { ...settings }, { merge: true });
  console.debug('[FirestoreAccountService] saveSettings success', { userId: settings.userId });
  }

  /**
   * 設定を更新
   */
  static async updateSettings(updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>): Promise<UserSettings> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!db) throw new Error('Firestore not initialized');
      const firestore = db as Firestore;
      const ref = doc(firestore, 'userSettings', userId);

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(ref, updatedData);

      const updated = await this.getSettings();
      if (!updated) {
        throw new Error('Failed to retrieve updated settings');
      }

      return updated;
    } catch (error) {
      console.error('Firestore updateSettings error', error);
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

    const defaultSettings: UserSettings = {
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

    if (!db) throw new Error('Firestore not initialized');
    const firestore = db as Firestore;
    await setDoc(doc(firestore, 'userSettings', userId), defaultSettings);
    return defaultSettings;
  }

  /**
   * 学習時間を追加
   */
  static async addStudyHours(hours: number): Promise<UserProfile> {
    // 現在のプロフィールを取得
    const currentProfile = await this.getProfile();
    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    // 学習時間を追加
    const newTotalHours = currentProfile.totalStudyHours + hours;
    const newLevel = Math.floor(newTotalHours / 10) + 1; // 10時間ごとにレベルアップ

    const updatedProfile: UserProfile = {
      ...currentProfile,
      totalStudyHours: newTotalHours,
      level: newLevel,
      updatedAt: new Date(),
    };

    await this.saveProfile(updatedProfile);
    return updatedProfile;
  }

  /**
   * すべてのデータをクリア（ログアウト時）
   */
  static async clearAll(): Promise<void> {
    // Firestoreではデータを削除しない（他のユーザーのデータに影響を与えないため）
    // 実際のクリアはクライアント側で行う
    console.debug('[FirestoreAccountService] clearAll called (no-op for Firestore)');
  }
}
