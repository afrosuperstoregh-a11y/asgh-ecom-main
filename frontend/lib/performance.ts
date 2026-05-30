// Performance optimization utilities
import { useState, useCallback, useEffect } from 'react';

// Simple memoization function
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Debounce function for search inputs and other频繁 operations
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle function for scroll events and other frequent events
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

// Lazy loading utility for images
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  placeholder?: string
): void {
  if (placeholder) {
    imgElement.src = placeholder;
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '50px' }
  );
  
  imgElement.classList.add('lazy');
  observer.observe(imgElement);
}

// Virtual scrolling for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = throttle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps
  
  return {
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
    totalHeight: items.length * itemHeight
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTimer(name: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return duration;
    };
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  }
  
  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    });
    
    return result;
  }
  
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureAsync = async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const endTimer = monitor.startTimer(name);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  };
  
  const measureSync = <T>(name: string, fn: () => T): T => {
    const endTimer = monitor.startTimer(name);
    try {
      const result = fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  };
  
  return {
    measureAsync,
    measureSync,
    getMetrics: monitor.getMetrics.bind(monitor),
    getAllMetrics: monitor.getAllMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor)
  };
}

// Cache utility for API responses
export class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const apiCache = new ApiCache();

// Clean up expired cache entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 300000);

// Batch API calls utility
export function batchApiCalls<T>(
  calls: Array<() => Promise<T>>,
  batchSize: number = 5,
  delay: number = 100
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    let index = 0;
    
    const processBatch = async () => {
      const batch = calls.slice(index, index + batchSize);
      
      if (batch.length === 0) {
        resolve(results);
        return;
      }
      
      try {
        const batchResults = await Promise.all(batch.map(call => call()));
        results.push(...batchResults);
        index += batchSize;
        
        if (index < calls.length) {
          setTimeout(processBatch, delay);
        } else {
          resolve(results);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    processBatch();
  });
}

// Optimized pagination hook
export function useOptimizedPagination<T>({
  fetchPage,
  initialPage = 1,
  pageSize = 20
}: {
  fetchPage: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;
  initialPage?: number;
  pageSize?: number;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(
    debounce(async (page: number) => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchPage(page, pageSize);
        setData(result.data);
        setTotal(result.total);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }, 300),
    [fetchPage, pageSize]
  );
  
  useEffect(() => {
    fetchData(initialPage);
  }, [fetchData, initialPage]);
  
  const totalPages = Math.ceil(total / pageSize);
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      fetchData(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      fetchData(currentPage - 1);
    }
  };
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };
  
  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    total,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => fetchData(currentPage)
  };
}

// Image optimization utility
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // This would typically use a CDN or image optimization service
  // For now, just return the original src
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${params.toString()}`;
}
