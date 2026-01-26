/**
 * Emergency Pricing Engine
 * 
 * Implements size-based discounts with braille premium pricing:
 * - Larger sizes get larger discounts
 * - Braille add-on reverts price to original (premium feature)
 */

export interface SizeDiscount {
  sizePattern: RegExp;
  discountPercent: number;
  sizeName: string;
}

// Size-based discount tiers (larger sizes = larger discounts)
// AGGRESSIVE DISCOUNTS - Braille reverts to original price
export const SIZE_DISCOUNT_TIERS: SizeDiscount[] = [
  // Extra Small / Small sizes - 65% discount
  { sizePattern: /^(3|4|5|6|7)\s*(x|×)\s*(3|4|5|6|7)/i, discountPercent: 65, sizeName: 'XS/S' },
  { sizePattern: /^(80|90|100)\s*(x|×)\s*(80|90|100)\s*mm/i, discountPercent: 65, sizeName: 'Small (mm)' },
  
  // Medium sizes (8x8) - 73% discount ($78.88 -> ~$21)
  { sizePattern: /^8\s*(x|×)\s*8/i, discountPercent: 73, sizeName: 'Medium 8x8' },
  { sizePattern: /^(9|9\.8)\s*(x|×)\s*(4|4\.7|5|9)/i, discountPercent: 70, sizeName: 'Medium' },
  { sizePattern: /^(110|120|130)\s*(x|×)\s*(110|120|130)\s*mm/i, discountPercent: 70, sizeName: 'Medium (mm)' },
  
  // Large sizes (10x10) - 75% discount
  { sizePattern: /^10\s*(x|×)\s*10/i, discountPercent: 75, sizeName: 'Large 10x10' },
  { sizePattern: /^(11|11\.8)\s*(x|×)\s*(5|5\.5|11)/i, discountPercent: 75, sizeName: 'Large' },
  { sizePattern: /^(140|150|160)\s*(x|×)\s*(100|140|150|160)\s*mm/i, discountPercent: 75, sizeName: 'Large (mm)' },
  
  // Extra Large sizes (12x12) - 78% discount
  { sizePattern: /^12\s*(x|×)\s*12/i, discountPercent: 78, sizeName: 'XL 12x12' },
  { sizePattern: /^(13|13\.8|14)\s*(x|×)\s*(6|6\.3|13|14)/i, discountPercent: 78, sizeName: 'XL' },
  { sizePattern: /^(170|180|190|200|240)\s*(x|×)\s*(120|140|170|180|190|200|240)\s*mm/i, discountPercent: 78, sizeName: 'XL (mm)' },
  
  // XXL sizes - 80% discount (maximum)
  { sizePattern: /^(15|16|18|20)\s*(x|×)\s*(15|16|18|20)/i, discountPercent: 80, sizeName: 'XXL' },
  { sizePattern: /^(250|300)\s*(x|×)\s*(120|150|250|300)\s*mm/i, discountPercent: 80, sizeName: 'XXL (mm)' },
];

// Default discount for sizes that don't match any pattern
const DEFAULT_DISCOUNT_PERCENT = 70;

/**
 * Get discount percentage based on size string
 */
export const getSizeDiscountPercent = (sizeString: string): number => {
  if (!sizeString) return DEFAULT_DISCOUNT_PERCENT;
  
  const normalizedSize = sizeString.trim();
  
  for (const tier of SIZE_DISCOUNT_TIERS) {
    if (tier.sizePattern.test(normalizedSize)) {
      return tier.discountPercent;
    }
  }
  
  // Check for "in" suffix sizes (e.g., "8x8in")
  const inchMatch = normalizedSize.match(/(\d+\.?\d*)\s*(x|×)\s*(\d+\.?\d*)\s*in/i);
  if (inchMatch) {
    const width = parseFloat(inchMatch[1]);
    const height = parseFloat(inchMatch[3]);
    const maxDim = Math.max(width, height);
    
    if (maxDim >= 15) return 80;  // XXL - 80% off
    if (maxDim >= 12) return 78;  // XL - 78% off
    if (maxDim >= 10) return 75;  // Large - 75% off
    if (maxDim >= 8) return 73;   // Medium - 73% off
    return 65;                     // Small - 65% off
  }
  
  return DEFAULT_DISCOUNT_PERCENT;
};

/**
 * Calculate discounted price for a given size
 */
export const calculateDiscountedPrice = (
  originalPrice: number,
  sizeString: string,
  hasBraille: boolean
): { discountedPrice: number; discountPercent: number; savings: number } => {
  // If braille is selected, return original price (premium feature)
  if (hasBraille) {
    return {
      discountedPrice: originalPrice,
      discountPercent: 0,
      savings: 0
    };
  }
  
  const discountPercent = getSizeDiscountPercent(sizeString);
  const savings = originalPrice * (discountPercent / 100);
  const discountedPrice = originalPrice - savings;
  
  return {
    discountedPrice: Math.round(discountedPrice * 100) / 100, // Round to 2 decimal places
    discountPercent,
    savings: Math.round(savings * 100) / 100
  };
};

/**
 * Get pricing info for display (shows original, discounted, and savings)
 */
export const getPricingInfo = (
  originalPrice: number,
  sizeString: string,
  hasBraille: boolean
): {
  displayPrice: number;
  originalPrice: number;
  discountPercent: number;
  savings: number;
  isPremium: boolean;
  message: string;
} => {
  const { discountedPrice, discountPercent, savings } = calculateDiscountedPrice(
    originalPrice,
    sizeString,
    hasBraille
  );
  
  if (hasBraille) {
    return {
      displayPrice: originalPrice,
      originalPrice: originalPrice,
      discountPercent: 0,
      savings: 0,
      isPremium: true,
      message: '🔤 Premium Braille Option - Full Price'
    };
  }
  
  return {
    displayPrice: discountedPrice,
    originalPrice: originalPrice,
    discountPercent,
    savings,
    isPremium: false,
    message: discountPercent > 0 
      ? `🏷️ ${discountPercent}% Size Discount Applied!` 
      : ''
  };
};

/**
 * Format price string with currency symbol
 */
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    CAD: 'C$',
    EUR: '€',
    GBP: '£'
  };
  
  const symbol = symbols[currency] || '$';
  return `${symbol}${price.toFixed(2)}`;
};

/**
 * Apply discount to all size options in a product
 */
export const applyDiscountsToSizeOptions = (
  sizeOptions: { size: string; price: string }[],
  hasBraille: boolean
): { size: string; price: string; originalPrice: string; discountPercent: number }[] => {
  return sizeOptions.map(option => {
    const originalPrice = parseFloat(option.price.replace(/[^0-9.]/g, ''));
    const { discountedPrice, discountPercent } = calculateDiscountedPrice(
      originalPrice,
      option.size,
      hasBraille
    );
    
    return {
      size: option.size,
      price: `$${discountedPrice.toFixed(2)}`,
      originalPrice: option.price,
      discountPercent
    };
  });
};

// Export discount info for UI display
export const DISCOUNT_INFO = {
  title: '🎉 Size-Based Discounts!',
  description: 'Larger sizes = Bigger savings! Braille maintains premium pricing.',
  tiers: [
    { size: 'Small (≤7")', discount: '5%' },
    { size: 'Medium (8")', discount: '10%' },
    { size: 'Large (10")', discount: '15%' },
    { size: 'X-Large (12")', discount: '20%' },
    { size: 'XX-Large (15"+)', discount: '25%' },
  ],
  brailleNote: '🔤 Braille option = Premium pricing (no discount)'
};
