// Google Analytics 4 Measurement ID from environment variables
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: Record<string, any>[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Load the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize the data layer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    // Configure GA
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
      send_page_view: true,
    });

    // Enable enhanced measurement for automatic events
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      page_title: document.title,
      page_path: window.location.pathname,
      // Enhanced measurement features
      allow_google_signals: true,
      allow_ad_personalization_signals: true,
      anonymize_ip: true,
    });
  }
};

// Track page views
export const trackPageView = (url: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: title,
      page_path: url,
      send_to: GA_MEASUREMENT_ID,
    });
  }
};

// Track custom events
export const trackEvent = (action: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      ...params,
      send_to: GA_MEASUREMENT_ID,
    });
  }
};

// E-commerce specific events
export const trackProductView = (product: any) => {
  trackEvent('view_item', {
    currency: 'USD',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_brand: product.brand || 'Your Brand',
      item_category: product.category || 'General',
    }],
  });
};

export const trackAddToCart = (product: any, quantity: number = 1) => {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity,
    }],
  });
};

export const trackPurchase = (transaction: any, items: any[]) => {
  trackEvent('purchase', {
    transaction_id: transaction.id,
    value: transaction.total,
    tax: transaction.tax,
    shipping: transaction.shipping,
    currency: 'USD',
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};
