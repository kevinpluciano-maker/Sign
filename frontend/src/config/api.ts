// Centralized API configuration
// This ensures consistent backend URL across all components

// The backend URL priority:
// 1. VITE_BACKEND_URL (Vite environment variable)
// 2. REACT_APP_BACKEND_URL (React environment variable)
// 3. Hardcoded Emergent backend URL (fallback)

const EMERGENT_BACKEND_URL = 'https://codebrowser-1.preview.emergentagent.com';

export const getBackendUrl = (): string => {
  // Check Vite env vars
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
    if (import.meta.env.REACT_APP_BACKEND_URL) {
      return import.meta.env.REACT_APP_BACKEND_URL;
    }
  }
  
  // Fallback to hardcoded Emergent URL
  return EMERGENT_BACKEND_URL;
};

// Export the backend URL for direct use
export const BACKEND_URL = getBackendUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Payment endpoints
  createCheckoutSession: `${BACKEND_URL}/api/payments/create-checkout-session`,
  checkoutStatus: (sessionId: string) => `${BACKEND_URL}/api/payments/checkout-status/${sessionId}`,
  orderDetails: (sessionId: string) => `${BACKEND_URL}/api/payments/order/${sessionId}`,
  
  // Contact endpoints
  contact: `${BACKEND_URL}/api/contact`,
  newsletter: `${BACKEND_URL}/api/newsletter/subscribe`,
  
  // Reviews endpoints
  reviews: (productId: string) => `${BACKEND_URL}/api/reviews/${productId}`,
  submitReview: `${BACKEND_URL}/api/reviews`,
  
  // Content endpoints
  content: (sectionId: string) => `${BACKEND_URL}/api/content/${sectionId}`,
};

export default BACKEND_URL;
