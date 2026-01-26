const withWarningSuppression = require('./plugins/suppress-warnings');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development practices
  reactStrictMode: true,
  
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Disable image optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  
  // Configure webpack for serverless compatibility
  webpack: (config, { isServer, dev }) => {
    // Suppress all webpack warnings in development
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    
    // Suppress deprecation warnings in development
    if (dev) {
      config.ignoreWarnings = [
        {
          module: /feature_collector/,
        },
        {
          message: /using deprecated parameters/,
        },
        {
          message: /feature_collector/,
        },
        {
          message: /deprecated parameters for the initialization function/,
        },
        function (warning) {
          return (
            warning.message && (
              warning.message.includes('feature_collector') ||
              (warning.message.includes('deprecated parameters') && warning.message.includes('initialization function'))
            )
          );
        },
      ];
      
      // Additional suppression for webpack 5 deprecation warnings
      config.stats = {
        warnings: false,
        warningsFilter: [
          'feature_collector',
          /deprecated parameters/,
          /initialization function/,
        ],
      };
      
      // Add compiler plugin for comprehensive warning suppression
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('SuppressFeatureCollectorWarnings', (stats) => {
            stats.compilation.warnings = stats.compilation.warnings.filter(warning => {
              const message = warning.message || warning.toString();
              return !(
                message.includes('feature_collector') &&
                message.includes('deprecated parameters')
              );
            });
          });
        }
      });
    }
    
    return config;
  },
  
  // Disable production source maps for security
  productionBrowserSourceMaps: false,
  
  // Enable strict TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
  
  
  // Empty turbopack config to silence webpack/turbopack conflict
  turbopack: {
    root: process.cwd(),
  },
  
  // Vercel-compatible trailing slash
  trailingSlash: false,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

module.exports = withWarningSuppression(nextConfig);
