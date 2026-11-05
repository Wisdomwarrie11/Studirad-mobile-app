// StudiRad Progressive Web App Service Worker (v2.0)
// High-performance offline caching for radiography students, clinical resources, and educational materials

const CORE_CACHE_NAME = 'studirad-core-v2.0';
const EDUCATIONAL_CACHE_NAME = 'studirad-edu-resources-v2.0';

// Core Application Shell & Static Assets
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png'
];

// Core Radiography Educational Resources to Precache for Guaranteed Offline Study
const CORE_EDUCATIONAL_RESOURCES = [
  '/educational-offline-pack.json',
  '/artifacts.jpeg',
  '/Critiquing.jpeg',
  '/Abd.jpg',
  '/transform_radiography.jpg'
];

// 1. Install Event: Precache both Shell and Core Educational Resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Precache Core Shell
      caches.open(CORE_CACHE_NAME).then((cache) => {
        return cache.addAll(SHELL_ASSETS).catch((err) => {
          console.warn('[SW] Shell precache notice:', err);
        });
      }),
      // Precache Core Radiography Study Materials
      caches.open(EDUCATIONAL_CACHE_NAME).then((cache) => {
        return cache.addAll(CORE_EDUCATIONAL_RESOURCES).catch((err) => {
          console.warn('[SW] Educational resources precache notice:', err);
        });
      })
    ]).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  const currentCaches = [CORE_CACHE_NAME, EDUCATIONAL_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((staleName) => {
            console.log('[SW] Removing outdated cache:', staleName);
            return caches.delete(staleName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if request is an educational asset (Cloudinary, Supabase, PDF, Images, or Offline Pack)
function isEducationalResource(url) {
  const href = url.href.toLowerCase();
  const path = url.pathname.toLowerCase();

  // Explicit educational offline pack
  if (path.includes('educational-offline-pack') || path.includes('/data/mockdata')) {
    return true;
  }

  // Cloudinary educational uploads (PDFs, clinical scans, diagrams)
  if (url.hostname.includes('cloudinary.com') && (href.includes('/image/upload/') || href.includes('/raw/upload/') || href.includes('/video/upload/'))) {
    return true;
  }

  // Supabase storage bucket educational assets
  if (url.hostname.includes('supabase.co') && href.includes('/storage/v1/object/public/')) {
    return true;
  }

  // Direct educational document extensions
  if (/\.(pdf|docx?|pptx?|xlsx?|jpg|jpeg|png|webp|svg)($|\?)/i.test(path)) {
    return true;
  }

  return false;
}

// 3. Fetch Event: Custom caching strategies based on resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and unsupported schemes (chrome-extension, etc.)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. EDUCATIONAL RESOURCES (Cloudinary, Supabase, PDFs, Radiographic Guides)
  // Strategy: Cache-First with Background Stale-While-Revalidate Sync
  if (isEducationalResource(url)) {
    event.respondWith(
      caches.open(EDUCATIONAL_CACHE_NAME).then((eduCache) => {
        return eduCache.match(request).then((cachedResponse) => {
          // If available in cache, serve immediately and revalidate in background if online
          if (cachedResponse) {
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                eduCache.put(request, networkResponse.clone());
              }
            }).catch(() => {
              // Expected when student is offline on rounds
            });
            return cachedResponse;
          }

          // If not in cache, fetch from network and store in educational cache
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              eduCache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // If completely offline and request failed, try to serve core offline study pack
            if (request.headers.get('accept')?.includes('application/json')) {
              return caches.match('/educational-offline-pack.json');
            }
            // Return nothing or cached thumbnail
            return caches.match('/artifacts.jpeg');
          });
        });
      })
    );
    return;
  }

  // B. FIRESTORE & LIVE APIS (Keep dynamic, fallback to cached offline data if disconnected)
  if (
    url.hostname.includes('firestore') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.pathname.startsWith('/api/')
  ) {
    // Network-First for real-time Firestore database queries
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback to offline educational pack if offline API call
          return caches.match('/educational-offline-pack.json');
        });
      })
    );
    return;
  }

  // C. YOUTUBE EMBED ASSETS
  if (url.hostname.includes('youtube.com') || url.hostname.includes('googlevideo.com') || url.hostname.includes('ytimg.com')) {
    // Cache YouTube thumbnails and shell where possible
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.status === 200 && url.hostname.includes('ytimg.com')) {
            const clone = res.clone();
            caches.open(EDUCATIONAL_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        }).catch(() => {
          // Fallback image if offline
          return caches.match('/Critiquing.jpeg');
        });
      })
    );
    return;
  }

  // D. APP SHELL & STATIC ASSETS (HTML, JS, CSS, fonts, icons)
  // Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CORE_CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CORE_CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      }).catch(() => {
        // SPA Fallback: If offline and navigating to a page, serve cached index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      });
    })
  );
});

// 4. Message Listener: Inter-process communication between React UI and Service Worker
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    // Save a specific educational resource (PDF, image, handout) for offline studying
    case 'CACHE_EDUCATIONAL_RESOURCE':
      if (data.url) {
        caches.open(EDUCATIONAL_CACHE_NAME).then((cache) => {
          fetch(data.url, { mode: 'cors' })
            .then((res) => {
              if (res && (res.status === 200 || res.type === 'opaque')) {
                return cache.put(data.url, res).then(() => {
                  if (event.ports && event.ports[0]) {
                    event.ports[0].postMessage({ success: true, url: data.url });
                  }
                });
              }
              throw new Error('Failed to fetch resource');
            })
            .catch((err) => {
              if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({ success: false, error: err.message });
              }
            });
        });
      }
      break;

    // Precache all core study pack resources
    case 'PRECACHE_OFFLINE_STUDY_PACK':
      caches.open(EDUCATIONAL_CACHE_NAME).then((cache) => {
        return Promise.all(
          CORE_EDUCATIONAL_RESOURCES.map((url) => {
            return fetch(url).then((res) => {
              if (res && res.status === 200) {
                return cache.put(url, res);
              }
            }).catch(() => {});
          })
        ).then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true, count: CORE_EDUCATIONAL_RESOURCES.length });
          }
        });
      });
      break;

    // Check count of cached educational resources
    case 'GET_OFFLINE_STUDY_STATS':
      caches.open(EDUCATIONAL_CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              count: keys.length,
              urls: keys.map((k) => k.url)
            });
          }
        });
      });
      break;

    default:
      break;
  }
});
