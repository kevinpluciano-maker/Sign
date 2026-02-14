// Centralized API configuration
// This ensures consistent backend URL across all components

// IMPORTANT: This is the Render backend that runs 24/7
// Your checkout will ALWAYS work regardless of Emergent agent status
const BACKEND_URL = 'https://bsign-backend.onrender.com';

// API endpoints - all using the Render backend URL for 24/7 reliability
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

export { BACKEND_URL };
export default BACKEND_URL;
