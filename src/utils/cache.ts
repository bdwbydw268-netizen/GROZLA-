/**
 * Safe local storage caching utility with error handling and fallback support.
 */

const CACHE_PREFIX = 'own_app_cache_';

export function getCache<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (error) {
    console.warn(`[Cache] Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

export function setCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Cache] Error saving ${key} to localStorage:`, error);
    // If quota is exceeded, clear old caches to free space
    try {
      cleanupOldCache();
    } catch {
      // ignore
    }
  }
}

export function removeCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn(`[Cache] Error removing ${key} from localStorage:`, error);
  }
}

export function cleanupOldCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX) && !key.includes('lang')) {
        // Safe clear transient cache data
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

export function safeSaveSavedAccounts(accounts: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Sanitize large avatar strings (keep under 50kb or placeholder if huge base64) to prevent quota issues
    const sanitized = accounts.map(acc => {
      let avatar = acc.avatar;
      if (avatar && typeof avatar === 'string' && avatar.length > 50000) {
        // Truncate or use a lighter fallback if huge data url
        avatar = avatar.startsWith('data:') ? '' : avatar;
      }
      return {
        uid: acc.uid || acc.id,
        email: acc.email || '',
        phone: acc.phone || '',
        name: acc.name || '',
        avatar: avatar || ''
      };
    });
    localStorage.setItem('savedAccounts', JSON.stringify(sanitized));
  } catch (error) {
    console.warn('[Cache] Error saving savedAccounts, attempting cleanup:', error);
    try {
      cleanupOldCache();
      const minimal = accounts.map(acc => ({
        uid: acc.uid || acc.id,
        email: acc.email || '',
        phone: acc.phone || '',
        name: acc.name || '',
        avatar: ''
      }));
      localStorage.setItem('savedAccounts', JSON.stringify(minimal));
    } catch {
      // ignore
    }
  }
}
