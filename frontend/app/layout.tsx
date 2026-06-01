import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { SupabaseAuthProvider } from "../contexts/SupabaseAuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Script from "next/script";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Fix font preloading warning
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
        {/* Preconnect to important third-party domains */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-gray-50 antialiased overflow-x-hidden`}
            suppressHydrationWarning={true}>
        <SupabaseAuthProvider>
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
        </SupabaseAuthProvider>
        
        {/* Google Analytics - Production Only */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: true,
                  debug_mode: false
                });
              `}
            </Script>
          </>
        )}
        
        {/* Structured Data - Safe JSON-LD */}
        <script
          type="application/ld+json"
          suppressHydrationWarning={true}
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
      </body>
    </html>
  );
}
