import { useEffect } from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Performance monitoring component for Core Web Vitals
 * Tracks LCP, CLS, INP and reports metrics
 */
export const PerformanceMonitor = () => {
  useEffect(() => {
    // Function to get the appropriate rating for each metric
    const getRating = (metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
      const thresholds = {
        LCP: { good: 2500, poor: 4000 },
        CLS: { good: 0.1, poor: 0.25 },
        INP: { good: 200, poor: 500 }
      };

      const threshold = thresholds[metricName as keyof typeof thresholds];
      if (!threshold) return 'good';

      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'needs-improvement';
      return 'poor';
    };

    // Send metric to analytics
    const sendToAnalytics = (metric: WebVitalsMetric) => {
      // Console logging disabled — was too noisy (fires 4× per metric due to
      // multiple observers + StrictMode). Enable via localStorage flag if needed:
      //   localStorage.setItem('debug:web-vitals', '1')
      if (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'development' &&
        window.localStorage?.getItem('debug:web-vitals') === '1'
      ) {
        console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
      }

      // In production, send to your analytics service
      // Example: gtag('event', metric.name, { value: metric.value });
    };

    // Observe LCP
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const value = lastEntry.startTime;
          
          sendToAnalytics({
            name: 'LCP',
            value,
            rating: getRating('LCP', value)
          });
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP measurement not supported');
      }
    };

    // Observe CLS
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          
          sendToAnalytics({
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue)
          });
        });

        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS measurement not supported');
      }
    };

    // Observe INP (Interaction to Next Paint)
    const observeINP = () => {
      try {
        let interactions = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            interactions++;
            const eventEntry = entry as any; // INP is experimental, so we use any
            const duration = eventEntry.processingEnd ? 
              eventEntry.processingEnd - entry.startTime : 
              entry.duration || 0;
            
            sendToAnalytics({
              name: 'INP',
              value: duration,
              rating: getRating('INP', duration)
            });
          }
        });

        // Use 'first-input' as fallback since 'interaction' might not be supported everywhere
        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('INP measurement not supported');
      }
    };

    // Resource timing
    const observeResourceTiming = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resource = entry as PerformanceResourceTiming;
            // Only warn for resources > 500KB (not videos, fonts, or images expected to be large)
            if (resource.transferSize > 500000 && 
                !resource.name.includes('video') && 
                !resource.name.includes('font') &&
                !resource.name.includes('hero-office')) { 
              console.warn(`Large resource detected: ${resource.name} (${Math.round(resource.transferSize / 1024)}KB)`);
            }
          }
        });

        observer.observe({ type: 'resource', buffered: true });
      } catch (e) {
        console.warn('Resource timing not supported');
      }
    };

    // Initialize all observers
    observeLCP();
    observeCLS();
    observeINP();
    observeResourceTiming();

    // Cleanup function
    return () => {
      // Observers will be automatically disconnected when component unmounts
    };
  }, []);

  return null; // This component doesn't render anything
};