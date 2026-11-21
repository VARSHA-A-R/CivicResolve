import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { initAppCheck } from './appCheck';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  projectId?: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const checkFirebaseConfig = (): FirebaseConfigStatus => {
  const required: Array<keyof typeof firebaseConfig> = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ];

  const missingKeys = required.filter(
    (key) => !firebaseConfig[key] || firebaseConfig[key].trim() === ''
  );

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
    projectId: firebaseConfig.projectId || undefined,
  };
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const configStatus = checkFirebaseConfig();

if (configStatus.isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialize App Check (Debug provider in dev, reCAPTCHA Enterprise in prod)
    initAppCheck(app);

    console.info('[CivicResolve] Firebase successfully initialized for project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[CivicResolve] Firebase initialization failed. Falling back to offline client store.', error);
  }
} else {
  console.info(
    '[CivicResolve] Firebase environment variables not yet provided. CivicResolve is running in resilient preview mode with full mock persistence.'
  );
}

export { app, auth, db, storage };
export const isFirebaseConfigured = () => configStatus.isConfigured;
export const getFirebaseConfigStatus = () => configStatus;
