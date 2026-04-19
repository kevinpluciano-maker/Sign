import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics ID - Replace with your actual GA4 measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Initialize Google Analytics — no-op unless a real measurement ID is configured.
// Prevents ERR_NAME_NOT_RESOLVED / script-src CSP noise when GA isn't set up.
export const initGA = () => {
  if (typeof window === 'undefined') return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

  // Add GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // We'll send page views manually
  });
};

// Track page view
export const trackPageView = (path: string) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// E-commerce tracking
export const trackAddToCart = (item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', 'add_to_cart', {
    currency: 'USD',
    value: item.price * item.quantity,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    }]
  });
};

export const trackPurchase = (transaction: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  if (typeof window.gtag === 'undefined') return;
  
  window.gtag('event', 'purchase', {
    transaction_id: transaction.transaction_id,
    value: transaction.value,
    currency: transaction.currency,
    items: transaction.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))
  });
};

export const trackQuoteRequest = (productName: string) => {
  trackEvent('quote_request', 'engagement', productName);
};

export const trackContactForm = () => {
  trackEvent('contact_form_submit', 'engagement', 'contact_page');
};

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackAddToCart,
  trackPurchase,
  trackQuoteRequest,
  trackContactForm,
  usePageTracking
};
