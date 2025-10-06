/**
 * Cache.js - Asset caching and service worker management
 */

const DB_NAME = 'xr_industrial_club';
const DB_VERSION = 1;
const STORE_NAME = 'xr_asset_meta';

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save asset metadata to IndexedDB
 */
async function saveAssetMeta(url, meta) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const data = {
      url,
      ...meta,
      timestamp: Date.now(),
    };
    
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get asset metadata from IndexedDB
 */
async function getAssetMeta(url) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(url);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all asset metadata
 */
export async function getAllAssetMeta() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all asset metadata
 */
async function clearAssetMeta() {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Read assets.json configuration
 */
export async function readAssetsJson(path = '/assets.json') {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to read assets.json:', error);
    throw error;
  }
}

/**
 * Prefetch assets with progress tracking
 * @param {Array<{url: string, name: string}>} assetList - List of assets to download
 * @param {Object} callbacks - Progress callbacks
 * @param {Function} callbacks.onProgress - Called with (completed, total, currentFile)
 * @param {Function} callbacks.onFileStart - Called with (url, name)
 * @param {Function} callbacks.onFileComplete - Called with (url, name, size)
 * @param {Function} callbacks.onFileError - Called with (url, name, error)
 */
export async function prefetchAssets(assetList, callbacks = {}) {
  const {
    onProgress = () => {},
    onFileStart = () => {},
    onFileComplete = () => {},
    onFileError = () => {},
  } = callbacks;

  const total = assetList.length;
  let completed = 0;

  const results = [];

  for (const asset of assetList) {
    const { url, name } = asset;
    
    try {
      onFileStart(url, name);
      
      // Check if already cached
      const meta = await getAssetMeta(url);
      if (meta) {
        console.log(`Asset already cached: ${name}`);
        completed++;
        onProgress(completed, total, name);
        onFileComplete(url, name, meta.size);
        results.push({ url, name, cached: true, size: meta.size });
        continue;
      }
      
      // Fetch with progress tracking
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      
      // Clone response for caching
      const cache = await caches.open('xr-cache-v1');
      await cache.put(url, response.clone());
      
      // Read the body to ensure it's fully downloaded
      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress
        if (contentLength > 0) {
          const fileProgress = receivedLength / contentLength;
          onProgress(completed + fileProgress, total, name);
        }
      }
      
      // Save metadata
      await saveAssetMeta(url, {
        size: receivedLength,
        contentType: response.headers.get('content-type'),
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
      });
      
      completed++;
      onProgress(completed, total, name);
      onFileComplete(url, name, receivedLength);
      
      results.push({ url, name, cached: false, size: receivedLength });
      
    } catch (error) {
      console.error(`Failed to fetch asset: ${name}`, error);
      onFileError(url, name, error);
      
      completed++;
      onProgress(completed, total, name);
      
      results.push({ url, name, error: error.message });
    }
  }

  return results;
}

/**
 * Clear all caches (Service Worker cache + IndexedDB)
 */
export async function clearAllCaches() {
  try {
    // Clear Service Worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      const promise = new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
      
      await promise;
    }
    
    // Clear Cache Storage directly
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith('xr-cache-')) {
          return caches.delete(cacheName);
        }
      })
    );
    
    // Clear IndexedDB
    await clearAssetMeta();
    
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheInfo() {
  try {
    const meta = await getAllAssetMeta();
    const totalSize = meta.reduce((sum, item) => sum + (item.size || 0), 0);
    
    // Get latest update time
    const latestUpdate = meta.length > 0 
      ? Math.max(...meta.map(item => item.timestamp))
      : null;
    
    return {
      version: 'xr-cache-v1',
      files: meta.length,
      totalSize,
      latestUpdate,
      assets: meta,
    };
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return null;
  }
}
