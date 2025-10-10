/**
 * StudyNext - Account Types
 * アカウント関連の型定義
 */

export interface UserProfile {
  userId: string;
  displayName: string;
  avatar: string;
  email: string;
  level: number;
  totalStudyHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  notifications: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  updatedAt: Date;
}
