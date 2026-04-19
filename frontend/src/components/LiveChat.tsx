import { useEffect } from 'react';

// Tawk.to Live Chat Integration
// Free, professional live chat widget

const LiveChat = () => {
  useEffect(() => {
    // Tawk.to script - Replace with your actual Tawk.to Property ID
    const tawkToPropertyId = ''; // Get from tawk.to dashboard
    const tawkToKey = ''; // Get from tawk.to dashboard
    
    // Only load if IDs are configured — silent no-op otherwise
    if (!tawkToPropertyId || !tawkToKey) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkToPropertyId}/${tawkToKey}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    document.body.appendChild(script);

    // Cleanup
    return () => {
      const tawkScript = document.querySelector(`script[src*="tawk.to"]`);
      if (tawkScript) {
        document.body.removeChild(tawkScript);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default LiveChat;

/* 
SETUP INSTRUCTIONS:
1. Sign up at https://www.tawk.to (FREE)
2. Create a property for your website
3. Get your Property ID and Widget ID
4. Add them to .env:
   VITE_TAWK_PROPERTY_ID=your_property_id
   VITE_TAWK_WIDGET_ID=your_widget_id
5. Update the component to use env variables:
   const tawkToPropertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
   const tawkToKey = import.meta.env.VITE_TAWK_WIDGET_ID;

Features:
- Free forever
- Mobile responsive
- Unlimited agents
- Visitor monitoring
- Chat history
- File sharing
- Triggers & shortcuts
*/
