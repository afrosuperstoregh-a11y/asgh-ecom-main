import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { initAnalytics, trackPageView, trackEvent, trackProductView, trackAddToCart, trackPurchase } from '@/lib/utils/analytics';
import { initPerformanceMonitoring, trackPageLoad, trackResourceTiming } from '@/lib/utils/performance';

type EventParams = Record<string, any>;

export const useAnalytics = () => {
  const router = useRouter();

  // Initialize analytics and performance monitoring
  useEffect(() => {
    // Only initialize in production
    if (process.env.NODE_ENV === 'production') {
      initAnalytics();
      initPerformanceMonitoring();
      
      // Track initial page load
      trackPageLoad();
      trackResourceTiming();
      
      // Set up route change tracking
      const handleRouteChange = (url: string) => {
        trackPageView(url, document.title);
        // Track performance for the new page
        setTimeout(() => {
          trackPageLoad();
          trackResourceTiming();
        }, 0);
      };

      // Track initial page
      trackPageView(window.location.pathname, document.title);
      
      // Add route change handlers
      router.events.on('routeChangeComplete', handleRouteChange);
      
      // Clean up
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
  }, [router.events]);

  // Track page view manually if needed
  const trackPage = useCallback((pageTitle: string, additionalParams: EventParams = {}) => {
    trackPageView(window.location.pathname, pageTitle);
    // Additional params could be logged separately if needed
  }, []);

  // Track custom event
  const trackCustomEvent = useCallback((eventName: string, params: EventParams = {}) => {
    trackEvent(eventName, params);
  }, []);

  // Track product view
  const trackProduct = useCallback((product: any) => {
    trackProductView(product);
  }, []);

  // Track add to cart
  const trackCartAddition = useCallback((product: any, quantity: number = 1) => {
    trackAddToCart(product, quantity);
  }, []);

  // Track purchase
  const trackOrder = useCallback((transaction: any, items: any[]) => {
    trackPurchase(transaction, items);
  }, []);

  // Track search queries
  const trackSearch = useCallback((searchQuery: string, resultCount: number = 0) => {
    trackEvent('search', {
      search_term: searchQuery,
      search_results: resultCount,
    });  
  }, []);

  // Track sign up/sign in
  const trackAuth = useCallback((method: 'sign_in' | 'sign_up', methodType: string = 'email') => {
    trackEvent(method, { method: methodType });
  }, []);

  return {
    trackPage,
    trackEvent: trackCustomEvent,
    trackProduct,
    trackCartAddition,
    trackOrder,
    trackSearch,
    trackAuth,
  };
};

export default useAnalytics;
