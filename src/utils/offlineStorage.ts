// StudiRad Educational Offline Storage & Service Worker Cache Manager
// Empowers radiography students to save clinical protocols, study handouts, and revision materials for offline studying

export const EDUCATIONAL_CACHE_NAME = 'studirad-edu-resources-v2.0';

export interface OfflineStudyModule {
  id: string;
  title: string;
  category: string;
  course: string;
  modality: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
  }[];
  keyTakeaways: string[];
}

export interface OfflinePackData {
  version: string;
  name: string;
  description: string;
  lastUpdated: string;
  modules: OfflineStudyModule[];
}

/**
 * Check if a specific URL is already stored in the educational offline cache
 */
export async function isResourceCached(url: string): Promise<boolean> {
  if (!('caches' in window) || !url) return false;
  try {
    const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
    const match = await cache.match(url);
    return !!match;
  } catch (err) {
    console.warn('[OfflineStorage] Cache match check failed:', err);
    return false;
  }
}

/**
 * Save an educational material (PDF, image, handout, or web link) into the offline cache
 */
export async function cacheEducationalResource(url: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') return false;

  // 1. Try Direct Cache Storage API
  if ('caches' in window) {
    try {
      const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
      const res = await fetch(url, { mode: 'cors' }).catch(() => null);
      if (res && (res.status === 200 || res.type === 'opaque')) {
        await cache.put(url, res);
        return true;
      }
    } catch (directErr) {
      console.warn('[OfflineStorage] Direct cache put failed, falling back to Service Worker postMessage:', directErr);
    }
  }

  // 2. Fallback to Service Worker messaging
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(!!event.data?.success);
      };

      navigator.serviceWorker.controller?.postMessage(
        {
          type: 'CACHE_EDUCATIONAL_RESOURCE',
          url
        },
        [messageChannel.port2]
      );

      // Timeout after 8 seconds
      setTimeout(() => resolve(false), 8000);
    });
  }

  return false;
}

/**
 * Remove an educational material from the offline cache
 */
export async function uncacheEducationalResource(url: string): Promise<boolean> {
  if (!('caches' in window) || !url) return false;
  try {
    const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
    return await cache.delete(url);
  } catch {
    return false;
  }
}

/**
 * Get count of all currently cached educational files in the offline cache
 */
export async function getCachedResourcesCount(): Promise<number> {
  if (!('caches' in window)) return 0;
  try {
    const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  } catch {
    return 0;
  }
}

/**
 * Load the pre-cached core offline radiography study pack
 */
export async function getOfflineStudyPack(): Promise<OfflinePackData | null> {
  try {
    // 1. Check offline cache first
    if ('caches' in window) {
      const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
      const match = await cache.match('/educational-offline-pack.json');
      if (match) {
        return await match.json();
      }
    }

    // 2. Fetch from network or app public bundle
    const res = await fetch('/educational-offline-pack.json');
    if (res.ok) {
      const data = await res.json();
      // Store in cache for future offline access
      if ('caches' in window) {
        const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
        cache.put('/educational-offline-pack.json', new Response(JSON.stringify(data)));
      }
      return data;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error fetching offline study pack:', err);
  }
  return null;
}

/**
 * Precache all essential core study resources with progress feedback
 */
export async function precacheAllCoreResources(onProgress?: (count: number) => void): Promise<boolean> {
  try {
    const coreUrls = [
      '/educational-offline-pack.json',
      '/artifacts.jpeg',
      '/Critiquing.jpeg',
      '/Abd.jpg',
      '/transform_radiography.jpg'
    ];

    if ('caches' in window) {
      const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
      let count = 0;
      for (const url of coreUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await cache.put(url, res);
            count++;
            onProgress?.(count);
          }
        } catch {
          // ignore individual fails
        }
      }
      return count > 0;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Precache all failed:', err);
  }
  return false;
}
