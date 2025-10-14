/**
 * Service Chooser
 * 単一の切り替えポイントからアプリ全体で使用するサービス実装を選択します。
 * 環境変数またはランタイムフラグで AsyncStorage (デフォルト) と Firestore を切り替え可能にします。
 */

import { AccountService as AsyncAccountService } from './AccountService';
import { SocialService as AsyncSocialService } from './SocialService';
import { FirestoreAccountService } from './FirestoreAccountService';
import { FirestoreSocialService } from './FirestoreSocialService';
import { isUserLoggedIn } from '../../infrastructure/auth';
import type {
	UserProfile,
	UserSettings,
	Friend,
	CooperationGoal,
	UserPoints,
	RankingEntry,
} from '../../types';

// 環境やビルド時に切り替えたい場合はここを書き換えるか
// process.env.USE_FIRESTORE を利用してください。
const USE_FIRESTORE_DEFAULT = false; // Firebase Firestoreを使用（デフォルト） - 未ログイン時の問題を避けるためfalseに設定

// ログイン状態によってサービスを選択
function getAccountService(): AccountServiceInterface {
  const useFirestore = USE_FIRESTORE_DEFAULT && isUserLoggedIn();
  return (useFirestore ? (FirestoreAccountService as unknown) : (AsyncAccountService as unknown)) as AccountServiceInterface;
}

function getSocialService(): SocialServiceInterface {
  const useFirestore = USE_FIRESTORE_DEFAULT && isUserLoggedIn();
  return (useFirestore ? (FirestoreSocialService as unknown) : (AsyncSocialService as unknown)) as SocialServiceInterface;
}

// アプリ内で利用する最小のサービスインターフェースを定義
export type AccountServiceInterface = {
	getProfile(): Promise<UserProfile | null>;
	updateProfile(updates: Partial<Pick<UserProfile, 'displayName' | 'avatar'>>): Promise<UserProfile | null>;
	getSettings(): Promise<UserSettings | null>;
	updateSettings(updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>): Promise<UserSettings>;
	addStudyHours(hours: number): Promise<UserProfile>;
	initializeDefaultProfile(userId: string, email: string, displayName?: string): Promise<UserProfile>;
	initializeDefaultSettings(): Promise<UserSettings>;
	clearAll(): Promise<void>;
};

export type SocialServiceInterface = {
	getFriends(userId: string): Promise<Friend[]>;
	addFriend(userId: string, friend: Omit<Friend, 'userId' | 'addedAt'>): Promise<Friend>;
	removeFriend(userId: string, friendId: string): Promise<void>;
	getCooperationGoals(userId: string): Promise<CooperationGoal[]>;
	createCooperationGoal(goal: Omit<CooperationGoal, 'id' | 'createdAt' | 'status'>): Promise<CooperationGoal>;
	updateGoalProgress(goalId: string, progress: number): Promise<CooperationGoal>;
	getUserPoints(userId: string): Promise<UserPoints | null>;
	addPoints(userId: string, points: number): Promise<UserPoints>;
	resetWeeklyPoints(userId: string): Promise<UserPoints>;
	getRanking(userIds: string[]): Promise<RankingEntry[]>;
	initializeMockData(userId: string): Promise<void>;
};

// concrete export: cast implementations to the interface so callers see a stable API
export const AccountService: AccountServiceInterface = getAccountService();
export const SocialService: SocialServiceInterface = getSocialService();

export default { AccountService, SocialService };
