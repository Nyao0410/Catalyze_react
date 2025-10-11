import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { app, auth } from './firebase';
import firebaseConfig from './firebaseConfig';

// Do not initialize Auth at module load to avoid throwing when firebase isn't configured.
export async function ensureAnonymousSignIn(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Check firebaseConfig.');
  }
  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser;
  }
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * 現在のユーザー UID を取得（Firebase Auth または fallback）
 */
export function getCurrentUserId(): string {
  if (auth && auth.currentUser) {
    return auth.currentUser.uid;
  }
  // Firebase が未設定の場合はローカル固定 UID
  return 'user-001';
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
