/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration
  turbopack: {},
  
  // Configure path aliases
  experimental: {
    // Enable experimental features if needed
  },
  
  // Enable React Strict Mode for better development practices
  reactStrictMode: true,
  
  
  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lljxxaejmueoxsaqaowf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'azpgqsmgyorjbqsgxuxw.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Enable image optimization for security and performance
    unoptimized: false,
    // Enable image formats
    formats: ['image/webp', 'image/avif'],
    // Image quality settings
    qualities: [75, 85],
    // Minimum cache TTL
    minimumCacheTTL: 60,
    // Enable SVG for placeholder images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://afrosuperstore.ca',
    NEXT_PUBLIC_BUILD_VERSION: process.env.BUILD_VERSION || Date.now().toString(),
  },
  
  // Configure webpack for serverless compatibility
  webpack: (config, { isServer, dev, webpack }) => {
    
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
    };
    
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

    // Force cache busting for development
    if (dev) {
      config.output.filename = config.output.filename.replace('.js', '.[contenthash].js');
      config.output.chunkFilename = config.output.chunkFilename.replace('.js', '.[contenthash].js');
    }
    
    return config;
  },
  
  // Disable production source maps for security
  productionBrowserSourceMaps: false,
  
  // Enable strict TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Vercel-compatible trailing slash
  trailingSlash: false,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  
  // Production deployment - no backend proxy needed
  // All API routes are handled by frontend
  
};

module.exports = nextConfig;
