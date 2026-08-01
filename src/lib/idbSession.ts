// Persistent IndexedDB Storage for User Profile Snapshots & Fast Session Restoration
const DB_NAME = 'NavegadorX_Auth_DB';
const DB_VERSION = 1;
const STORE_NAME = 'user_profile_snapshots';

export interface UserProfileSnapshot {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  earnings?: number;
  preferences?: Record<string, any>;
  cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves the cached user profile snapshot from IndexedDB in <10ms.
 */
export async function getProfileSnapshotIDB(uid?: string): Promise<UserProfileSnapshot | null> {
  const start = performance.now();
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      if (uid) {
        const req = store.get(uid);
        req.onsuccess = () => {
          const result = req.result || null;
          console.debug(`IndexedDB profile lookup for ${uid} completed in ${(performance.now() - start).toFixed(2)}ms`);
          resolve(result);
        };
        req.onerror = () => resolve(null);
      } else {
        // Fetch most recent snapshot
        const req = store.getAll();
        req.onsuccess = () => {
          const items: UserProfileSnapshot[] = req.result || [];
          if (items.length === 0) return resolve(null);
          // Sort by cachedAt descending
          items.sort((a, b) => b.cachedAt - a.cachedAt);
          console.debug(`IndexedDB active profile lookup completed in ${(performance.now() - start).toFixed(2)}ms`);
          resolve(items[0]);
        };
        req.onerror = () => resolve(null);
      }
    });
  } catch (err) {
    console.warn('IndexedDB read fallback:', err);
    return null;
  }
}

/**
 * Saves a user profile snapshot to IndexedDB.
 */
export async function saveProfileSnapshotIDB(snapshot: UserProfileSnapshot): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        ...snapshot,
        cachedAt: Date.now()
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error:', err);
  }
}

/**
 * Clears cached profile snapshots on logout.
 */
export async function clearProfileSnapshotIDB(uid?: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (uid) {
        const req = store.delete(uid);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } else {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }
}
