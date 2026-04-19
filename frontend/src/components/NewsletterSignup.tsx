import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

const NewsletterSignup = ({ 
  variant = "default",
  className = ""
}: { 
  variant?: "default" | "inline" | "footer";
  className?: string;
}) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      // Backend URL - use env variable or fallback to Emergent backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                         import.meta.env.REACT_APP_BACKEND_URL || 
                         'https://checkout-flow-176.preview.emergentagent.com';

      const response = await fetch(
        `${backendUrl}/api/newsletter/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email,
            source: 'website',
            subscribed_at: new Date().toISOString()
          }),
        }
      );

      if (response.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Check your email for exclusive offers.");
        setEmail("");
        
        // Reset after 5 seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setStatus("error");
      setMessage("Oops! Something went wrong. Please try again.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    }
  };

  if (variant === "inline") {
    return (
      <div className={`bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-8 text-white ${className}`}>
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Get Exclusive Offers</h3>
          <p className="mb-6 text-cyan-50">
            Subscribe to receive ADA compliance tips, product updates, and special discounts!
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white text-gray-900 h-12"
              disabled={status === "loading" || status === "success"}
            />
            <Button 
              type="submit" 
              size="lg"
              disabled={status === "loading" || status === "success"}
              className="bg-white text-cyan-600 hover:bg-gray-100"
            >
              {status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed!" : "Subscribe"}
            </Button>
          </form>

          {message && (
            <p className={`mt-3 text-sm ${status === "success" ? "text-green-200" : "text-red-200"}`}>
              {status === "success" && <CheckCircle className="inline h-4 w-4 mr-1" />}
              {status === "error" && <AlertCircle className="inline h-4 w-4 mr-1" />}
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={className}>
        <h4 className="font-semibold mb-3">Newsletter</h4>
        <p className="text-sm mb-4">Get updates on new products and special offers</p>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
            disabled={status === "loading" || status === "success"}
          />
          <Button 
            type="submit"
            className="w-full"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? "..." : status === "success" ? "Subscribed!" : "Subscribe"}
          </Button>
        </form>

        {message && (
          <p className={`mt-2 text-xs ${status === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`border-2 border-cyan-500 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6 text-cyan-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Stay Updated</h3>
          <p className="text-sm text-gray-600 mb-4">
            Subscribe for ADA tips, new products, and exclusive discounts
          </p>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={status === "loading" || status === "success"}
            />
            <Button 
              type="submit"
              disabled={status === "loading" || status === "success"}
            >
              {status === "success" ? <CheckCircle className="h-4 w-4" /> : "Subscribe"}
            </Button>
          </form>

          {message && (
            <p className={`mt-2 text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterSignup;
