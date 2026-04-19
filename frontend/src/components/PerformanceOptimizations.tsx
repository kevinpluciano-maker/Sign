import { useEffect } from 'react';

export const PerformanceOptimizations = () => {
  useEffect(() => {
    // Preload critical fonts
    const preloadFont = (fontUrl: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.href = fontUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // Defer non-critical CSS
    const deferCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    };

    // Optimize third-party scripts
    const optimizeThirdPartyScripts = () => {
      // Add loading="lazy" to existing images without it
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          img.loading = 'lazy';
        }
      });

      // Prefetch important pages
      const prefetchPages = ['/products', '/cart', '/contact'];
      prefetchPages.forEach((page) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      });
    };

    // Service Worker registration for caching
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);
        } catch (registrationError) {
          console.log('SW registration failed: ', registrationError);
        }
      }
    };

    // Critical Resource Hints
    const addResourceHints = () => {
      // DNS prefetch for external domains
      const dnsPrefetchDomains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
      dnsPrefetchDomains.forEach((domain) => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
      });

      // Preconnect to critical origins
      const preconnectDomains = ['fonts.googleapis.com'];
      preconnectDomains.forEach((domain) => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = `https://${domain}`;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    // Image optimization for existing images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          // Add decoding="async" for better performance
          img.decoding = 'async';
          
          // Add proper aspect ratio to prevent layout shift
          if (!img.style.aspectRatio && img.width && img.height) {
            img.style.aspectRatio = `${img.width} / ${img.height}`;
          }
        }
      });
    };

    // Execute optimizations
    addResourceHints();
    optimizeThirdPartyScripts();
    optimizeImages();
    registerServiceWorker();

    // Set up intersection observer for lazy loading enhancement
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, observerOptions);

    // Observe images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => imageObserver.observe(img));

    // Cleanup
    return () => {
      imageObserver.disconnect();
    };
  }, []);

  return null;
};

// Critical CSS inlining utility
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    /* Critical above-the-fold styles */
    .bg-background { background-color: hsl(var(--background)); }
    .text-foreground { color: hsl(var(--foreground)); }
    .container { width: 100%; margin: 0 auto; padding: 0 1rem; }
    @media (min-width: 640px) { .container { max-width: 640px; } }
    @media (min-width: 768px) { .container { max-width: 768px; } }
    @media (min-width: 1024px) { .container { max-width: 1024px; } }
    @media (min-width: 1280px) { .container { max-width: 1280px; } }
    
    /* Prevent layout shift */
    img { height: auto; max-width: 100%; }
    .aspect-square { aspect-ratio: 1 / 1; }
    
    /* Loading states */
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
};

// Performance monitoring
export const monitorPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Silent unless opt-in: localStorage.setItem('debug:web-vitals','1')
    const shouldLog = () =>
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('debug:web-vitals') === '1';

    // Core Web Vitals monitoring
    const observeWebVitals = () => {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (shouldLog()) console.log('LCP:', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (shouldLog()) console.log('FID:', (entry as any).processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      new PerformanceObserver((entryList) => {
        let clsValue = 0;
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        if (shouldLog()) console.log('CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Run after page load
    if (document.readyState === 'complete') {
      observeWebVitals();
    } else {
      window.addEventListener('load', observeWebVitals);
    }
  }
};

export default PerformanceOptimizations;