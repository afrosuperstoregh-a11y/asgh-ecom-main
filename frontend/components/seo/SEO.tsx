'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import siteConfig from '@/lib/seo/config';

type SEOProps = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'profile' | 'book';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  structuredData?: any[];
  children?: ReactNode;
};

export default function SEO({
  title,
  description = siteConfig.description,
  canonicalUrl,
  imageUrl = siteConfig.defaultImage,
  imageAlt = siteConfig.defaultImageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  structuredData = [],
  children,
}: SEOProps) {
  const pathname = usePathname();
  const pageTitle = title ? `${title} | ${siteConfig.siteName}` : siteConfig.title;
  const url = canonicalUrl 
    ? new URL(canonicalUrl, siteConfig.siteUrl).toString()
    : `${siteConfig.siteUrl}${pathname || ''}`;

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={description} />
        <meta name="keywords" content={[...siteConfig.keywords, ...tags].join(', ')} />
        <meta name="author" content={siteConfig.organization.name} />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="theme-color" content={siteConfig.themeColor} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={type} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={imageAlt} />
        <meta property="og:site_name" content={siteConfig.siteName} />
        <meta property="og:locale" content={siteConfig.locale} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={siteConfig.twitterHandle} />
        <meta name="twitter:creator" content={siteConfig.twitterHandle} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={imageAlt} />

        {/* Canonical URL */}
        <link rel="canonical" href={url} />

        {/* Additional meta tags */}
        {publishedTime && (
          <meta property="article:published_time" content={publishedTime} />
        )}
        {modifiedTime && (
          <meta property="article:modified_time" content={modifiedTime} />
        )}
        {section && <meta property="article:section" content={section} />}
        {tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Structured Data */}
        {structuredData.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                structuredData.length === 1 ? structuredData[0] : structuredData
              ),
            }}
          />
        )}

        {/* Favicons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />

        {children}
      </Head>
    </>
  );
}
