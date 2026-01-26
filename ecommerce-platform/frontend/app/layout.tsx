import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";
import { AuthProvider } from "../contexts/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Script from "next/script";

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        {/* Preconnect to important third-party domains */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/asca-logo.png" as="image" />
        <link rel="preload" href="/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
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
      <body className={`${inter.className} min-h-screen bg-gray-50 antialiased overflow-x-hidden`}>
        {/* Suppress development warnings */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            id="suppress-warnings"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const originalWarn = console.warn;
                  const originalError = console.error;
                  const originalLog = console.log;
                  
                  const shouldSuppress = (...args) => {
                    const message = args.join(' ').toLowerCase();
                    return message.includes('feature_collector') && message.includes('deprecated');
                  };
                  
                  console.warn = (...args) => {
                    if (shouldSuppress(...args)) return;
                    originalWarn.apply(console, args);
                  };
                  
                  console.error = (...args) => {
                    if (shouldSuppress(...args)) return;
                    originalError.apply(console, args);
                  };
                  
                  console.log = (...args) => {
                    if (shouldSuppress(...args)) return;
                    originalLog.apply(console, args);
                  };
                  
                  const originalError = window.onerror;
                  window.onerror = (message, source, lineno, colno, error) => {
                    if (typeof message === 'string' && shouldSuppress(message)) {
                      return true;
                    }
                    if (originalError) {
                      return originalError.call(window, message, source, lineno, colno, error);
                    }
                    return false;
                  };
                })();
              `,
            }}
          />
        )}
        <AuthProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
