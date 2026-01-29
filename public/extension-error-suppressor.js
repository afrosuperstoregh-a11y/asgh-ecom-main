// Browser Extension Error Suppression
// This script suppresses common browser extension errors that don't affect functionality

(function() {
  'use strict';
  
  // List of error messages to suppress
  const suppressedErrors = [
    'Cannot destructure property \'url\' of \'n\' as it is undefined',
    'using deprecated parameters for the initialization function',
    'NAVIGATE_COMPLETE',
    'background.js',
    'feature_collector.js'
  ];
  
  // Override console.error and console.warn to filter out extension errors
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check if this is a browser extension error we want to suppress
    const isExtensionError = suppressedErrors.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (!isExtensionError) {
      // Log the error normally if it's not from extensions
      originalConsoleError.apply(console, args);
    } else {
      // Silently ignore extension errors
      // You can uncomment the line below to see suppressed errors in development
      // console.debug('[Extension Error Suppressed]', message);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Check if this is a browser extension warning we want to suppress
    const isExtensionWarning = suppressedErrors.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (!isExtensionWarning) {
      // Log the warning normally if it's not from extensions
      originalConsoleWarn.apply(console, args);
    } else {
      // Silently ignore extension warnings
      // console.debug('[Extension Warning Suppressed]', message);
    }
  };
  
  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason?.message || event.reason || '';
    
    const isExtensionError = suppressedErrors.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (isExtensionError) {
      event.preventDefault(); // Prevent the error from showing in console
    }
  });
  
  // Log that extension error suppression is active
  console.log('🛡️ Browser extension error suppression active');
  
})();
