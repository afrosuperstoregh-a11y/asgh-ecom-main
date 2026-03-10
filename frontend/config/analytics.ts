// Analytics and monitoring configuration

export const ANALYTICS_CONFIG = {
  // Google Analytics 4
  GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
  
  // Google Tag Manager (optional)
  GTM_ID: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || '',
  
  // Google Search Console Verification
  GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  
  // Performance monitoring
  PERFORMANCE: {
    // Sample rate for performance metrics (0.0 to 1.0)
    SAMPLE_RATE: 1.0,
    // Report to analytics service if true
    REPORT_TO_ANALYTICS: true,
    // Log to console in development
    DEBUG: process.env.NODE_ENV !== 'production',
  },
  
  // Error tracking
  ERROR_TRACKING: {
    ENABLED: true,
    // Sample rate for error tracking (0.0 to 1.0)
    SAMPLE_RATE: 1.0,
    // Ignore these error messages (regex patterns)
    IGNORE_PATTERNS: [
      /ResizeObserver loop limit exceeded/,
      /ResizeObserver loop completed with undelivered notifications/,
    ],
  },
  
  // Feature flags
  FEATURES: {
    // Enable/disable specific features
    TRACK_PAGE_VIEWS: true,
    TRACK_EVENTS: true,
    TRACK_ERRORS: true,
    TRACK_PERFORMANCE: true,
    TRACK_RESOURCE_TIMING: true,
  },
};

// Google Analytics event categories
export const EVENT_CATEGORIES = {
  USER: 'User',
  PRODUCT: 'Product',
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  SEARCH: 'Search',
  NAVIGATION: 'Navigation',  
  PERFORMANCE: 'Performance',
  ERROR: 'Error',
};

// Common event names
export const EVENTS = {
  // User events
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  
  // Product events
  VIEW_ITEM: 'view_item',
  VIEW_ITEM_LIST: 'view_item_list',
  VIEW_SEARCH_RESULTS: 'view_search_results',
  
  // Cart events
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  
  // Checkout events
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  PURCHASE: 'purchase',
  
  // Search events
  SEARCH: 'search',
  
  // Performance events
  LCP: 'largest_contentful_paint',
  FID: 'first_input_delay',
  CLS: 'cumulative_layout_shift',
  FCP: 'first_contentful_paint',
  TTFB: 'time_to_first_byte',
};

// E-commerce specific parameters
export const ECOMMERCE_PARAMS = {
  CURRENCY: 'USD',
  // Add more e-commerce specific parameters as needed
} as const;

// Performance metric thresholds
export const PERFORMANCE_THRESHOLDS = {
  // In milliseconds
  GOOD: 2000,
  NEEDS_IMPROVEMENT: 4000,
  // Anything above 4000ms is considered poor
  
  // For CLS (Cumulative Layout Shift)
  GOOD_CLS: 0.1,
  NEEDS_IMPROVEMENT_CLS: 0.25,
  
  // For FID (First Input Delay)
  GOOD_FID: 100,
  NEEDS_IMPROVEMENT_FID: 300,
} as const;
