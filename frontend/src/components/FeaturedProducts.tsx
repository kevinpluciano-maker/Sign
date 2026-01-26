import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf, TrendingUp, Award, Sparkles, Eye, Tag } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductGrid from "./ProductGrid";
import EditableProductCard from "./editor/EditableProductCard";
import InlineEditor from "./editor/InlineEditor";
import { LazySection } from "./LazySection";
import { OptimizedImage } from "./OptimizedImage";
import { useEditor } from "@/contexts/EditorContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { bestSellersProducts } from "@/data/bestSellersProducts";
import { getAllProducts } from "@/data/productsData";
import { getPricingInfo } from "@/utils/pricingEngine";

const FeaturedProducts = () => {
  const { isEditing, isPreviewing, sections, updateProductData } = useEditor();
  const { convertPrice, selectedCurrency } = useCurrency();
  
  // Get featured product - prioritize Staff ADA Sign
  const featuredProduct = bestSellersProducts.find(p => p.id === "staff-ada-sign") || bestSellersProducts[0];
  
  // Get new arrivals - specific products as requested
  const newArrivalsIds = [
    "acrylic-all-gender-sign",
    "all-gender-stainless-steel-sign", 
    "meeting-room-ada-sign",
    "acrylic-exam-room-sign",
    "reception-ada-sign"
  ];
  
  const allProducts = getAllProducts();
  const newProducts = allProducts.filter(p => newArrivalsIds.includes(p.id));
  
  // Get trending products - specific products as requested
  const trendingProductIds = [
    "door-number-wood-stainless-steel",
    "no-bicycles-stainless-steel-sign", 
    "no-guns-allowed-stainless-steel-sign",
    "no-loitering-stainless-steel-sign",
    "pull-door-stainless-steel-sign"
  ];
  
  const trendingProducts = allProducts.filter(p => trendingProductIds.includes(p.id));
  
  // Get premium products - specific products with No Food Allowed, Men Restroom Sign, Women Restroom Sign, Acrylic WC Restroom Sign, and Roof Access
  const noFoodProduct = allProducts.find(p => p.id === "no-food-allowed-stainless-steel-sign");
  const menRestroomProduct = allProducts.find(p => p.id === "men-restroom-sign");
  const womenRestroomProduct = allProducts.find(p => p.id === "women-restroom-sign");
  const acrylicWcProduct = allProducts.find(p => p.id === "acrylic-wc-restroom-sign");
  const roofAccessProduct = allProducts.find(p => p.id === "roof-access-stainless-steel-sign");
  
  // Build premium products array with required products
  const premiumProducts = [
    noFoodProduct,
    menRestroomProduct,
    womenRestroomProduct,
    acrylicWcProduct,
    roofAccessProduct
  ].filter(Boolean); // Remove any undefined products
  
  // Get budget-friendly options - reduced to make space
  const budgetProducts = bestSellersProducts
    .filter(p => p.price <= 20)
    .slice(0, 3);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />);
    }

    return stars;
  };

  const ProductComponent = (isEditing || isPreviewing) ? EditableProductCard : ProductCard;

  const handleSectionTitleSave = (newTitle: string) => {
    console.log('Section title updated:', newTitle);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-30" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced Hero Header - Removed per user request */}

        {/* Enhanced Featured Hero Product */}
        <div className="mb-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-6 py-3 rounded-full border border-purple-200 dark:border-purple-700 shadow-lg mb-4">
              <Sparkles className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-lg font-bold text-purple-800 dark:text-purple-200">Customer Favorite</span>
            </div>
          </div>
          
          <Card className="max-w-7xl mx-auto overflow-hidden shadow-strong hover:shadow-glow group cursor-pointer animate-scale-in rounded-2xl border-0 bg-gradient-to-br from-card to-muted/30">
            <Link to={`/products/${featuredProduct.id}`}>
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative aspect-square lg:aspect-auto overflow-hidden bg-gradient-to-br from-muted/40 to-muted/60">
                  <OptimizedImage
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                    priority={true}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Floating elements */}
                  <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 star-gold" />
                      <span className="font-bold text-gray-800">{featuredProduct.rating}</span>
                      <span className="text-sm text-gray-600">({featuredProduct.reviewCount})</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      {renderStars(featuredProduct.rating)}
                      <span className="ml-4 text-lg font-bold bg-muted/70 px-3 py-1 rounded-full text-muted-foreground">
                        {featuredProduct.reviewCount} reviews
                      </span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 group-hover:text-primary transition-colors leading-tight">
                      {featuredProduct.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-xl mb-8 leading-relaxed">
                      {featuredProduct.description}
                    </p>
                    
                      <div className="space-y-6">
                      <div className="flex items-baseline space-x-3">
                        <span className="text-4xl md:text-5xl font-black price-gradient">
                          {convertPrice(`from $${featuredProduct.price.toFixed(2)}`)}
                        </span>
                        <span className="text-lg text-muted-foreground font-medium">{selectedCurrency}</span>
                      </div>
                      
                      <Button size="lg" className="button-modern text-white px-8 py-4 text-lg font-bold">
                        <Eye className="h-5 w-5 mr-3" />
                        View Product Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        {/* Enhanced New Arrivals */}
        {newProducts.length > 0 && (
          <LazySection className="mb-24 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-6 py-3 rounded-full border border-green-200 dark:border-green-700 shadow-lg mb-4">
                <Sparkles className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-3xl font-black text-green-800 dark:text-green-200">New Arrivals</h3>
              </div>
            </div>
            <ProductGrid products={newProducts} />
          </LazySection>
        )}

        {/* Enhanced Trending Products */}
        <LazySection className="mb-24 animate-fade-in">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 px-6 py-3 rounded-full border border-orange-200 dark:border-orange-700 shadow-lg mb-4">
              <TrendingUp className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-3xl font-black text-orange-800 dark:text-orange-200">Trending Now</h3>
            </div>
          </div>
          <ProductGrid products={trendingProducts} />
        </LazySection>

        {/* Enhanced Premium Collection */}
        <LazySection className="mb-24 animate-fade-in">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 px-6 py-3 rounded-full border border-yellow-200 dark:border-yellow-700 shadow-lg mb-4">
              <Award className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-3xl font-black text-yellow-800 dark:text-yellow-200">Premium Collection</h3>
            </div>
            
          </div>
          <ProductGrid products={premiumProducts} />
        </LazySection>

        {/* Enhanced Call to Action */}
        <div className="text-center mt-20 animate-fade-in">
          <Card className="max-w-4xl mx-auto overflow-hidden border-0 shadow-strong rounded-2xl">
            <div className="relative bg-gradient-to-br from-primary to-primary-glow p-12 md:p-16 text-white">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-glow/90" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
              
              <CardContent className="p-0 relative z-10">
                <div className="mb-6">
                  <span className="text-6xl">🎨</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-6">Need Something Custom?</h3>
                <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
                  Can't find exactly what you're looking for? We create custom door signs tailored to your specific needs with premium materials and expert craftsmanship.
                </p>
                <div className="space-y-4">
                  <a href="mailto:acrylicbraillesigns@gmail.com?subject=Custom Quote Request&body=Hello,%0D%0A%0D%0AI would like to request a custom quote for:%0D%0A%0D%0AProduct Type:%0D%0ADimensions:%0D%0AQuantity:%0D%0AAdditional Details:%0D%0A%0D%0AThank you!">
                    <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-bold shadow-lg">
                      Request Custom Quote
                    </Button>
                  </a>
                  <div className="flex items-center justify-center space-x-6 text-sm text-white/80">
                    <span>✓ Free Design Consultation</span>
                    <span>✓ Premium Materials</span>
                    <span>✓ Fast Turnaround</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;