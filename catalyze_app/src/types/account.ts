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
  // ポイント・レベルシステム
  totalPoints: number;           // 累計獲得ポイント
  currentPoints: number;         // 現在のポイント（レベルアップに向けて）
  pointsToNextLevel: number;     // 次のレベルまでに必要なポイント
  levelUpProgress: number;       // 0-100のレベルアップ進捗
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
