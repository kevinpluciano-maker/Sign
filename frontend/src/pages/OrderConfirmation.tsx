import SEO from "@/components/SEO";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Package, Mail, Phone } from "lucide-react";
import Header from "@/components/Header";
import ImprovedNavigation from "@/components/ImprovedNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";
import { useCart } from "@/contexts/CartContext";
import { API_ENDPOINTS } from "@/config/api";

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'paid' | 'unpaid' | 'expired' | 'error'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  
  const maxPollAttempts = 10;
  const pollInterval = 2000; // 2 seconds

  useEffect(() => {
    if (!sessionId) {
      setPaymentStatus('error');
      return;
    }

    // Clear cart on mount
    clearCart();

    // Start polling for payment status
    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.checkoutStatus(sessionId));
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setPaymentStatus('paid');
        // Fetch full order details
        fetchOrderDetails();
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
      } else if (data.payment_status === 'unpaid') {
        // Continue polling if not reached max attempts
        if (pollAttempts < maxPollAttempts) {
          setPollAttempts(prev => prev + 1);
          setTimeout(pollPaymentStatus, pollInterval);
        } else {
          setPaymentStatus('unpaid');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (pollAttempts < maxPollAttempts) {
        setPollAttempts(prev => prev + 1);
        setTimeout(pollPaymentStatus, pollInterval);
      } else {
        setPaymentStatus('error');
      }
    }
  };

  const fetchOrderDetails = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.orderDetails(sessionId));
      
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const renderStatusContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
              </div>
              <CardTitle className="text-center text-2xl">Processing Payment...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Please wait while we confirm your payment. This may take a few moments.
              </p>
            </CardContent>
          </Card>
        );

      case 'paid':
        return (
          <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-center text-2xl text-green-900">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-green-800 font-medium">
                  Thank you for your order!
                </p>
                <p className="text-muted-foreground">
                  Your payment has been processed successfully. You will receive an order confirmation email shortly.
                </p>
              </div>

              {orderDetails && (
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{orderDetails.session_id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">${orderDetails.amount} {orderDetails.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{orderDetails.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{orderDetails.customer_email}</span>
                    </div>
                  </div>

                  {orderDetails.cart_items && orderDetails.cart_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-3">Items Ordered:</h4>
                      <div className="space-y-2">
                        {orderDetails.cart_items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  What's Next?
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Order confirmation email sent to your inbox</li>
                  <li>✓ We'll begin processing your order immediately</li>
                  <li>✓ You'll receive shipping updates via email</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Link to="/" className="flex-1">
                  <Button className="w-full" variant="outline">
                    Continue Shopping
                  </Button>
                </Link>
                <Link to="/contact" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      case 'unpaid':
        return (
          <Card className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-16 w-16 text-yellow-600" />
              </div>
              <CardTitle className="text-center text-2xl text-yellow-900">
                Payment Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Your payment is still being processed. Please check your email for confirmation or contact us if you need assistance.
              </p>
              <div className="flex gap-4">
                <Link to="/checkout" className="flex-1">
                  <Button className="w-full" variant="outline">
                    Try Again
                  </Button>
                </Link>
                <Link to="/contact" className="flex-1">
                  <Button className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      case 'expired':
      case 'error':
        return (
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-center text-2xl text-red-900">
                {paymentStatus === 'expired' ? 'Payment Session Expired' : 'Payment Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {paymentStatus === 'expired' 
                  ? 'Your payment session has expired. Please try placing your order again.'
                  : 'There was an error processing your payment. Please try again or contact support.'}
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Need Help?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Contact us at: <a href="mailto:acrylicbraillesigns@gmail.com" className="text-blue-600 hover:underline">acrylicbraillesigns@gmail.com</a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: <a href="tel:+16472782905" className="text-blue-600 hover:underline">+1 (647) 278-2905</a>
                </p>
              </div>
              <div className="flex gap-4">
                <Link to="/checkout" className="flex-1">
                  <Button className="w-full">
                    Try Again
                  </Button>
                </Link>
                <Link to="/contact" className="flex-1">
                  <Button className="w-full" variant="outline">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SEO
        title="Order Confirmation | Acrylic Braille Signs"
        description="Your order confirmation and payment status"
        canonical="/order-confirmation"
        type="website"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <ImprovedNavigation />
        
        <div className="container mx-auto px-4 py-16">
          {renderStatusContent()}
        </div>
        
        <ImprovedFooter />
      </div>
    </>
  );
};

export default OrderConfirmation;
