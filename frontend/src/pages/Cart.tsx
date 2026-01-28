import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ImprovedNavigation from "@/components/ImprovedNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const Cart = () => {
  const { 
    items, 
    totalItems, 
    subtotal, 
    tax, 
    shipping, 
    totalPrice, 
    updateQuantity, 
    removeFromCart,
    clearCart 
  } = useCart();
  
  const { convertPrice, selectedCurrency } = useCurrency();
  const navigate = useNavigate();
  
  // Helper function to get actual size text
  const getActualSize = (item: any) => {
    if (!item.selectedSize) return '';
    if (item.sizeOptions && item.sizeOptions.length > 0) {
      const sizeOption = item.sizeOptions.find((opt: any) => opt.size === item.selectedSize);
      if (sizeOption) {
        return sizeOption.size;
      }
    }
    return item.selectedSize;
  };

  // Handle edit item - navigate to product page
  const handleEditItem = (item: any) => {
    // Navigate to product detail page where they can modify options
    navigate(`/products/${item.slug || item.id}`);
  };

  if (items.length === 0) {
    return (
      <>
        <SEO
          title="Shopping Cart | AB Signs"
          description="Your shopping cart for professional door signs and signage"
          canonical="/cart"
          type="website"
        />
        <div className="min-h-screen bg-background">
          <Header />
          <ImprovedNavigation />
          
          {/* Empty Cart */}
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="text-6xl mb-6">🛒</div>
              <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">
                Start shopping to add items to your cart and create your perfect signage solution.
              </p>
              <Link to="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
          
          <ImprovedFooter />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`Shopping Cart (${totalItems} items) | AB Signs`}
        description="Review your selected professional door signs and signage before checkout"
        canonical="/cart"
        type="website"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <ImprovedNavigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {item.name}
                        </h3>
                        
                        {/* Product Options */}
                        <div className="text-sm text-muted-foreground space-y-1 mb-3">
                          {item.selectedSize && (
                            <div>Size: {getActualSize(item)}</div>
                          )}
                          {item.selectedColor && (
                            <div>Color: {item.selectedColor}</div>
                          )}
                          {item.selectedBraille && (
                            <div>Braille: {item.selectedBraille}</div>
                          )}
                          {item.selectedShape && (
                            <div>Shape: {item.selectedShape}</div>
                          )}
                          {item.customizations?.roomNumber && (
                            <div>{item.category === "door-number-signs" ? "Door Number" : "Custom Number"}: {item.customizations.roomNumber}</div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price and Remove */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-semibold">
                                {convertPrice(item.itemPrice * item.quantity)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {convertPrice(item.itemPrice)} each
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Clear Cart Button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear All Items
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>{convertPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-green-600 font-medium">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (13%)</span>
                      <span>{convertPrice(tax)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{convertPrice(totalPrice)} {selectedCurrency}</span>
                    </div>
                  </div>

                  {/* Free Shipping Message */}
                  {subtotal < 100 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                      <div className="text-blue-800 font-medium">
                        Free shipping on orders over $100!
                      </div>
                      <div className="text-blue-600">
                        Add ${(100 - subtotal).toFixed(2)} more to qualify
                      </div>
                    </div>
                  )}

                  {/* Checkout Buttons */}
                  <div className="space-y-3 mt-6">
                    <Link to="/checkout" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
                        Proceed to Checkout
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    
                    <Link to="/products" className="block">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span>🔒</span>
                      <span>Secure Checkout</span>
                    </div>
                    <div>256-bit SSL encryption</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <ImprovedFooter />
      </div>
    </>
  );
};

export default Cart;