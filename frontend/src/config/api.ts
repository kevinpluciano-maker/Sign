// API configuration — single source of truth for all backend calls.
// Production: Render (24/7). Dev: local supervisor.

// Priority: explicit VITE_BACKEND_URL env var > hardcoded Render production URL.
const RENDER_URL = 'https://bsign-backend.onrender.com';
const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || '';

export const BACKEND_URL = envUrl.trim() || RENDER_URL;

export const API_ENDPOINTS = {
  // Auth
  login: `${BACKEND_URL}/api/auth/login`,
  me: `${BACKEND_URL}/api/auth/me`,

  // Public content
  products: `${BACKEND_URL}/api/products`,
  productById: (id: string) => `${BACKEND_URL}/api/products/${id}`,
  content: (sectionId: string) => `${BACKEND_URL}/api/content/${sectionId}`,
  allContent: `${BACKEND_URL}/api/content`,
  reviews: (productId: string) => `${BACKEND_URL}/api/reviews/${productId}`,
  submitReview: `${BACKEND_URL}/api/reviews`,

  // Forms
  contact: `${BACKEND_URL}/api/contact`,
  newsletter: `${BACKEND_URL}/api/newsletter/subscribe`,

  // Payments
  createCheckoutSession: `${BACKEND_URL}/api/payments/create-checkout-session`,
  checkoutStatus: (sessionId: string) => `${BACKEND_URL}/api/payments/checkout-status/${sessionId}`,
  orderDetails: (sessionId: string) => `${BACKEND_URL}/api/payments/order/${sessionId}`,

  // Admin (require JWT)
  admin: {
    stats: `${BACKEND_URL}/api/admin/stats`,
    reviews: `${BACKEND_URL}/api/admin/reviews`,
    reviewById: (id: string) => `${BACKEND_URL}/api/admin/reviews/${id}`,
    content: `${BACKEND_URL}/api/admin/content`,
    contentById: (id: string) => `${BACKEND_URL}/api/admin/content/${id}`,
    products: `${BACKEND_URL}/api/admin/products`,
    productById: (id: string) => `${BACKEND_URL}/api/admin/products/${id}`,
    productClone: (id: string) => `${BACKEND_URL}/api/admin/products/${id}/clone`,
    productsBulkImport: `${BACKEND_URL}/api/admin/products/bulk-import`,
    orders: `${BACKEND_URL}/api/admin/orders`,
    media: `${BACKEND_URL}/api/admin/media`,
    mediaUpload: `${BACKEND_URL}/api/admin/media/upload`,
    mediaById: (id: string) => `${BACKEND_URL}/api/admin/media/${id}`,
    mediaReplace: (id: string) => `${BACKEND_URL}/api/admin/media/${id}/replace`,
    pricing: `${BACKEND_URL}/api/admin/pricing`,
  },
  // Public pricing (banners, promos, global %)
  pricing: `${BACKEND_URL}/api/pricing`,
};

export default BACKEND_URL;
