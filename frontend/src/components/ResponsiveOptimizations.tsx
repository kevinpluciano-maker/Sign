import { useEffect } from 'react';

export const ResponsiveOptimizations = () => {
  useEffect(() => {
    // Viewport height fix for mobile browsers
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Touch optimizations for mobile
    const optimizeTouch = () => {
      // Add touch-action CSS for better scrolling
      document.body.style.touchAction = 'pan-y';
      
      // Disable zoom on input focus for iOS
      const inputs = document.querySelectorAll('input[type="search"], input[type="text"], input[type="email"], textarea');
      inputs.forEach((input) => {
        input.addEventListener('focus', () => {
          if (window.innerWidth < 768) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
              viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            }
          }
        });
        
        input.addEventListener('blur', () => {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=yes');
          }
        });
      });
    };

    // Responsive image optimizations
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        // Add responsive sizing if not present
        if (!img.sizes && img.srcset) {
          img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
        }
        
        // Add loading="lazy" for non-critical images
        if (!img.loading && !img.classList.contains('critical')) {
          img.loading = 'lazy';
        }
        
        // Add proper alt text if missing
        if (!img.alt && img.src) {
          const filename = img.src.split('/').pop()?.split('.')[0] || '';
          img.alt = filename.replace(/[-_]/g, ' ');
        }
      });
    };

    // Performance optimizations for mobile
    const mobilePerformanceOptimizations = () => {
      if (window.innerWidth < 768) {
        // Reduce animations on mobile for better performance
        const style = document.createElement('style');
        style.textContent = `
          @media (max-width: 767px) {
            *, *::before, *::after {
              animation-duration: 0.5s !important;
              animation-delay: 0s !important;
              transition-duration: 0.3s !important;
            }
            
            .animate-pulse {
              animation-duration: 1s !important;
            }
          }
        `;
        document.head.appendChild(style);
        
        // Disable hover effects on mobile
        document.body.classList.add('mobile-device');
      }
    };

    // Accessibility optimizations
    const accessibilityOptimizations = () => {
      // Add focus-visible support for better keyboard navigation
      const style = document.createElement('style');
      style.textContent = `
        .js-focus-visible :focus:not(.focus-visible) {
          outline: none;
        }
        
        .focus-visible {
          outline: 2px solid #007cf0;
          outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .card, .button {
            border: 2px solid;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    // Execute optimizations
    setVH();
    optimizeTouch();
    optimizeImages();
    mobilePerformanceOptimizations();
    accessibilityOptimizations();

    // Update VH on resize and orientation change
    const handleResize = () => {
      setVH();
      optimizeImages();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return null;
};

// CSS Variables for responsive design
export const addResponsiveCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --vh: 1vh;
      --container-padding: clamp(16px, 5vw, 32px);
      --text-xs: clamp(0.75rem, 2vw, 0.875rem);
      --text-sm: clamp(0.875rem, 2.5vw, 1rem);
      --text-base: clamp(1rem, 3vw, 1.125rem);
      --text-lg: clamp(1.125rem, 3.5vw, 1.25rem);
      --text-xl: clamp(1.25rem, 4vw, 1.5rem);
      --text-2xl: clamp(1.5rem, 5vw, 2rem);
      --text-3xl: clamp(1.875rem, 6vw, 2.5rem);
      --text-4xl: clamp(2.25rem, 7vw, 3rem);
    }
    
    /* Responsive utilities */
    .responsive-padding {
      padding: var(--container-padding);
    }
    
    .responsive-text {
      font-size: var(--text-base);
    }
    
    /* Touch-friendly button sizes */
    @media (max-width: 767px) {
      button, .button {
        min-height: 44px;
        min-width: 44px;
        padding: 12px 16px;
      }
    }
    
    /* Prevent horizontal scrolling - only on body to avoid scroll issues */
    body {
      overflow-x: hidden;
      overflow-y: auto;
    }
    
    html {
      overflow-x: hidden;
      overflow-y: scroll;
    }
    
    /* Mobile-first responsive containers */
    .container {
      width: 100%;
      margin: 0 auto;
      padding: 0 var(--container-padding);
    }
    
    @media (min-width: 640px) {
      .container { max-width: 640px; }
    }
    
    @media (min-width: 768px) {
      .container { max-width: 768px; }
    }
    
    @media (min-width: 1024px) {
      .container { max-width: 1024px; }
    }
    
    @media (min-width: 1280px) {
      .container { max-width: 1280px; }
    }
  `;
  document.head.appendChild(style);
};

export default ResponsiveOptimizations;