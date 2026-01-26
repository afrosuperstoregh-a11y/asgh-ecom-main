// Suppress specific development warnings
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('feature_collector') &&
      message.includes('deprecated parameters')
    ) {
      return; // Suppress this specific warning
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('feature_collector') &&
      message.includes('deprecated parameters')
    ) {
      return; // Suppress this specific warning
    }
    originalConsoleError.apply(console, args);
  };
}
