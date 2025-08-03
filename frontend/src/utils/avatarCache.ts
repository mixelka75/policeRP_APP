// src/utils/avatarCache.ts
interface CacheEntry {
  url: string;
  timestamp: number;
  nickname: string;
  uuid: string;
}

interface Cache {
  [key: string]: CacheEntry;
}

class AvatarCache {
  private static readonly CACHE_KEY = 'minecraft_avatar_cache';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа
  private static readonly MAX_CACHE_SIZE = 100; // Максимум 100 записей

  static get(nickname: string): CacheEntry | null {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return null;

      const cache: Cache = JSON.parse(cacheData);
      const entry = cache[nickname.toLowerCase()];

      if (!entry) return null;

      // Проверяем не истек ли кеш
      const now = Date.now();
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.remove(nickname);
        return null;
      }

      return entry;
    } catch (error) {
      console.warn('Failed to read avatar cache:', error);
      return null;
    }
  }

  static set(nickname: string, url: string, uuid: string): void {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      let cache: Cache = {};

      if (cacheData) {
        cache = JSON.parse(cacheData);
      }

      // Добавляем новую запись
      cache[nickname.toLowerCase()] = {
        url,
        timestamp: Date.now(),
        nickname,
        uuid
      };

      // Проверяем размер кеша и удаляем старые записи если нужно
      this.cleanupCache(cache);

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to write avatar cache:', error);
    }
  }

  static remove(nickname: string): void {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return;

      const cache: Cache = JSON.parse(cacheData);
      delete cache[nickname.toLowerCase()];

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to remove from avatar cache:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear avatar cache:', error);
    }
  }

  private static cleanupCache(cache: Cache): void {
    const entries = Object.entries(cache);
    
    if (entries.length <= this.MAX_CACHE_SIZE) return;

    // Сортируем по времени (старые первыми)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Удаляем самые старые записи
    const toRemove = entries.length - this.MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  static getCacheInfo(): { size: number; entries: CacheEntry[] } {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return { size: 0, entries: [] };

      const cache: Cache = JSON.parse(cacheData);
      const entries = Object.values(cache);

      return {
        size: entries.length,
        entries: entries.sort((a, b) => b.timestamp - a.timestamp)
      };
    } catch (error) {
      console.warn('Failed to get cache info:', error);
      return { size: 0, entries: [] };
    }
  }
}

export default AvatarCache;