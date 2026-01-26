// Suppress specific development warnings
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  
  // Override all console methods to catch the warning
  const shouldSuppress = (...args) => {
    const message = args.join(' ').toLowerCase();
    return message.includes('feature_collector') && message.includes('deprecated');
  };
  
  console.warn = (...args) => {
    if (shouldSuppress(...args)) return;
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    if (shouldSuppress(...args)) return;
    originalConsoleError.apply(console, args);
  };
  
  console.log = (...args) => {
    if (shouldSuppress(...args)) return;
    originalConsoleLog.apply(console, args);
  };
  
  // Also override the global error handler
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && shouldSuppress(message)) {
      return true; // Prevent the error from being logged
    }
    if (originalError) {
      return originalError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Override unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (event.reason && typeof event.reason === 'string' && shouldSuppress(event.reason)) {
      event.preventDefault();
      return;
    }
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(window, event);
    }
  };
}
