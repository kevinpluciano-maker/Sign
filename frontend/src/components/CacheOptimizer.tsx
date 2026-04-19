import { useEffect } from 'react';

/**
 * Cache optimization component for static assets and API responses
 * Sets up service worker and cache strategies for better performance
 */
export const CacheOptimizer = () => {
  useEffect(() => {
    // Register service worker for caching strategies
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Preload critical resources in browser cache
    const preloadCriticalResources = () => {
      const criticalAssets = [
        '/assets/hero-office.jpg',
        '/assets/signassist-logo.png'
      ];

      criticalAssets.forEach(asset => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = asset;
        document.head.appendChild(link);
      });
    };

    // Cache static assets in memory
    const cacheStaticAssets = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('static-assets-v1');
          const assetsToCache = [
            '/assets/hero-office.jpg',
            '/assets/signassist-logo.png',
            '/assets/acrylic-braille-logo.png'
          ];
          // Individual cache.add() so one missing asset doesn't abort the whole batch.
          // (cache.addAll is atomic — any single failure rejects the Promise.)
          await Promise.allSettled(
            assetsToCache.map(url => cache.add(url).catch(() => {}))
          );
        } catch {
          /* Silent — asset caching is a progressive enhancement, not critical */
        }
      }
    };

    // Font optimization removed - fonts are loaded via Google Fonts CSS
    // Preloading individual font files causes 404 errors and is unnecessary
    const optimizeFonts = () => {
      // Fonts are handled by the preconnect in index.html
      // No manual preloading needed
    };

    // Resource hints for third-party domains
    const addResourceHints = () => {
      const domains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ];

      domains.forEach(domain => {
        // Add dns-prefetch
        if (!document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)) {
          const dnsLink = document.createElement('link');
          dnsLink.rel = 'dns-prefetch';
          dnsLink.href = domain;
          document.head.appendChild(dnsLink);
        }

        // Add preconnect for critical domains
        if (domain.includes('fonts.gstatic.com')) {
          if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
            const preconnectLink = document.createElement('link');
            preconnectLink.rel = 'preconnect';
            preconnectLink.href = domain;
            preconnectLink.crossOrigin = 'anonymous';
            document.head.appendChild(preconnectLink);
          }
        }
      });
    };

    // Initialize optimizations
    preloadCriticalResources();
    cacheStaticAssets();
    optimizeFonts();
    addResourceHints();

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
};