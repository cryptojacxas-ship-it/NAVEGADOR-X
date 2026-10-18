import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity Test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { 
  saveProfileSnapshotIDB, 
  clearProfileSnapshotIDB, 
  getProfileSnapshotIDB 
} from './idbSession';

// Session Cache Helpers for 0ms ultra-fast login restoration
const USER_CACHE_KEY = 'navegadorx_cached_user_session';

export function getCachedUserSession() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function cacheUserSession(user: FirebaseUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(USER_CACHE_KEY);
      clearProfileSnapshotIDB().catch(() => {});
    } else {
      const payload = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        cachedAt: Date.now()
      };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(payload));
      saveProfileSnapshotIDB(payload).catch(() => {});
    }
  } catch (e) {
    console.warn('Unable to cache user session locally:', e);
  }
}

// Auth Helpers
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Enable fast account selection
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    cacheUserSession(result.user);
    // Non-blocking profile synchronization
    ensureUserProfile(result.user).catch(err => console.warn('Non-blocking user profile sync error:', err));
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => {
  cacheUserSession(null);
  return signOut(auth);
};

// Profile Helper
export async function ensureUserProfile(user: FirebaseUser) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    let role = 'user';
    let earnings = 0;

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        earnings: 0,
        role: 'user', // Rules will verify this
        status: 'active',
        preferences: {
          ai: {
            persona: 'concise',
            model: 'gemini-1.5-flash'
          }
        },
        lastActive: new Date().toISOString()
      });
    } else {
      const data = userDoc.data();
      role = data?.role || 'user';
      earnings = data?.earnings || 0;
      await updateDoc(userRef, {
        lastActive: new Date().toISOString()
      });
    }

    // Persist full profile snapshot to IndexedDB for <10ms state reconciliation
    saveProfileSnapshotIDB({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      earnings,
      cachedAt: Date.now()
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}
