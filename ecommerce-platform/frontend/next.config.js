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
        function (warning) {
          return (
            warning.message.includes('feature_collector') &&
            warning.message.includes('deprecated parameters')
          );
        },
        function (warning) {
          return warning.message && warning.message.includes('feature_collector');
        },
      ];
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
