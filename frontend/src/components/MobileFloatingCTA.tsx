import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileFloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Action Menu */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        {isExpanded && (
          <div className="flex flex-col gap-3 mb-3">
            {/* Call Button */}
            <a
              href="tel:+16472782905"
              className="flex items-center gap-3 bg-white rounded-full shadow-lg p-4 pr-6 hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Call Us</span>
            </a>

            {/* Email Button */}
            <a
              href="mailto:acrylicbraillesigns@gmail.com"
              className="flex items-center gap-3 bg-white rounded-full shadow-lg p-4 pr-6 hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Email</span>
            </a>

            {/* Quote Button */}
            <a
              href="/contact"
              className="flex items-center gap-3 bg-white rounded-full shadow-lg p-4 pr-6 hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Get Quote</span>
            </a>
          </div>
        )}

        {/* Main Toggle Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-16 h-16 rounded-full shadow-2xl transition-all ${
            isExpanded 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
          }`}
        >
          {isExpanded ? (
            <X className="h-7 w-7" />
          ) : (
            <MessageCircle className="h-7 w-7" />
          )}
        </Button>
      </div>

      {/* Desktop Quick Contact Button - Bottom Right Corner */}
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <a href="/contact">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 rounded-full px-6 py-6 flex items-center gap-3"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="font-semibold">Get Quote</span>
          </Button>
        </a>
      </div>
    </>
  );
};

export default MobileFloatingCTA;
