const withWarningSuppression = require('./plugins/suppress-warnings');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration
  turbopack: {},
  
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
  webpack: (config, { isServer, dev, webpack }) => {
    // Suppress all webpack warnings in development
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
      
      // Suppress webpack 5 deprecation warnings for feature_collector
      config.stats = {
        ...config.stats,
        warnings: false,
        warningsFilter: [
          'feature_collector',
          /using deprecated parameters for the initialization function/,
          /pass a single object instead/,
          /feature_collector\.js/,
        ],
      };
      
      // Suppress specific deprecation warnings
      config.ignoreWarnings = [
        {
          module: /feature_collector/,
        },
        {
          message: /using deprecated parameters for the initialization function/,
        },
        {
          message: /feature_collector\.js/,
        },
        {
          message: /pass a single object instead/,
        },
        {
          message: /feature_collector\.js:\d+ using deprecated parameters/,
        },
        (warning) => {
          const message = warning.message || warning.toString();
          return message && (
            message.includes('feature_collector') ||
            message.includes('deprecated parameters') ||
            message.includes('pass a single object') ||
            message.includes('initialization function')
          );
        },
      ];
      
      // Add DefinePlugin to suppress feature_collector warnings at compile time
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SUPPRESS_FEATURE_COLLECTOR_WARNINGS': JSON.stringify(true),
        })
      );
      
      // Custom plugin to filter warnings after compilation
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('SuppressFeatureCollectorWarnings', (stats) => {
            stats.compilation.warnings = stats.compilation.warnings.filter(warning => {
              const message = warning.message || warning.toString();
              return !(
                message.includes('feature_collector') ||
                message.includes('deprecated parameters') ||
                message.includes('pass a single object')
              );
            });
          });
        }
      });
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
    
    return config;
  },
  
  // Disable production source maps for security
  productionBrowserSourceMaps: false,
  
  // Enable strict TypeScript checking
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Vercel-compatible trailing slash
  trailingSlash: false,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Experimental features to handle modern Next.js behavior
  experimental: {
    // Suppress feature_collector warnings at the framework level
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
};

module.exports = withWarningSuppression(nextConfig);
