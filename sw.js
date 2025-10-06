/**
 * Service Worker for XR Industrial Club
 * Handles caching of assets for offline use
 */

const CACHE_VERSION = 'xr-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/client-demo/fallback-hall.glb',
  '/assets.json',
];

// Install event - precache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Failed to cache some app shell files:', err);
        // Don't fail installation if some files aren't available yet
      });
    })
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && cacheName.startsWith('xr-cache-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine caching strategy based on file type
  const ext = url.pathname.split('.').pop().toLowerCase();
  
  // Cache-first for 3D assets and images
  const cacheFirstExts = ['glb', 'gltf', 'bin', 'ktx2', 'jpg', 'jpeg', 'png', 'webp', 'hdr'];
  
  // Stale-while-revalidate for JSON
  const swrExts = ['json'];
  
  // Network-only for streaming media
  const networkOnlyExts = ['m3u8', 'ts', 'm4s'];
  
  if (cacheFirstExts.includes(ext)) {
    // Cache-first strategy for assets
    event.respondWith(cacheFirst(request));
  } else if (swrExts.includes(ext)) {
    // Stale-while-revalidate for JSON
    event.respondWith(staleWhileRevalidate(request));
  } else if (networkOnlyExts.includes(ext)) {
    // Network-only for streaming
    event.respondWith(fetch(request));
  } else {
    // Default: try cache, fallback to network
    event.respondWith(cacheFirst(request));
  }
});

/**
 * Cache-first strategy: check cache, fallback to network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Serving from cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      console.log('[SW] Caching new resource:', request.url);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', request.url, error);
    throw error;
  }
}

/**
 * Stale-while-revalidate: serve from cache, update in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  
  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached immediately if available
  if (cached) {
    console.log('[SW] Serving from cache (revalidating):', request.url);
    return cached;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      handleClearCache(event);
      break;
      
    case 'GET_CACHE_INFO':
      handleGetCacheInfo(event);
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Clear all caches
 */
async function handleClearCache(event) {
  try {
    const cacheNames = await caches.keys();
    
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith('xr-cache-')) {
          console.log('[SW] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
    
    event.ports[0].postMessage({ ok: true });
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
    event.ports[0].postMessage({ ok: false, error: error.message });
  }
}

/**
 * Get cache information
 */
async function handleGetCacheInfo(event) {
  try {
    const cache = await caches.open(CACHE_VERSION);
    const keys = await cache.keys();
    
    const files = await Promise.all(
      keys.map(async (request) => {
        const response = await cache.match(request);
        const blob = await response.blob();
        
        return {
          url: request.url,
          size: blob.size,
        };
      })
    );
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    event.ports[0].postMessage({
      ok: true,
      version: CACHE_VERSION,
      files,
      totalSize,
    });
  } catch (error) {
    console.error('[SW] Failed to get cache info:', error);
    event.ports[0].postMessage({ ok: false, error: error.message });
  }
}
