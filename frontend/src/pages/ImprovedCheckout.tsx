import SEO from "@/components/SEO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Lock, ArrowLeft, ShoppingBag, Truck, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ImprovedNavigation from "@/components/ImprovedNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { API_ENDPOINTS } from "@/config/api";

const ImprovedCheckout = () => {
  const { items, totalItems, subtotal, tax, shipping, totalPrice } = useCart();
  const { convertPrice, selectedCurrency, exchangeRates } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert USD amounts to selected currency
  const exchangeRate = exchangeRates[selectedCurrency as keyof typeof exchangeRates] || 1;
  const convertedSubtotal = subtotal * exchangeRate;
  const convertedTax = tax * exchangeRate;
  const convertedShipping = shipping * exchangeRate;
  const convertedTotal = totalPrice * exchangeRate;

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    terms: false
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email required';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone required';
    if (!formData.address.trim()) newErrors.address = 'Address required';
    if (!formData.city.trim()) newErrors.city = 'City required';
    if (!formData.state.trim()) newErrors.state = 'State required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP required';
    if (!formData.terms) newErrors.terms = 'Accept terms to continue';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsProcessing(true);

    try {
      const cartItems = items.map(item => {
        // Find the actual size text from sizeOptions
        let actualSize = item.selectedSize || '';
        if (item.selectedSize && item.sizeOptions && item.sizeOptions.length > 0) {
          const sizeOption = item.sizeOptions.find(opt => opt.size === item.selectedSize);
          if (sizeOption) {
            actualSize = sizeOption.size;
          }
        }

        return {
          name: item.name,
          quantity: item.quantity,
          price: `$${item.itemPrice.toFixed(2)}`,
          specifications: {
            size: actualSize,
            color: item.selectedColor || '',
            braille: item.selectedBraille || '',
            shape: item.selectedShape || '',
            customizations: item.customizations || {}
          }
        };
      });

      const paymentRequest = {
        cart_items: cartItems,
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        shipping_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
          country: formData.country
        },
        billing_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
          country: formData.country
        },
        host_url: window.location.origin,
        subtotal: Number(convertedSubtotal.toFixed(2)),
        tax: Number(convertedTax.toFixed(2)),
        shipping: Number(convertedShipping.toFixed(2)),
        total: Number(convertedTotal.toFixed(2)),
        currency: selectedCurrency
      };

      console.log('Creating checkout session...', paymentRequest);
      console.log('Using API endpoint:', API_ENDPOINTS.createCheckoutSession);

      const response = await fetch(API_ENDPOINTS.createCheckoutSession, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response:', contentType);
        throw new Error('Payment service is currently unavailable. Please contact us at acrylicbraillesigns@gmail.com to complete your order.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Payment error:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      console.log('Checkout session created:', data);
      
      if (data.url) {
        console.log('Redirecting to Stripe:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error?.message || 'Payment processing failed';
      alert(`${errorMessage}\n\nPlease contact us at acrylicbraillesigns@gmail.com to complete your order.`);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <SEO title="Checkout | Acrylic Braille Signs" />
        <div className="min-h-screen bg-background">
          <Header />
          <ImprovedNavigation />
          
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-md mx-auto">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
              <Link to="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
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

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const canadianProvinces = [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' }
  ];

  const stateOptions = formData.country === 'CA' ? canadianProvinces : usStates.map(s => ({ code: s, name: s }));

  return (
    <>
      <SEO
        title="Secure Checkout | Acrylic Braille Signs"
        description="Complete your order securely with Stripe payment"
        canonical="/checkout"
      />
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ImprovedNavigation />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <Link to="/cart" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-bold">Secure Checkout</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Contact Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={errors.firstName ? 'border-red-500' : ''}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={errors.lastName ? 'border-red-500' : ''}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className={errors.address ? 'border-red-500' : ''}
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={errors.city ? 'border-red-500' : ''}
                        />
                        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state">{formData.country === 'CA' ? 'Province' : 'State'} *</Label>
                        <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                          <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {stateOptions.map(option => (
                              <SelectItem key={option.code} value={option.code}>{option.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className={errors.zipCode ? 'border-red-500' : ''}
                        />
                        {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Terms */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={formData.terms}
                        onCheckedChange={(checked) => handleInputChange('terms', checked === true)}
                        className={errors.terms ? 'border-red-500' : ''}
                      />
                      <div className="flex-1">
                        <Label htmlFor="terms" className="cursor-pointer text-sm">
                          I agree to the terms and conditions and privacy policy *
                        </Label>
                        {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-6">
                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Items */}
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3 pb-3 border-b">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              <p className="text-sm font-semibold">{convertPrice(item.itemPrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Totals */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal ({totalItems} items)</span>
                          <span>{convertPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                            {shipping === 0 ? 'FREE' : convertPrice(shipping)}
                          </span>
                        </div>
                        {shipping > 0 && subtotal < 75 && (
                          <p className="text-xs text-muted-foreground">
                            Add {convertPrice(75 - subtotal)} more for free shipping!
                          </p>
                        )}
                        <div className="flex justify-between">
                          <span>Tax (13%)</span>
                          <span>{convertPrice(tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>{convertPrice(totalPrice)} {selectedCurrency}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Button */}
                  <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
                    <CardContent className="pt-6">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-white text-blue-600 hover:bg-gray-100 text-lg font-semibold h-14"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Pay {convertPrice(totalPrice)}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-100">
                        <Lock className="h-4 w-4" />
                        <span>Secure payment with Stripe</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Support */}
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6 text-center text-sm">
                      <Phone className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground mb-1">Need help?</p>
                      <a href="tel:+16472782905" className="text-blue-600 hover:underline font-medium">
                        +1 (647) 278-2905
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <ImprovedFooter />
      </div>
    </>
  );
};

export default ImprovedCheckout;
