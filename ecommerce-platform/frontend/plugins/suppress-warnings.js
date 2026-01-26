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
            compiler.hooks.compilation.tap('SuppressWarnings', (compilation) => {
              compilation.hooks.processAssets.tap(
                {
                  name: 'SuppressWarnings',
                  stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
                },
                () => {
                  // Suppress warnings during asset processing
                }
              );
            });
            
            // Suppress console warnings
            compiler.hooks.beforeCompile.tap('SuppressWarnings', () => {
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = (...args) => {
                  const message = args.join(' ').toLowerCase();
                  if (message.includes('feature_collector') && message.includes('deprecated')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
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
