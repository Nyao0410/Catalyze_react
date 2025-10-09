import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';
// AsyncStorage is used for persistence on React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence may not exist on older firebase versions; import dynamically
let getReactNativePersistence: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
} catch (e) {
  // no-op: will fallback to initializeAuth without persistence
}
import firebaseConfig from './firebaseConfig';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: any = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // React Native の場合は initializeAuth を呼び出し、可能なら AsyncStorage ベースの永続化を有効にする
    try {
      if (getReactNativePersistence) {
        auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      } else {
        auth = initializeAuth(app);
      }
    } catch (e) {
      console.warn('initializeAuth failed, falling back to default Auth.\n', e);
    }
  }
} catch (e) {
  // firebaseConfig が不正（空の apiKey 等）の場合、ここに来る可能性があります。
  console.error('Failed to initialize Firebase app. Please check src/infrastructure/firebaseConfig.ts', e);
}

export { app, db, auth };
