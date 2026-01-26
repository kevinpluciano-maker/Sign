import SEO from "@/components/SEO";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, StarHalf, Minus, Plus, ShoppingCart, Share2, ArrowLeft, Edit3, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import ModernNavigation from "@/components/ModernNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";
import EditorToolbar from "@/components/editor/EditorToolbar";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import CustomSizeRequest from "@/components/CustomSizeRequest";
import ImageGallery from "@/components/ImageGallery";
import { useEditor } from "@/contexts/EditorContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { getProductById } from "@/data/productsData";
import { getPricingInfo } from "@/utils/pricingEngine";
import doorSign395 from "@/assets/door-sign-395.jpg";
import doorSign159 from "@/assets/door-sign-159.jpg";
import conferenceRoomSign from "@/assets/conference-room-sign.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isEditing, productData: editorProductData, updateProductData } = useEditor();
  const { convertPrice, selectedCurrency } = useCurrency();
  const { addToCart, isInCart } = useCart();
  const showContentEditor = searchParams.get('edit') === 'content';
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedBraille, setSelectedBraille] = useState("");
  const [selectedShape, setSelectedShape] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [roomNumber, setRoomNumber] = useState("");

  // Buy Now handler
  const handleBuyNow = () => {
    if (!foundProduct) return;
    
    // First add to cart
    addToCart(foundProduct, {
      quantity,
      selectedSize,
      selectedColor,
      selectedBraille,
      selectedShape,
      customizations: foundProduct.hasCustomNumberField ? { roomNumber } : undefined
    });
    
    // Then navigate to checkout
    navigate('/checkout');
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get product data from our products database
  const foundProduct = getProductById(id || "");

  // Initialize selected options when product loads
  useEffect(() => {
    if (foundProduct) {
      if (foundProduct.colorOptions && foundProduct.colorOptions.length > 0 && !selectedColor) {
        setSelectedColor(foundProduct.colorOptions[0].toLowerCase().replace(' ', '-'));
      }
      if (foundProduct.sizeOptions && foundProduct.sizeOptions.length > 0 && !selectedSize) {
        setSelectedSize('size-0');
      }
      if (foundProduct.brailleOptions && foundProduct.brailleOptions.length > 0 && !selectedBraille) {
        // Default to "No" braille option to show discounts by default
        const noOption = foundProduct.brailleOptions.find(opt => opt.toLowerCase() === 'no');
        if (noOption) {
          setSelectedBraille(noOption.toLowerCase().replace(' ', '-'));
        } else {
          setSelectedBraille(foundProduct.brailleOptions[0].toLowerCase().replace(' ', '-'));
        }
      }
      if (foundProduct.shapeOptions && foundProduct.shapeOptions.length > 0 && !selectedShape) {
        setSelectedShape(foundProduct.shapeOptions[0].toLowerCase());
      }
    }
  }, [foundProduct, selectedColor, selectedSize, selectedBraille, selectedShape]);
  
  const product = foundProduct ? {
    id: foundProduct.id,
    name: foundProduct.name,
    images: foundProduct.gallery || [foundProduct.image],
    price: parseFloat(foundProduct.price.replace(/[^0-9.]/g, '')),
    originalPrice: foundProduct.originalPrice ? parseFloat(foundProduct.originalPrice.replace(/[^0-9.]/g, '')) : undefined,
    rating: foundProduct.rating,
    reviewCount: foundProduct.reviews,
    inStock: true,
    sku: `BSN-${foundProduct.id.toUpperCase()}`,
    description: foundProduct.description,
    features: [
      `Made from premium ${foundProduct.materials.join(', ')} materials`,
      "Precision laser-cut design for crisp edges",
      "Weather-resistant for indoor/outdoor use", 
      "Easy installation with included mounting hardware",
      "Professional appearance and durability",
      "Custom sizing available upon request"
    ],
    specifications: {
      "Material": foundProduct.materials.join(', '),
      "Design": foundProduct.designs.join(', '),
      "Category": foundProduct.category,
      "Installation": "Adhesive or Screw Mount",
      "Weather Rating": "Indoor/Outdoor",
      "Warranty": "Lifetime Quality Guarantee"
    },
    sizeOptions: foundProduct.sizeOptions,
    colorOptions: foundProduct.colorOptions,
    brailleOptions: foundProduct.brailleOptions,
    hasCustomSize: foundProduct.hasCustomSize
  } : {
    id: "1",
    name: 'Product Not Found',
    images: [doorSign395, doorSign159, conferenceRoomSign],
    price: 15.00,
    originalPrice: 20.00,
    rating: 5,
    reviewCount: 26,
    inStock: true,
    sku: "BSN-395-BLK",
    description: "Product not found",
    features: [],
    specifications: {},
    sizeOptions: undefined,
    colorOptions: undefined,
    brailleOptions: undefined,
    hasCustomSize: false
  };

  // Dynamic color options based on product data
  const colorOptions = product.colorOptions?.map((color, index) => ({
    name: color,
    value: color.toLowerCase().replace(' ', '-'),
    class: color.includes('Clear') ? 'bg-white border-2 border-muted' :
           color.includes('Frosted') ? 'bg-gray-100 border-2 border-muted' :
           index === 0 ? 'bg-black' : 'bg-gray-400',
    price: product.price
  })) || [
    { name: "Black", value: "black", class: "bg-black", price: product.price },
    { name: "White", value: "white", class: "bg-white border-2 border-muted", price: product.price },
  ];

  // Dynamic size options based on product data
  const sizeOptions = product.sizeOptions?.map((sizeOption, index) => ({
    name: sizeOption.size,
    value: `size-${index}`,
    price: parseFloat(sizeOption.price.replace(/[^0-9.]/g, ''))
  })) || [
    { name: "Standard Size", value: "standard", price: product.price }
  ];

  // Calculate pricing with size-based discounts and braille premium
  const calculatePricingDetails = () => {
    let basePrice = product.price;
    let sizeString = '';
    
    // Use selected size price if available
    if (selectedSize) {
      const sizeOption = sizeOptions.find(opt => opt.value === selectedSize);
      if (sizeOption) {
        basePrice = sizeOption.price;
        sizeString = sizeOption.name;
      }
    }
    
    // Check if braille is selected (premium feature - no discount)
    const hasBraille = selectedBraille && selectedBraille.toLowerCase() === 'yes';
    
    // Get pricing info with discount logic
    const pricingInfo = getPricingInfo(basePrice, sizeString, hasBraille);
    
    // NO additional surcharge - braille just reverts to original price
    const finalPrice = pricingInfo.displayPrice;
    
    return {
      basePrice,
      finalPrice,
      discountPercent: pricingInfo.discountPercent,
      savings: pricingInfo.savings,
      isPremium: pricingInfo.isPremium,
      message: pricingInfo.message,
      brailleSurcharge: 0
    };
  };

  const pricingDetails = calculatePricingDetails();
  const totalPrice = pricingDetails.finalPrice;

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

  const selectedColorOption = colorOptions.find(c => c.value === selectedColor);
  const selectedSizeOption = sizeOptions.find(s => s.value === selectedSize);

// Get current product data (original + any edits)
  const currentProductData = editorProductData[product.id];
  const displayName = currentProductData?.name ?? product.name;
  const displayDescription = currentProductData?.description ?? product.description;

  const handleNameSave = (newName: string) => {
    updateProductData(product.id, { name: newName });
  };

  const handleDescriptionSave = (newDescription: string) => {
    updateProductData(product.id, { description: newDescription });
  };

  // Product content editor handlers  
  const handleContentSave = (contentData: any) => {
    // In a real app, this would save to your backend/database
    console.log('Saving product content:', contentData);
    // Store in localStorage for now since we can't extend the Product type easily
    localStorage.setItem(`product_content_${product.id}`, JSON.stringify(contentData));
  };

  const handleContentCancel = () => {
    // Navigate back to normal product view
    window.history.replaceState({}, '', `/product/${id}`);
    window.location.reload();
  };

  // Editor functionality removed - always show normal product view

  return (
    <>
      <SEO
        title={`${displayName} | Professional Signage | AB Signs`}
        description={displayDescription}
        canonical={`/products/${id}`}
        type="product"
        price={totalPrice.toString()}
        availability="InStock"
        sku={product.sku}
      />
      <div className="min-h-screen bg-background">
      <EditorToolbar />
      
        {/* Header */}
        <Header />
        
        {/* Navigation */}
        <ModernNavigation />
      
        {/* Product Detail Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/collections/new" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <ImageGallery
              images={product.images}
              productName={displayName}
              selectedIndex={selectedImageIndex}
              onIndexChange={setSelectedImageIndex}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">In Stock</Badge>
                {isEditing && (
                  <Link 
                    to={`/product/${id}?edit=content`}
                    className="inline-flex items-center text-sm text-primary hover:text-primary/80"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit Product Content
                  </Link>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">
                {displayName}
              </h1>
              {/* Reviews removed per client request */}
            </div>

            {/* Price - Simple and Clean */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-primary">{convertPrice(totalPrice * quantity)} {selectedCurrency}</span>
              </div>
              
              {/* Simple Braille note */}
              {pricingDetails.isPremium && (
                <p className="text-sm text-muted-foreground">
                  With Braille option selected
                </p>
              )}
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-5">
               {/* Color Selection */}
               {product.colorOptions && product.colorOptions.length > 0 && (
                 <div>
                   <h3 className="text-sm font-semibold text-foreground mb-2">Material & Color Options</h3>
                   <select 
                     value={selectedColor} 
                     onChange={(e) => setSelectedColor(e.target.value)}
                     className="w-full p-2.5 text-sm border border-border rounded-md bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                   >
                     <option value="">Select material and color</option>
                     {colorOptions.map((color) => (
                       <option key={color.value} value={color.value}>
                         {color.name}
                       </option>
                     ))}
                   </select>
                 </div>
               )}

              {/* Size Selection - Simple */}
              {product.sizeOptions && product.sizeOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Size: {selectedSizeOption?.name || 'Select Size'}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {sizeOptions.map((size) => {
                      const hasBraille = selectedBraille && selectedBraille.toLowerCase() === 'yes';
                      const sizePricing = getPricingInfo(size.price, size.name, hasBraille);
                      return (
                        <button
                          key={size.value}
                          className={`p-2.5 text-left text-sm border rounded-md transition-all duration-200 hover:shadow-sm ${
                            selectedSize === size.value 
                              ? "border-primary bg-primary/8 shadow-sm" 
                              : "border-border hover:border-primary/60 hover:bg-muted/20"
                          }`}
                          onClick={() => setSelectedSize(size.value)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{size.name}</span>
                            <span className="text-sm font-semibold text-primary">
                              {convertPrice(sizePricing.displayPrice)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {product.hasCustomSize && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Need a different size? Request a custom quote below.
                    </p>
                  )}
                </div>
              )}

              {/* Braille Option */}
              {foundProduct && foundProduct.brailleOptions && foundProduct.brailleOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Braille Option</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {foundProduct.brailleOptions.map((option, index) => (
                      <button
                        key={index}
                        className={`p-2.5 text-center text-sm border rounded-md transition-all duration-200 hover:shadow-sm ${
                          selectedBraille === option.toLowerCase().replace(' ', '-')
                            ? "border-primary bg-primary/8 shadow-sm" 
                            : "border-border hover:border-primary/60 hover:bg-muted/20"
                        }`}
                        onClick={() => setSelectedBraille(option.toLowerCase().replace(' ', '-'))}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="font-medium">{option}</span>
                          {option === "Yes" && (
                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                              ADA Compliant
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shape Option */}
              {foundProduct?.shapeOptions && foundProduct.shapeOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Shape</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {foundProduct.shapeOptions.map((shape, index) => (
                      <button
                        key={index}
                        className={`p-3 text-center border rounded-md transition-all duration-200 hover:shadow-sm ${
                          selectedShape === shape.toLowerCase()
                            ? "border-primary bg-primary/8 shadow-sm" 
                            : "border-border hover:border-primary/60 hover:bg-muted/20"
                        }`}
                        onClick={() => setSelectedShape(shape.toLowerCase())}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-2xl text-primary">
                            {shape === "Circle" ? "●" : shape === "Rectangle" ? "▬" : "■"}
                          </span>
                          <span className="text-sm font-medium">{shape}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Number Field for Door Number Products */}
              {foundProduct?.hasCustomNumberField && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {foundProduct.category === "door-number-signs" ? "Door Number" : "Custom Number"}
                  </h3>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder={foundProduct.category === "door-number-signs" ? "Enter door number (e.g., 101, Suite A)" : "Enter room number (e.g., 101, A-15)"}
                    className="w-full p-2.5 text-sm border border-border rounded-md bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be printed on your {foundProduct.category === "door-number-signs" ? "door number sign" : "sign"}
                  </p>
                </div>
              )}

              {/* Quantity - Refined Design */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Quantity</h3>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-lg bg-white hover:bg-primary hover:text-white transition-all border-primary/30 shadow-sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-primary">{quantity}</span>
                    <span className="text-xs text-muted-foreground">Items</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-lg bg-white hover:bg-primary hover:text-white transition-all border-primary/30 shadow-sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Separator hidden per client request */}
            {/* <Separator /> */}

            {/* Add to Cart */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => addToCart(foundProduct, {
                  quantity,
                  selectedSize,
                  selectedColor,
                  selectedBraille,
                  selectedShape,
                  customizations: foundProduct?.hasCustomNumberField ? { roomNumber } : undefined
                })}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isInCart(product.id) ? 'Add More to Cart' : 'Add to Cart'} - ${(totalPrice * quantity).toFixed(2)}
              </Button>
              
              {/* Buy Now Button */}
              <Button 
                size="lg" 
                variant="outline"
                className="w-full"
                onClick={handleBuyNow}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Buy Now - ${(totalPrice * quantity).toFixed(2)}
              </Button>
              
              {/* Custom Size Request Button */}
              {product.hasCustomSize && (
                <CustomSizeRequest productName={displayName} />
              )}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            {/* Only Description tab - Specifications and Reviews removed */}
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="space-y-6 mt-8">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
                  Product Description
                </h3>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg mb-8 space-y-4">
                  {displayDescription.split('.').filter(Boolean).map((sentence, idx) => (
                    <p key={idx} className="first:text-xl first:font-medium">
                      {sentence.trim()}.
                    </p>
                  ))}
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Key Features:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start group">
                        <span className="w-2 h-2 bg-gradient-to-br from-primary to-primary/50 rounded-full mt-2 mr-3 flex-shrink-0 group-hover:scale-150 transition-transform" />
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            {/* Specifications and Reviews sections removed per client request */}
          </Tabs>
        </div>
        
        {/* Product Reviews Section - Removed per client request */}
        
        {/* Related Products Section */}
        <div className="container mx-auto px-4 pb-16">
          <RelatedProducts 
            currentProductId={product.id}
            currentProductCategory={product.category}
            maxProducts={4}
          />
        </div>
        </div>

        {/* Footer */}
        <ImprovedFooter />
      </div>
    </>
  );
};

export default ProductDetail;