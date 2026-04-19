import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EditorProvider } from "@/contexts/EditorContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MobilePerformanceOptimizer } from "@/components/MobilePerformanceOptimizer";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { PerformanceOptimizations, inlineCriticalCSS, monitorPerformance } from "@/components/PerformanceOptimizations";
import { ResponsiveOptimizations, addResponsiveCSS } from "@/components/ResponsiveOptimizations";
import { useScrollToTop } from "@/components/ScrollToTopLink";
import EnhancedPerformance from "@/components/EnhancedPerformance";
import { initGA, usePageTracking } from "@/utils/analytics";
import MobileFloatingCTA from "@/components/MobileFloatingCTA";
import LiveChat from "@/components/LiveChat";

// Eagerly loaded: landing page + 404 (keeps LCP fast on cold visit)
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy-loaded route components — each becomes its own chunk, fetched on demand.
// This is the biggest perf win: checkout, admin, di-noc (three.js), rich editors,
// etc. are no longer part of the initial bundle.
const Collections = lazy(() => import("./pages/Collections"));
const AllProductsSimple = lazy(() => import("./pages/AllProductsSimple"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const FAQ = lazy(() => import("./pages/FAQ"));
const InstallationGuide = lazy(() => import("./pages/InstallationGuide"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const RefundReturns = lazy(() => import("./pages/RefundReturns"));
const Cart = lazy(() => import("./pages/Cart"));
const ImprovedCheckout = lazy(() => import("./pages/ImprovedCheckout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const ModernContact = lazy(() => import("./pages/ModernContact"));
const ModernAbout = lazy(() => import("./pages/ModernAbout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const DiNocPage = lazy(() => import("./pages/DiNocPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  inlineCriticalCSS();
  addResponsiveCSS();
  monitorPerformance();
  initGA(); // Initialize Google Analytics
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reasonable defaults so we don't refetch everything on every mount
      staleTime: 60_000, // 1 min
      gcTime: 5 * 60_000, // 5 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Component to handle scroll to top on route changes
const ScrollToTopHandler = () => {
  useScrollToTop();
  return null;
};

// Component to handle analytics page tracking
const AnalyticsTracker = () => {
  usePageTracking();
  return null;
};

// Minimal route-level fallback — intentionally tiny so it doesn't flash heavy UI.
// Styled to blend with the white/neutral base so it's visually quiet.
const RouteFallback = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    aria-busy="true"
    aria-live="polite"
  >
    <div
      style={{
        width: 28,
        height: 28,
        border: '2px solid #e5e7eb',
        borderTopColor: '#4FC3F7',
        borderRadius: '50%',
        animation: 'abs-spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes abs-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <EditorProvider>
              <MobilePerformanceOptimizer />
              <PerformanceOptimizations />
              <ResponsiveOptimizations />
              <EnhancedPerformance />
              {/* PreloadManager removed from global - each page preloads its own resources */}
              <PerformanceMonitor />
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <ScrollToTopHandler />
                <AnalyticsTracker />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<AllProductsSimple />} />
                    <Route path="/collections/new" element={<Collections />} />
                    <Route path="/collections/best-sellers" element={<Collections />} />
                    <Route path="/collections/di-noc" element={<DiNocPage />} />
                    <Route path="/di-noc" element={<DiNocPage />} />
                    <Route path="/collections/:category" element={<Collections />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<ModernAbout />} />
                    <Route path="/contact" element={<ModernContact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/installation-guide" element={<InstallationGuide />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/refund-returns" element={<RefundReturns />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<ImprovedCheckout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>

                {/* Global Components */}
                <MobileFloatingCTA />
                <LiveChat />
              </BrowserRouter>
            </EditorProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
