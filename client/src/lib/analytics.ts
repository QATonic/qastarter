// Google Analytics integration
// Loads GA only if VITE_GA_TRACKING_ID environment variable is set

export function initializeAnalytics() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId) {
    console.log('Google Analytics: Tracking ID not configured');
    return;
  }

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${trackingId}', {
      page_path: window.location.pathname,
      send_page_view: true
    });
  `;
  document.head.appendChild(script2);

  console.log('Google Analytics initialized with ID:', trackingId);
}

// Track page views (for SPA navigation)
export function trackPageView(path: string) {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined' || !(window as any).gtag) {
    return;
  }

  (window as any).gtag('config', trackingId, {
    page_path: path,
  });
}

// Track custom events
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined' || !(window as any).gtag) {
    return;
  }

  (window as any).gtag('event', eventName, eventParams);
}
