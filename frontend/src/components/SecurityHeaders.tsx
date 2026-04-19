import { useEffect } from 'react';

/**
 * Security headers and CSP configuration component
 * Implements security best practices for production apps
 */
export const SecurityHeaders = () => {
  useEffect(() => {
    // Add meta tags for security
    const addSecurityMeta = () => {
      const metas = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
      ];

      metas.forEach(({ name, content }) => {
        if (!document.querySelector(`meta[name="${name}"]`)) {
          const meta = document.createElement('meta');
          meta.setAttribute('name', name);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      });
    };

    // Content Security Policy (would be better set on server)
    const addCSP = () => {
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const csp = document.createElement('meta');
        csp.setAttribute('http-equiv', 'Content-Security-Policy');
        csp.setAttribute('content', 
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: blob: https:; " +
          "media-src 'self' blob: data: https:; " +
          "connect-src 'self' https:; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        );
        document.head.appendChild(csp);
      }
    };

    // Security headers would ideally be set on the server
    // This is a client-side fallback for development
    if (process.env.NODE_ENV === 'development') {
      addSecurityMeta();
      addCSP();
    }

    // Mixed content detection
    const checkMixedContent = () => {
      if (location.protocol === 'https:') {
        const insecureElements = document.querySelectorAll(
          'img[src^="http:"], script[src^="http:"], link[href^="http:"], iframe[src^="http:"]'
        );
        
        if (insecureElements.length > 0) {
          console.warn('Mixed content detected:', insecureElements);
        }
      }
    };

    checkMixedContent();

    // Monitor for new mixed content
    const observer = new MutationObserver(() => {
      checkMixedContent();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};