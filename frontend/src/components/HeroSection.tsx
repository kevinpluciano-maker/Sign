import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Handle video load success
      const handleCanPlay = () => {
        console.log('Video can play');
        setVideoLoaded(true);
      };

      // Handle video errors
      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setVideoError(true);
      };

      // Attempt to play video with retry logic
      const playVideo = async () => {
        try {
          // Ensure video is muted (required for autoplay)
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          
          // Load the video
          video.load();
          
          // Wait a bit for video to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try to play
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Hero video playing successfully');
                setVideoLoaded(true);
              })
              .catch((error) => {
                console.warn('Initial autoplay failed, retrying...', error);
                // Retry after a short delay
                setTimeout(async () => {
                  try {
                    video.muted = true;
                    await video.play();
                    console.log('Hero video playing after retry');
                    setVideoLoaded(true);
                  } catch (retryError) {
                    console.error('Video autoplay failed after retry:', retryError);
                    // Don't set error - video might still work on user interaction
                  }
                }, 500);
              });
          }
        } catch (error) {
          console.error('Video setup failed:', error);
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(playVideo, 100);

      // Also try to play on user interaction (for strict browsers)
      const handleUserInteraction = () => {
        if (video.paused) {
          video.muted = true;
          video.play().catch(() => {});
        }
      };

      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('scroll', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });

      return () => {
        clearTimeout(timeoutId);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, []);

  // Fallback background image in case video fails
  const fallbackBgStyle = videoError ? {
    backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    backgroundSize: 'cover'
  } : {};

  return (
    <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] md:min-h-[600px] overflow-hidden" id="main-content" style={fallbackBgStyle}>
      {/* Video Background - High quality rendering */}
      {!videoError && (
        <div className="absolute inset-0 hero-video-container" style={{ zIndex: 0 }}>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            preload="auto"
            className="hero-video"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              // Ensure video is visible
              opacity: 1,
              zIndex: 0
            }}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          >
            {/* Primary source - CDN for reliable cross-platform delivery */}
            <source src="https://files.catbox.moe/1ahutt.mp4" type="video/mp4" />
            {/* Fallback to local video */}
            <source src="/hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      
      {/* Luxurious gradient overlay - Reduced opacity to show video better */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 md:from-black/20 md:via-black/10 md:to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/8 to-transparent md:via-black/5" />

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