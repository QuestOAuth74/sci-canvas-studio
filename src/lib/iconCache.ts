// IndexedDB cache for parsed SVG icons to improve performance
const DB_NAME = 'IconCacheDB';
const STORE_NAME = 'icons';
const DB_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedIcon {
  id: string;
  svgContent: string;
  parsedData: any; // Serialized Fabric.js object data
  timestamp: number;
  complexity: number;
}

class IconCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IconCache DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async get(id: string): Promise<CachedIcon | null> {
    try {
      await this.initDB();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          const cached = request.result as CachedIcon | undefined;
          
          if (!cached) {
            resolve(null);
            return;
          }

          // Check if cache is still valid
          const age = Date.now() - cached.timestamp;
          if (age > CACHE_TTL) {
            // Cache expired, delete it
            this.delete(id);
            resolve(null);
            return;
          }

          resolve(cached);
        };

        request.onerror = () => {
          console.error('Failed to get cached icon:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(icon: CachedIcon): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({
          ...icon,
          timestamp: Date.now()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to cache icon:', request.error);
          resolve(); // Don't reject, caching is optional
        };
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to delete cached icon:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('Icon cache cleared');
          resolve();
        };
        request.onerror = () => {
          console.error('Failed to clear cache:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async cleanupExpired(): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const cutoffTime = Date.now() - CACHE_TTL;
        const range = IDBKeyRange.upperBound(cutoffTime);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Failed to cleanup expired cache:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Export singleton instance
export const iconCache = new IconCache();

// Cleanup expired entries on load (non-blocking)
if (typeof window !== 'undefined') {
  setTimeout(() => iconCache.cleanupExpired(), 5000);
}
