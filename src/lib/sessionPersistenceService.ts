// Service for auto-persisting and restoring browsing session state (tabs, navigation stack, history) in IndexedDB
const DB_NAME = 'NavegadorX_Session_DB';
const DB_VERSION = 1;
const STORE_NAME = 'browsing_sessions';
const ACTIVE_SESSION_KEY = 'active_session';

export interface TabSessionItem {
  id: string;
  title: string;
  url: string;
  tabType: 'dashboard' | 'home' | 'vpn' | 'miner' | 'ai' | 'marketplace' | 'admin' | 'runtime' | 'favorites';
  isBrowsing: boolean;
  browsingUrl: string;
  runtimeUri: string;
  navHistory: string[];
  navHistoryIndex: number;
}

export interface HistorySessionItem {
  id: string;
  url: string;
  title: string;
  isInternal?: boolean;
  visitCount?: number;
  category?: string;
}

export interface BrowsingSessionState {
  sessionId: string;
  activeTab: 'dashboard' | 'home' | 'vpn' | 'miner' | 'ai' | 'marketplace' | 'admin' | 'runtime' | 'favorites';
  url: string;
  isBrowsing: boolean;
  browsingUrl: string;
  runtimeUri: string;
  navHistory: string[];
  navHistoryIndex: number;
  history: HistorySessionItem[];
  openTabs: TabSessionItem[];
  activeTabId: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves the current active browsing session state asynchronously to IndexedDB.
 */
export async function saveBrowsingSession(sessionState: Omit<BrowsingSessionState, 'sessionId' | 'updatedAt'>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const fullState: BrowsingSessionState = {
        ...sessionState,
        sessionId: ACTIVE_SESSION_KEY,
        updatedAt: Date.now()
      };

      const request = store.put(fullState);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[SessionPersistence] Failed to save session to IndexedDB:', err);
  }
}

/**
 * Retrieves the saved browsing session state from IndexedDB.
 */
export async function getBrowsingSession(): Promise<BrowsingSessionState | null> {
  const start = performance.now();
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(ACTIVE_SESSION_KEY);

      request.onsuccess = () => {
        const result: BrowsingSessionState | undefined = request.result;
        if (result) {
          console.debug(`[SessionPersistence] Loaded browsing session from IDB in ${(performance.now() - start).toFixed(2)}ms`, result);
        }
        resolve(result || null);
      };

      request.onerror = () => {
        console.warn('[SessionPersistence] Error fetching session from IDB:', request.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[SessionPersistence] IndexedDB read fallback:', err);
    return null;
  }
}

/**
 * Clears the persisted session from IndexedDB.
 */
export async function clearBrowsingSession(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(ACTIVE_SESSION_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[SessionPersistence] Error clearing IDB session:', err);
  }
}
