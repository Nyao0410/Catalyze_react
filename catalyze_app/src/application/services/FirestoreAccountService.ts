import { doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { db } from '../../infrastructure/firebase';
import type { UserProfile, UserSettings } from '../../types';

export class FirestoreAccountService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
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
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
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
  }

  static async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>): Promise<UserProfile | null> {
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'users', userId);
    await updateDoc(ref, { ...updates, updatedAt: new Date() });
    return this.getProfile(userId);
  }

  static async getSettings(userId: string): Promise<UserSettings | null> {
    try {
  if (!db) throw new Error('Firestore not initialized');
  const firestore = db as Firestore;
  const ref = doc(firestore, 'userSettings', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as any;
      return {
        userId: snap.id,
        notifications: data.notifications,
        darkMode: data.darkMode,
        soundEffects: data.soundEffects,
        dailyReminder: data.dailyReminder,
        weeklyReport: data.weeklyReport,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
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
  }
}
