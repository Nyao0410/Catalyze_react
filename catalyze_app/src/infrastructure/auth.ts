import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { app, auth } from './firebase';
import firebaseConfig from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_USER_ID_KEY = '@studynext:local_user_id';

/**
 * ローカルユーザーIDを生成・取得
 * ログインしていない場合にデバイス固有のIDを使用
 */
async function getOrCreateLocalUserId(): Promise<string> {
  try {
    const storedId = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);
    if (storedId) {
      return storedId;
    }
    
    // 新しいローカルIDを生成
    const newId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(LOCAL_USER_ID_KEY, newId);
    console.log('[Auth] Created new local user ID:', newId);
    return newId;
  } catch (error) {
    console.error('Failed to get/create local user ID:', error);
    return 'local-default';
  }
}

/**
 * 現在のユーザー UID を取得
 * - ログイン済み: Firebase UIDを返す
 * - 未ログイン: ローカルユーザーIDを返す
 */
export async function getCurrentUserId(): Promise<string> {
  if (auth && auth.currentUser) {
    return auth.currentUser.uid;
  }
  // 未ログインの場合はローカルID
  return await getOrCreateLocalUserId();
}

/**
 * ユーザーがログインしているかチェック
 */
export function isUserLoggedIn(): boolean {
  return !!(auth && auth.currentUser);
}

/**
 * メールアドレスとパスワードでアカウントを作成
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check firebaseConfig.');
  }
  
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  
  // プロフィール情報を更新
  if (credential.user) {
    await updateProfile(credential.user, {
      displayName: displayName,
    });
  }
  
  return credential.user;
}

/**
 * メールアドレスとパスワードでログイン
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check firebaseConfig.');
  }
  
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check firebaseConfig.');
  }
  
  await firebaseSignOut(auth);
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * 認証状態の変更を監視
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check firebaseConfig.');
  }
  
  return onAuthStateChanged(auth, callback);
}

// export nothing else here; App uses ensureAnonymousSignIn
