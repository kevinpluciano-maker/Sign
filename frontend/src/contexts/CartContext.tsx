import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product } from '@/data/productsData';
import { calculateDiscountedPrice, getPricingInfo } from '@/utils/pricingEngine';

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedBraille?: string;
  selectedShape?: string;
  customizations?: Record<string, any>;
  addedAt: string;
  itemPrice: number; // Calculated price based on selections
  originalPrice?: number; // Original price before discount
  discountPercent?: number; // Applied discount percentage
  isPremium?: boolean; // True if braille selected (no discount)
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
  addToCart: (product: Product, options?: {
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
    selectedBraille?: string;
    selectedShape?: string;
    customizations?: Record<string, any>;
  }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Tax rate (13%)
const TAX_RATE = 0.13;

// Shipping calculation - Free shipping over $75 USD (approximately $100 CAD)
const FREE_SHIPPING_THRESHOLD = 75; // $75 USD
const SHIPPING_FEE = 15; // $15 flat rate

const calculateShipping = (subtotal: number, itemCount: number): number => {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0; // Free shipping over $75 USD
  return SHIPPING_FEE; // $15 flat shipping fee
};

// Extract numeric price from string like "from $58.00" or "$45.99"
const extractPrice = (priceString: string | number): number => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString || typeof priceString !== 'string') return 0;
  const numStr = priceString.replace(/[^0-9.]/g, '');
  return parseFloat(numStr) || 0;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from localStorage on initialization
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  // Calculate totals
  const { totalItems, subtotal, tax, shipping, totalPrice } = React.useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const shipping = calculateShipping(subtotal, totalItems);
    const totalPrice = subtotal + tax + shipping;

    return { totalItems, subtotal, tax, shipping, totalPrice };
  }, [items]);

  const addToCart = useCallback((product: Product, options = {}) => {
    const {
      quantity = 1,
      selectedSize,
      selectedColor,
      selectedBraille,
      selectedShape,
      customizations
    } = options;

    // Calculate item price based on size selection
    let itemPrice = extractPrice(product.price);
    if (selectedSize && product.sizeOptions) {
      const sizeOption = product.sizeOptions.find(opt => 
        opt.size === selectedSize || `size-${product.sizeOptions?.indexOf(opt)}` === selectedSize
      );
      if (sizeOption) {
        itemPrice = extractPrice(sizeOption.price);
      }
    }
    
    // Add $10 CAD surcharge for Braille option
    if (selectedBraille && selectedBraille.toLowerCase() === 'yes') {
      itemPrice += 10;
    }

    const cartItem: CartItem = {
      ...product,
      quantity,
      selectedSize,
      selectedColor,
      selectedBraille,
      selectedShape,
      customizations,
      addedAt: new Date().toISOString(),
      itemPrice
    };

    setItems(prevItems => {
      // Check if item with same options already exists
      const existingIndex = prevItems.findIndex(item => 
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor &&
        item.selectedBraille === selectedBraille &&
        item.selectedShape === selectedShape
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, cartItem];
      }
    });

    // Show success notification
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.textContent = `✅ ${product.name} added to cart!`;
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const getCartItem = useCallback((productId: string) => {
    return items.find(item => item.id === productId);
  }, [items]);

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    subtotal,
    tax,
    shipping,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};