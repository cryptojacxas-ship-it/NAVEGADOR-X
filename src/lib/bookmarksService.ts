// Service for managing bookmarks with IndexedDB persistence
const DB_NAME = 'NavegadorX_Bookmarks_DB';
const DB_VERSION = 1;
const STORE_NAME = 'bookmarks';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  isInternal?: boolean;
  favicon?: string;
}

export interface BookmarkCategory {
  name: string;
  count: number;
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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds a new bookmark to the database
 */
export async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
  try {
    const db = await openDB();
    const id = `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const fullBookmark: Bookmark = {
      ...bookmark,
      id,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(fullBookmark);

      request.onsuccess = () => {
        console.log('[Bookmarks] Added bookmark:', fullBookmark);
        resolve(fullBookmark);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Bookmarks] Failed to add bookmark:', err);
    throw err;
  }
}

/**
 * Retrieves all bookmarks from the database
 */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const bookmarks = (request.result as Bookmark[]).sort((a, b) => b.createdAt - a.createdAt);
        console.debug(`[Bookmarks] Loaded ${bookmarks.length} bookmarks from IDB`);
        resolve(bookmarks);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Bookmarks] Failed to load bookmarks:', err);
    return [];
  }
}

/**
 * Retrieves bookmarks by category
 */
export async function getBookmarksByCategory(category: string): Promise<Bookmark[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => {
        const bookmarks = (request.result as Bookmark[]).sort((a, b) => b.createdAt - a.createdAt);
        resolve(bookmarks);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Bookmarks] Failed to load bookmarks by category:', err);
    return [];
  }
}

/**
 * Retrieves a single bookmark by ID
 */
export async function getBookmarkById(id: string): Promise<Bookmark | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Bookmarks] Failed to get bookmark:', err);
    return null;
  }
}

/**
 * Checks if a URL is already bookmarked
 */
export async function isUrlBookmarked(url: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('url');
      const request = index.getAll(url);

      request.onsuccess = () => {
        resolve((request.result as Bookmark[]).length > 0);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[Bookmarks] Failed to check if URL is bookmarked:', err);
    return false;
  }
}

/**
 * Updates an existing bookmark
 */
export async function updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<Bookmark | null> {
  try {
    const db = await openDB();
    const existing = await getBookmarkById(id);
    if (!existing) return null;

    const updated: Bookmark = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log('[Bookmarks] Updated bookmark:', updated);
        resolve(updated);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Bookmarks] Failed to update bookmark:', err);
    throw err;
  }
}

/**
 * Deletes a bookmark by ID
 */
export async function deleteBookmark(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[Bookmarks] Deleted bookmark:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Bookmarks] Failed to delete bookmark:', err);
    throw err;
  }
}

/**
 * Gets all unique categories
 */
export async function getBookmarkCategories(): Promise<BookmarkCategory[]> {
  try {
    const bookmarks = await getAllBookmarks();
    const categoryMap = new Map<string, number>();
    
    bookmarks.forEach(bm => {
      const category = bm.category || 'Sin categoría';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.warn('[Bookmarks] Failed to get categories:', err);
    return [];
  }
}

/**
 * Clears all bookmarks from the database
 */
export async function clearAllBookmarks(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[Bookmarks] Cleared all bookmarks');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('[Bookmarks] Failed to clear bookmarks:', err);
    throw err;
  }
}
