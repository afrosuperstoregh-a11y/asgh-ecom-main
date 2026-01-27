// Custom Next.js plugin to suppress feature_collector warnings
const withWarningSuppression = (nextConfig = {}) => {
  return {
    ...nextConfig,
    webpack: (config, options) => {
      // Apply user's webpack config first
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options);
      }
      
      // Add our warning suppression
      if (options.dev) {
        config.plugins = config.plugins || [];
        
        // Add a custom plugin to suppress warnings
        config.plugins.push({
          apply: (compiler) => {
            // Suppress console warnings at the compiler level
            compiler.hooks.beforeCompile.tap('SuppressWarnings', () => {
              const originalWarn = console.warn;
              const originalError = console.error;
              
              const shouldSuppress = (...args) => {
                const message = args.join(' ').toLowerCase();
                return message.includes('feature_collector') && 
                       (message.includes('deprecated') || 
                        message.includes('initialization') ||
                        message.includes('single object'));
              };
              
              console.warn = (...args) => {
                if (shouldSuppress(...args)) return;
                originalWarn.apply(console, args);
              };
              
              console.error = (...args) => {
                if (shouldSuppress(...args)) return;
                originalError.apply(console, args);
              };
            });
            
            // Filter warnings after compilation
            compiler.hooks.done.tap('SuppressWarnings', (stats) => {
              if (stats.compilation && stats.compilation.warnings) {
                stats.compilation.warnings = stats.compilation.warnings.filter(warning => {
                  const message = warning.message || warning.toString();
                  return !(
                    message.includes('feature_collector') ||
                    message.includes('deprecated parameters') ||
                    message.includes('pass a single object')
                  );
                });
              }
            });
          }
        });
      }
      
      return config;
    }
  };
};

module.exports = withWarningSuppression;
