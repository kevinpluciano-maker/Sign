/**
 * Simple Pricing Engine
 * 
 * Base price: ~$21 for 8x8
 * 10x10: +10% extra
 * 12x12: +$10 extra
 * Braille: Reverts to original $58-$76 range (no surcharge)
 */

export interface SizeDiscount {
  sizePattern: RegExp;
  discountPercent: number;
  sizeName: string;
}

// Size-based discount tiers - simplified
export const SIZE_DISCOUNT_TIERS: SizeDiscount[] = [
  // Small sizes - 65% discount
  { sizePattern: /^(3|4|5|6|7)\s*(x|×)\s*(3|4|5|6|7)/i, discountPercent: 65, sizeName: 'Small' },
  { sizePattern: /^(80|90|100)\s*(x|×)\s*(80|90|100)\s*mm/i, discountPercent: 65, sizeName: 'Small' },
  
  // 8x8 - Base price (~$21 from $58) = 64% discount
  { sizePattern: /^8\s*(x|×)\s*8/i, discountPercent: 64, sizeName: '8x8' },
  { sizePattern: /^(110|120|130)\s*(x|×)\s*(110|120|130)\s*mm/i, discountPercent: 64, sizeName: 'Medium' },
  
  // 10x10 - Base + 10% = ~$23 from $65 = 65% discount (slightly less than 8x8 to add ~10%)
  { sizePattern: /^10\s*(x|×)\s*10/i, discountPercent: 64, sizeName: '10x10' },
  { sizePattern: /^(9|9\.8)\s*(x|×)\s*(4|4\.7|5|9)/i, discountPercent: 64, sizeName: 'Medium' },
  { sizePattern: /^(11|11\.8)\s*(x|×)\s*(5|5\.5|11)/i, discountPercent: 64, sizeName: 'Large' },
  { sizePattern: /^(140|150|160)\s*(x|×)\s*(100|140|150|160)\s*mm/i, discountPercent: 64, sizeName: 'Large' },
  
  // 12x12 - Base + $10 = ~$31 from $76 = 59% discount
  { sizePattern: /^12\s*(x|×)\s*12/i, discountPercent: 59, sizeName: '12x12' },
  { sizePattern: /^(13|13\.8|14)\s*(x|×)\s*(6|6\.3|13|14)/i, discountPercent: 59, sizeName: 'XL' },
  { sizePattern: /^(170|180|190|200|240)\s*(x|×)\s*(120|140|170|180|190|200|240)\s*mm/i, discountPercent: 59, sizeName: 'XL' },
  
  // XXL sizes
  { sizePattern: /^(15|16|18|20)\s*(x|×)\s*(15|16|18|20)/i, discountPercent: 55, sizeName: 'XXL' },
  { sizePattern: /^(250|300)\s*(x|×)\s*(120|150|250|300)\s*mm/i, discountPercent: 55, sizeName: 'XXL' },
];

// Default discount for sizes that don't match any pattern
const DEFAULT_DISCOUNT_PERCENT = 64;

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
    
    if (maxDim >= 15) return 55;  // XXL
    if (maxDim >= 12) return 59;  // 12x12 - base + $10
    if (maxDim >= 10) return 64;  // 10x10 - base + 10%
    if (maxDim >= 8) return 64;   // 8x8 - base price
    return 65;                     // Small
  }
  
  return DEFAULT_DISCOUNT_PERCENT;
};

/**
 * Calculate discounted price for a given size
 * - Without Braille: Apply size-based discount
 * - With Braille: Fixed price of $58 (converts to ~$78 CAD)
 */
export const calculateDiscountedPrice = (
  originalPrice: number,
  sizeString: string,
  hasBraille: boolean
): { discountedPrice: number; discountPercent: number; savings: number } => {
  // If braille is selected, return fixed price of $58 USD (≈$78 CAD)
  // This is the "original" undiscounted price for braille customers
  if (hasBraille) {
    // Get the base price based on size (8x8=$58, 10x10=$65, 12x12=$76)
    let braillePrice = 58; // default for 8x8
    
    if (sizeString.includes('10') || sizeString.includes('150')) {
      braillePrice = 65;
    } else if (sizeString.includes('12') || sizeString.includes('170') || sizeString.includes('180')) {
      braillePrice = 76;
    }
    
    return {
      discountedPrice: braillePrice,
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
    const originalPrice = parseFloat(String(option.price).replace(/[^0-9.]/g, ''));
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
  title: 'Simple Pricing',
  description: 'Clear pricing with Braille premium option',
  tiers: [
    { size: '8x8', discount: 'Base price' },
    { size: '10x10', discount: '+10%' },
    { size: '12x12', discount: '+$10' },
  ],
  brailleNote: 'Braille = Original price'
};
