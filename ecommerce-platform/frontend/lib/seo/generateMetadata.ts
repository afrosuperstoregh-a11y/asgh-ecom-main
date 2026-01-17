import { Metadata } from 'next';
import siteConfig from './config';

type PageMetadata = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'profile' | 'book';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
};

export function generateMetadata({
  title,
  description = siteConfig.description,
  canonicalUrl = '',
  imageUrl = siteConfig.defaultImage,
  imageAlt = siteConfig.defaultImageAlt,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}: PageMetadata = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.siteName}` : siteConfig.title;
  const url = canonicalUrl 
    ? new URL(canonicalUrl, siteConfig.siteUrl).toString()
    : siteConfig.siteUrl;
  
  const metadata: Metadata = {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: siteConfig.siteName,
      images: [
        {
          url: new URL(imageUrl, siteConfig.siteUrl).toString(),
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      locale: siteConfig.locale,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      creator: siteConfig.twitterHandle,
      images: [new URL(imageUrl, siteConfig.siteUrl).toString()],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    keywords: [...siteConfig.keywords, ...tags],
  };

  return metadata;
}

export default generateMetadata;
