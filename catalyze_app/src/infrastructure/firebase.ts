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
    console.log('Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized successfully');

    db = getFirestore(app);
    console.log('Firestore initialized successfully');

    // React Native の場合は initializeAuth を呼び出し、可能なら AsyncStorage ベースの永続化を有効にする
    try {
      if (getReactNativePersistence) {
        auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
        console.log('Firebase Auth initialized with AsyncStorage persistence');
      } else {
        auth = initializeAuth(app);
        console.log('Firebase Auth initialized without persistence');
      }
    } catch (e) {
      console.warn('initializeAuth failed, falling back to default Auth.\n', e);
      auth = initializeAuth(app);
    }
  } else {
    console.log('Firebase app already initialized');
    app = getApps()[0];
    db = getFirestore(app);
    // Import getAuth to get existing auth instance
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  }
} catch (e) {
  // firebaseConfig が不正（空の apiKey 等）の場合、ここに来る可能性があります。
  console.error('Failed to initialize Firebase app. Please check src/infrastructure/firebaseConfig.ts', e);
  console.error('firebaseConfig values:', {
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'undefined',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  throw e; // Re-throw to prevent app from starting with broken Firebase
}

export { app, db, auth };
