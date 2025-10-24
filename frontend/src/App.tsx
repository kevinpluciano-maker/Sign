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
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import AllProducts from "./pages/AllProducts";
import AllProductsDebug from "./pages/AllProductsDebug";
import AllProductsSimple from "./pages/AllProductsSimple";
import AllProductsFixed from "./pages/AllProductsFixed";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import InstallationGuide from "./pages/InstallationGuide";
import Privacy from "./pages/Privacy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ImprovedCheckout from "./pages/ImprovedCheckout";
import OrderConfirmation from "./pages/OrderConfirmation";
import ModernContact from "./pages/ModernContact";
import ModernAbout from "./pages/ModernAbout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import DiNocPage from "./pages/DiNocPage";
import AdminPanel from "./pages/AdminPanel";
import RefundReturns from "./pages/RefundReturns";

// Initialize performance optimizations
if (typeof window !== 'undefined') {
  inlineCriticalCSS();
  addResponsiveCSS();
  monitorPerformance();
  initGA(); // Initialize Google Analytics
}

const queryClient = new QueryClient();

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
              v7_relativeSplatPath: true
            }}
          >
            <ScrollToTopHandler />
            <AnalyticsTracker />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<AllProductsSimple />} />
              <Route path="/products-debug" element={<AllProductsDebug />} />
              <Route path="/products-original" element={<AllProducts />} />
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
