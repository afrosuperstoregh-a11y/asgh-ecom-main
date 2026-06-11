/**
 * Production Image Diagnostics
 * 
 * Tracks image loading failures and provides diagnostic information
 * for debugging production issues.
 */

interface ImageDiagnostics {
  totalRequests: number;
  successfulLoads: number;
  failedLoads: number;
  failures: Array<{
    url: string;
    productId?: string;
    productName?: string;
    timestamp: number;
    error?: string;
  }>;
}

class ImageDiagnosticsTracker {
  private diagnostics: ImageDiagnostics = {
    totalRequests: 0,
    successfulLoads: 0,
    failedLoads: 0,
    failures: [],
  };

  trackRequest(): void {
    this.diagnostics.totalRequests++;
  }

  trackSuccess(): void {
    this.diagnostics.successfulLoads++;
  }

  trackFailure(url: string, productId?: string, productName?: string, error?: string): void {
    this.diagnostics.failedLoads++;
    this.diagnostics.failures.push({
      url,
      productId,
      productName,
      timestamp: Date.now(),
      error,
    });

    // Keep only last 50 failures to prevent memory issues
    if (this.diagnostics.failures.length > 50) {
      this.diagnostics.failures.shift();
    }
  }

  getReport(): ImageDiagnostics {
    return { ...this.diagnostics };
  }

  reset(): void {
    this.diagnostics = {
      totalRequests: 0,
      successfulLoads: 0,
      failedLoads: 0,
      failures: [],
    };
  }

  getFailureRate(): number {
    if (this.diagnostics.totalRequests === 0) return 0;
    return (this.diagnostics.failedLoads / this.diagnostics.totalRequests) * 100;
  }
}

// Global tracker instance
const tracker = new ImageDiagnosticsTracker();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__imageDiagnostics = {
    report: () => tracker.getReport(),
    reset: () => tracker.reset(),
    getFailureRate: () => tracker.getFailureRate(),
  };
}

export { tracker, ImageDiagnosticsTracker };
export type { ImageDiagnostics };
