import { useState } from "react";
import { OptimizedImage } from "@/hooks/useImageOptimization";
import { Star, StarHalf, ShoppingCart, Eye, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/data/productsData";
import { getPricingInfo } from "@/utils/pricingEngine";

interface ProductCardProps extends Product {
  // Additional props that may be passed from other components
  colors?: string[];
  isNew?: boolean;
  glbUrl?: string;
  lazy?: boolean;
}

const ProductCard = (product: ProductCardProps) => {
  const { 
    id,
    name,
    image,
    price,
    originalPrice,
    rating,
    reviews,
    colors = [],
    isNew = false,
    badges = [],
    glbUrl,
    lazy = false,
    slug,
    category,
    description,
    materials = [],
    designs = [],
    sizeOptions = [],
    colorOptions = [],
    shapeOptions = [],
    brailleOptions = [],
    hasCustomSize = false,
    hasCustomNumberField = false
  } = product;
  
  const { convertPrice, selectedCurrency } = useCurrency();
  const { addToCart, isInCart, totalItems } = useCart();
  const displayReviews = reviews || 0;
  const [isAdding, setIsAdding] = useState(false);

  // Calculate discounted price (no braille = discount applies)
  const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
  const firstSize = sizeOptions?.[0]?.size || "8 x 8 in";
  const pricingInfo = getPricingInfo(numericPrice, firstSize, false); // false = no braille = show discount

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    
    try {
      // Use the full product object for the cart
      const productForCart: Product = {
        id,
        name,
        image,
        price: price.toString(),
        originalPrice: originalPrice?.toString(),
        rating,
        reviews: displayReviews,
        slug: slug || id,
        category: category || 'products',
        description: description || `Professional ${name.toLowerCase()}`,
        materials,
        designs,
        badges,
        sizeOptions,
        colorOptions,
        shapeOptions,
        brailleOptions,
        hasCustomSize,
        hasCustomNumberField
      };
      
      // Add to cart with default quantity of 1
      addToCart(productForCart, {
        quantity: 1
      });
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-primary text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-primary text-primary" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />);
    }

    return stars;
  };


  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${id}`;
  };

  return (
    <Link to={`/products/${id}`} className="block group h-full">
      <Card className="group-hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white border border-gray-200 shadow-sm hover:shadow-lg overflow-hidden">
        {isNew && (
          <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            New
          </div>
        )}
        
        {/* Floating discount badge - Always show discount */}
        {pricingInfo.discountPercent > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
            -{pricingInfo.discountPercent}% OFF
          </div>
        )}
        
        <CardContent className="p-0 h-full flex flex-col">
          {/* Product Image - Full width on mobile for better visualization, no white borders, transparent background */}
          <div className="relative overflow-hidden bg-transparent aspect-square flex-shrink-0 flex items-center justify-center p-0">
            <OptimizedImage
              src={image}
              alt={name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 bg-transparent"
              priority={!lazy}
              loading={lazy ? "lazy" : "eager"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            
            {/* Rating badge - Temporarily disabled */}
            {/* <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{rating}</span>
            </div> */}
          </div>

          {/* Product Info - Flex grow to fill remaining space */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div className="flex-1">
              {/* Product Name */}
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 min-h-[3.5rem] leading-tight">
                {name}
              </h3>

              {/* Reviews - Temporarily disabled */}
              {/* <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {renderStars(rating)}
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  ({displayReviews})
                </span>
              </div> */}

              {/* Price Display */}
              <div className="space-y-2 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">
                    {convertPrice(price)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {selectedCurrency}
                  </span>
                </div>
                {originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-base text-muted-foreground line-through">
                      {convertPrice(originalPrice)}
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-lg font-bold">
                      Save {convertPrice(Number(originalPrice) - Number(price))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Always at the bottom */}
            <div className="flex gap-2 mt-auto">
              <Button 
                className="flex-1 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 disabled:opacity-50 border-0" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                disabled={isAdding}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {isAdding ? 'Adding...' : isInCart(id) ? 'Add More' : 'Add to Cart'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="px-3 border-cyan-300 hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                onClick={handleViewProduct}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;