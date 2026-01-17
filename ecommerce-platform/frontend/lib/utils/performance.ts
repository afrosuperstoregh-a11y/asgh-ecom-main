// Performance monitoring utilities

interface PerformanceMetrics {
  // Core Web Vitals
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  LCP: number; // Largest Contentful Paint
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte
  // Additional metrics
  FMP?: number; // First Meaningful Paint
  TTI?: number; // Time to Interactive
  TBT?: number; // Total Blocking Time
}

const METRICS_TO_TRACK: (keyof PerformanceMetrics)[] = [
  'CLS', 'FID', 'LCP', 'FCP', 'TTFB', 'FMP', 'TTI', 'TBT'
];

// Store metrics for batch reporting
let metrics: Partial<PerformanceMetrics> = {};
let isSending = false;

// Report metrics to your analytics service
const reportMetrics = async () => {
  if (isSending || Object.keys(metrics).length === 0) return;
  
  isSending = true;
  
  try {
    // Clone metrics to avoid race conditions
    const metricsToSend = { ...metrics };
    metrics = {};
    
    // In a real app, you would send this to your analytics service
    console.log('[Performance] Reporting metrics:', metricsToSend);
    
    // Example: Send to your analytics endpoint
    // await fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metricsToSend),
    // });
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.table(metricsToSend);
    }
  } catch (error) {
    console.error('Error reporting performance metrics:', error);
  } finally {
    isSending = false;
  }
};

// Schedule reporting with debounce
const scheduleReport = (() => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(reportMetrics, 1000); // Batch reports within 1s
  };
})();

// Track a performance metric
const trackMetric = (name: keyof PerformanceMetrics, value: number) => {
  metrics[name] = value;
  scheduleReport();
};

// Initialize Core Web Vitals tracking
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined' || !('performance' in window)) return;
  
  // Only track in production
  if (process.env.NODE_ENV !== 'production') return;
  
  // Use the web-vitals library if available
  if (typeof window.webVitals === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
      getCLS(trackMetric.bind(null, 'CLS'));
      getFID(trackMetric.bind(null, 'FID'));
      getLCP(trackMetric.bind(null, 'LCP'));
      getFCP(trackMetric.bind(null, 'FCP'));
      getTTFB(trackMetric.bind(null, 'TTFB'));
    });
  }
  
  // Track navigation timing
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const [navigationEntry] = performance.getEntriesByType('navigation');
      
      if (navigationEntry) {
        const navEntry = navigationEntry as PerformanceNavigationTiming;
        trackMetric('TTFB', navEntry.responseStart - navEntry.requestStart);
      }
      
      // Report any remaining metrics when page unloads
      window.addEventListener('beforeunload', reportMetrics);
    });
  }
};

// Track custom performance marks
const marks: Record<string, number> = {};

export const performanceMark = (name: string) => {
  if (typeof performance !== 'undefined') {
    marks[name] = performance.now();
    performance.mark(name);
  }
};

export const performanceMeasure = (name: string, startMark: string, endMark: string) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name);
      const duration = measures[measures.length - 1]?.duration;
      
      if (duration) {
        trackMetric(name as keyof PerformanceMetrics, duration);
        return duration;
      }
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e);
    }
  }
  
  // Fallback to simple calculation if Performance API is not available
  if (marks[startMark] && marks[endMark]) {
    const duration = marks[endMark] - marks[startMark];
    trackMetric(name as keyof PerformanceMetrics, duration);
    return duration;
  }
  
  return 0;
};

// Track page load performance
export const trackPageLoad = () => {
  if (typeof window === 'undefined') return;
  
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigationTiming) {
    const {
      domContentLoadedEventEnd,
      loadEventEnd,
      domComplete,
      domInteractive,
      responseStart,
      requestStart,
    } = navigationTiming;
    
    trackMetric('FCP', domContentLoadedEventEnd);
    trackMetric('LCP', loadEventEnd);
    trackMetric('TTI', domInteractive - requestStart);
    trackMetric('TBT', domComplete - domInteractive);
    trackMetric('TTFB', responseStart - requestStart);
  }
};

// Track resource timing
export const trackResourceTiming = () => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return;
  
  const resources = performance.getEntriesByType('resource');
  const resourceMetrics = resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    initiatorType: resource.initiatorType,
    transferSize: 'transferSize' in resource ? (resource as any).transferSize : 0,
    decodedBodySize: 'decodedBodySize' in resource ? (resource as any).decodedBodySize : 0,
  }));
  
  // Log or send resource timing data
  if (resourceMetrics.length > 0) {
    console.log('[Performance] Resource timing:', resourceMetrics);
    // In a real app, you might want to send this to your analytics service
    // fetch('/api/analytics/resource-timing', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(resourceMetrics),
    // });
  }
};
