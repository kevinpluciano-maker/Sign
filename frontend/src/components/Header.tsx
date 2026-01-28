import { useState } from "react";
import { Search, ShoppingCart, User, Phone, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import acrylicBrailleLogo from "@/assets/acrylic-braille-logo.png";
import { useEditor } from "@/contexts/EditorContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import UnifiedMobileNavigation from "@/components/UnifiedMobileNavigation";
import ProductSearchBar from "@/components/ProductSearchBar";

interface HeaderProps {
  showFilters?: boolean;
}

const Header = ({ showFilters = false }: HeaderProps) => {
  const { totalItems } = useCart();
  const { headerData, updateHeaderData } = useEditor();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page or Di-Noc page
  const isHomePage = location.pathname === '/';
  const isDiNocPage = location.pathname === '/di-noc';

  const navigationItems = [
    {
      label: "Products",
      hasSubMenu: true,
      subItems: [
        { label: "Door Numbers Signs", path: "/collections/door-numbers" },
        { label: "Door Signs", path: "/collections/door-signs" },
        { label: "Restroom Signs", path: "/collections/restroom-signs" },
        { label: "Information Signs", path: "/collections/info-signs" },
        { label: "House Numbers", path: "/collections/house-numbers" },
        { label: "World Clock Signs", path: "/collections/world-clock" }
      ]
    },
    { label: "Catalog", path: "/products" },
    {
      label: "Designs",
      hasSubMenu: true,
      subItems: [
        { label: "Custom Designs", path: "/collections/custom" },
        { label: "Templates", path: "/collections/templates" }
      ]
    },
    { label: "Best sellers", path: "/collections/best-sellers" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Installation Guide", path: "/installation-guide" }
  ];

  // Dynamic styling based on page - Enhanced visibility over video
  const headerClasses = (isHomePage || isDiNocPage)
    ? "bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-50 text-white border-b border-white/10"
    : "bg-background border-b sticky top-0 z-50";

  const topBarClasses = (isHomePage || isDiNocPage)
    ? "bg-black/40 backdrop-blur-sm py-2 hidden md:block border-b border-white/10"
    : "bg-muted/50 py-2 hidden md:block";

  const textClasses = (isHomePage || isDiNocPage) ? "text-white font-medium drop-shadow-sm" : "text-foreground";
  const mutedTextClasses = (isHomePage || isDiNocPage) ? "text-white/90 drop-shadow-sm" : "text-muted-foreground";

  return (
    <header className={headerClasses}>
      {/* Top Bar - Hidden on mobile */}
      <div className={topBarClasses}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center text-sm">
            <span className={mutedTextClasses}>
              {headerData.topBarText}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Mobile Menu Button - Uses UnifiedMobileNavigation with conditional filters */}
          <UnifiedMobileNavigation cartItems={totalItems} showFilters={showFilters} />

          {/* Logo Section - Centered and prominent on mobile, always visible */}
          <div className="flex-1 flex justify-center md:justify-start md:flex-none">
            <a href="/" className={`group px-4 py-2 rounded-lg transition-all ${isHomePage ? 'bg-white/95 shadow-lg hover:shadow-xl' : 'bg-muted/30 border border-gray-200'}`}>
              <img
                src={headerData.logo || acrylicBrailleLogo}
                alt="Acrylic Braille Signs"
                className={`h-10 md:h-12 lg:h-14 w-auto object-contain transition-transform group-hover:scale-105`}
                style={{ maxWidth: 'none', aspectRatio: 'auto' }}
              />
            </a>
          </div>

          {/* Desktop Contact Info & Search - Better organized */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 justify-center">
            {/* Product Search Bar */}
            <ProductSearchBar />
            
            <div className={`flex items-center space-x-3 text-sm px-4 py-2.5 rounded-lg ${isHomePage ? 'bg-white/95 shadow-md' : 'bg-muted/30'}`}>
              <div className={`p-1.5 rounded-full ${isHomePage ? 'bg-primary/10' : 'bg-primary/10'}`}>
                <Phone className={`h-3.5 w-3.5 ${isHomePage ? 'text-primary' : 'text-primary'}`} />
              </div>
              <span className={`font-semibold ${isHomePage ? 'text-gray-800' : textClasses}`}>
                {headerData.phone}
              </span>
            </div>
          </div>

          {/* Right Section - Better organized */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Currency Switcher - Desktop */}
            <div className="hidden md:block">
              <CurrencySwitcher isHomePage={isHomePage} />
            </div>
            
            {/* Desktop Hours - Better styling */}
            <div className={`hidden lg:block text-right px-3 py-2 rounded-lg ${isHomePage ? 'bg-white/10 backdrop-blur-sm' : 'bg-muted/20'}`}>
              <div className={`text-xs font-medium ${textClasses}`}>
                <span>{headerData.businessHours}</span>
              </div>
              <div className={`text-xs mt-0.5 ${mutedTextClasses}`}>
                <span>{headerData.quickLinks}</span>
              </div>
            </div>
            
            {/* Action Buttons - Better styling */}
            <div className="flex items-center space-x-2">
              {/* User Account */}
              {isAuthenticated ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${isHomePage ? 'hover:bg-white/20 text-white' : 'hover:bg-primary/10'}`}
                  onClick={() => navigate('/account')}
                >
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline text-sm">{user?.name || 'Account'}</span>
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`${isHomePage ? 'hover:bg-white/20 text-white' : 'hover:bg-primary/10'}`}
                  onClick={() => navigate('/login')}
                >
                  <LogIn className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline text-sm">Sign In</span>
                </Button>
              )}

              {/* Cart - Enhanced mobile visibility */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={`relative p-2 md:px-3 ${isHomePage ? 'hover:bg-white/20 text-white bg-white/10 md:bg-transparent shadow-lg md:shadow-none backdrop-blur-sm border border-white/20 md:border-0' : 'hover:bg-primary/10'}`}
                onClick={() => navigate('/cart')}
                style={isHomePage ? {
                  minWidth: '44px',
                  minHeight: '44px'
                } : {}}
              >
                <ShoppingCart className="h-5 w-5 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline text-sm">Cart</span>
                {totalItems > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold z-50 bg-red-500 text-white border-2 border-white shadow-md">
                    {totalItems}
                  </Badge>
                )}
                {/* Debug: Show total items even if 0 for testing */}
                <span className="sr-only">Cart items: {totalItems}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;