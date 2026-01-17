import { MetadataRoute } from 'next';
import { Product, Category } from '@/types';
import siteConfig from './config';

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
};

type SitemapData = {
  products?: Product[];
  categories?: Category[];
  pages?: string[];
};

export default async function generateSitemap({
  products = [],
  categories = [],
  pages = [],
}: SitemapData = {}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl;
  const now = new Date().toISOString();

  // Static routes
  const staticRoutes: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic product routes
  const productRoutes: SitemapEntry[] = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic category routes
  const categoryRoutes: SitemapEntry[] = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Additional pages
  const additionalPages: SitemapEntry[] = pages.map((page) => ({
    url: `${baseUrl}${page.startsWith('/') ? '' : '/'}${page}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Combine all routes
  const allRoutes = [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...additionalPages,
  ];

  // Filter out any undefined or invalid URLs
  return allRoutes.filter((route) => {
    try {
      new URL(route.url);
      return true;
    } catch (e) {
      console.warn(`Invalid URL in sitemap: ${route.url}`);
      return false;
    }
  });
}

export function generateSitemapXml(sitemap: MetadataRoute.Sitemap): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
      ${sitemap
        .map(
          (entry) => `
        <url>
          <loc>${entry.url}</loc>
          ${
            entry.lastModified
              ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
              : ''
          }
          ${
            entry.changeFrequency
              ? `<changefreq>${entry.changeFrequency}</changefreq>`
              : ''
          }
          ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
        </url>`
        )
        .join('')}
    </urlset>`;
}
