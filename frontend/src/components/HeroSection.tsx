import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Video sources — local-first for reliability (eliminates ERR_NAME_NOT_RESOLVED
   // when the preview CDN host is unreachable). CDN reserved as secondary fallback.
  const VIDEO_LOCAL_URL = "/hero-video.mp4";
  const VIDEO_CDN_URL = "https://customer-assets.emergentagent.com/job_codebrowser-1/artifacts/7ojfcx81_202509051609%20(1)%20(1).mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force video attributes for autoplay on all browsers
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const attemptPlay = async () => {
      try {
        // Small delay to ensure video is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await video.play();
        setVideoReady(true);
      } catch (err) {
        // Autoplay blocked — retry on first user interaction (silent, expected)
        const playOnInteraction = () => {
          if (video.paused) {
            video.muted = true;
            video.play().then(() => {
              setVideoReady(true);
            }).catch(() => { /* ignore — non-critical */ });
          }
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('scroll', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
        document.addEventListener('mousemove', playOnInteraction, { once: true });

        // Cleanup function
        return () => {
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('scroll', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };
      }
    };

    const handleLoadedData = () => {
      attemptPlay();
    };

    const handleError = () => {
      // If local fails, try CDN as fallback; otherwise give up silently.
      if (video.src.includes(VIDEO_LOCAL_URL) && !video.src.includes('customer-assets')) {
        video.src = VIDEO_CDN_URL;
        video.load();
      } else {
        setVideoError(true);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', attemptPlay);

    // Force load
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', attemptPlay);
    };
  }, []);

  return (
    <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] md:min-h-[600px] overflow-hidden" id="main-content">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{
              objectFit: 'cover',
              minWidth: '100%',
              minHeight: '100%'
            }}
          >
            {/* Local source — fast, reliable, always available */}
            <source src={VIDEO_LOCAL_URL} type="video/mp4" />
            {/* CDN fallback */}
            <source src={VIDEO_CDN_URL} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent" />

      {/* Hero Content - Absolutely positioned for consistent centering across all environments */}
      <div 
        className="absolute inset-0 z-[5] flex items-center justify-center"
      >
        <div 
          className="container mx-auto px-6 text-center text-white"
          style={{
            // Offset downward to account for header+nav overlay and center content visually
            // Using transform for consistent behavior across build environments
            transform: 'translateY(60px)',
            maxWidth: '1200px'
          }}
        >
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] text-white"
            style={{
              fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              letterSpacing: '-0.01em',
              textShadow: '0 3px 15px rgba(0,0,0,0.8), 0 0 30px rgba(79,195,247,0.3)'
            }}
          >
            Professional Acrylic Braille Signs
          </h1>
          <p 
            className="text-lg md:text-xl lg:text-xl mb-8 text-white max-w-4xl mx-auto leading-relaxed"
            style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: '400',
              letterSpacing: '0.005em',
              textShadow: '0 2px 8px rgba(0,0,0,0.7)',
              lineHeight: '1.5'
            }}
          >
            Professional quality door signs, restroom signs, and custom architectural signage for modern workspaces.
          </p>
          <div className="flex justify-center">
            <Link to="/products">
              <Button 
                size="lg" 
                className="group relative overflow-hidden px-10 py-3.5 text-base font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4FC3F7 0%, #2196F3 100%)',
                  color: '#ffffff',
                  border: '2px solid rgba(79,195,247,0.25)',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(79,195,247,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2196F3 0%, #4FC3F7 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,195,247,0.35), inset 0 1px 0 rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4FC3F7 0%, #2196F3 100%)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,195,247,0.25), inset 0 1px 0 rgba(255,255,255,0.35)';
                }}
                aria-label="Browse our complete ADA compliant braille signage collection"
              >
                <ShoppingBag className="h-5 w-5 mr-2.5" aria-hidden="true" />
                View All Products
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Luxurious scroll indicator - Hidden on mobile to avoid line */}
      <div 
        className="hidden md:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce opacity-70"
        aria-label="Scroll down to see more content"
        role="button"
        tabIndex={0}
        style={{
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))'
        }}
      >
        <div className="w-7 h-11 border-2 border-white/50 rounded-full flex justify-center relative">
          <div className="w-1 h-3.5 bg-gradient-to-b from-white to-white/50 rounded-full mt-2.5 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;