declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

// Google Analytics integration
// Loads GA only if VITE_GA_TRACKING_ID environment variable is set

export function initializeAnalytics() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId) {
    console.log('Google Analytics: Tracking ID not configured');
    return;
  }

  // Validate tracking ID format to prevent XSS via innerHTML injection (H6 fix)
  if (!/^(G|UA|GT|AW)-[A-Za-z0-9-]+$/.test(trackingId)) {
    console.warn('Google Analytics: Invalid tracking ID format, skipping initialization');
    return;
  }

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script1);

  // Initialize gtag using the recommended dataLayer pattern
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', trackingId, {
    page_path: window.location.pathname,
    send_page_view: true,
  });

  console.log('Google Analytics initialized with ID:', trackingId);
}

// Track page views (for SPA navigation)
export function trackPageView(path: string) {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag?.('config', trackingId, {
    page_path: path,
  });
}

// Track custom events
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (!trackingId || typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag?.('event', eventName, eventParams);
}
