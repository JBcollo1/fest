import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cookiesBlocked, setCookiesBlocked] = useState(false);

  useEffect(() => {
    const checkCookieSupport = () => {
      try {
        // Test if cookies can be set and read
        document.cookie = 'cookie_test=1; SameSite=Lax; path=/; Secure';
        const cookiesEnabled = document.cookie.includes('cookie_test');
        document.cookie = 'cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        
        const hasConsent = document.cookie.includes('cookie_consent=true') || 
                          localStorage.getItem('cookieConsent');
        
        setCookiesBlocked(!cookiesEnabled);
        setIsVisible(!hasConsent && cookiesEnabled);
      } catch (e) {
        setCookiesBlocked(true);
        setIsVisible(true);
      }
    };

    checkCookieSupport();
  }, []);

  const handleAccept = () => {
    try {
      // Set cookie with 1 year expiration, Secure and SameSite attributes
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      document.cookie = `cookie_consent=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=None; Secure`;
      
      // Fallback to localStorage
      localStorage.setItem('cookieConsent', 'true');
      
      // Force reload to apply cookie settings application-wide
      window.location.reload();
    } catch (e) {
      console.error('Cookie storage failed:', e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 z-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm flex-1 text-center md:text-left">
          {cookiesBlocked ? (
            <span className="text-yellow-300">
              Please enable cookies and disable tracking protection for this site to function properly.
            </span>
          ) : (
            "This site requires cookies for authentication and security purposes. We never track personal data."
          )}
        </p>
        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={handleAccept}
            className="bg-accent text-black font-medium px-8 py-3 
                     w-full md:w-40 hover:bg-accent-dark transition-colors
                     duration-200 rounded-lg disabled:opacity-50"
            disabled={cookiesBlocked}
          >
            {cookiesBlocked ? 'Cookies Blocked' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;