import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
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

// export nothing else here; App uses ensureAnonymousSignIn
