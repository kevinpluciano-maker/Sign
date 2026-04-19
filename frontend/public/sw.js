// Enhanced Service Worker for PWA with advanced caching strategies
const CACHE_NAME = 'bsign-store-v1.2';
const STATIC_CACHE = 'static-assets-v1.2';
const DYNAMIC_CACHE = 'dynamic-content-v1.2';
const IMAGE_CACHE = 'images-v1.2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/signassist-logo.png',
  '/assets/acrylic-braille-logo.png',
  '/manifest.json'
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first', 
  static: 'cache-first',
  pages: 'stale-while-revalidate'
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets — each added individually so a missing file
      // doesn't cause the whole install to fail.
      caches.open(STATIC_CACHE).then(cache =>
        Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => {})))
      ),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !cacheName.includes('v1.2'))
            .map(cacheName => caches.delete(cacheName))
        );
      }),
      
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Image caching strategy - Cache First with WebP optimization
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Clone before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version or placeholder
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a placeholder image for failed requests
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// API caching strategy - Network First
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }), 
      { 
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Page caching strategy - Stale While Revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Get cached version immediately
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update in background
    networkResponsePromise;
    return cachedResponse;
  }
  
  // Wait for network if no cache available
  const networkResponse = await networkResponsePromise;
  
  if (networkResponse) {
    return networkResponse;
  }
  
  // Return offline page as fallback
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Bsign Store</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 2rem; }
        .offline { max-width: 400px; margin: 0 auto; }
        h1 { color: #007cf0; }
      </style>
    </head>
    <body>
      <div class="offline">
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Static asset caching strategy - Cache First
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Resource not available offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any queued actions when back online
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  // Implement background sync logic here
  // For example: retry failed form submissions
  console.log('Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New update available',
      icon: '/assets/signassist-logo.png',
      badge: '/assets/bsign-logo.png',
      tag: data.tag || 'general',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Bsign Store', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle specific notification actions
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clients => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-product':
      clients.openWindow(`/products/${data.productId}`);
      break;
    case 'view-cart':
      clients.openWindow('/cart');
      break;
    default:
      clients.openWindow('/');
  }
}