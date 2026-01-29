import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { AuthProvider } from "../contexts/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Afro Superstore - Your Online Shopping Destination",
  description: "Discover amazing products at Afro Superstore. Quality items, great prices, and exceptional service.",
  keywords: ["ecommerce", "online shopping", "premium products", "afro superstore"],
  authors: [{ name: "Afro Superstore" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        {/* Early suppression script - must run before any analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Aggressive early suppression of deprecated analytics messages
              (function() {
                const originalConsole = {
                  log: console.log,
                  warn: console.warn,
                  error: console.error,
                  info: console.info,
                  debug: console.debug
                };
                
                function shouldSuppress(args) {
                  const message = args[0];
                  if (typeof message === 'string') {
                    return message.includes('feature_collector.js') || 
                           (message.includes('deprecated') && message.includes('parameters'));
                  }
                  return false;
                }
                
                Object.keys(originalConsole).forEach(method => {
                  console[method] = function(...args) {
                    if (shouldSuppress(args)) {
                      // Silently suppress
                      return;
                    }
                    return originalConsole[method].apply(console, args);
                  };
                });
                
                // Override window.onerror for script errors
                const originalOnError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (typeof message === 'string' && message.includes('feature_collector.js')) {
                    return true; // Suppress the error
                  }
                  return originalOnError ? originalOnError.call(window, message, source, lineno, colno, error) : false;
                };
                
                console.log('🔍 Analytics: Early aggressive suppression active');
              })();
            `,
          }}
        />
        
        {/* Preconnect to important third-party domains */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/asca-logo.png" as="image" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Afro Superstore',
              url: 'https://www.afrosuperstore.ca',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.afrosuperstore.ca/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-gray-50 antialiased overflow-x-hidden`}>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
      {process.env.NODE_ENV === 'production' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </html>
  );
}
