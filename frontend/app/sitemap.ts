import { MetadataRoute } from 'next';
import generateSitemap from '@/lib/seo/generateSitemap';

// This function fetches your dynamic data
async function getSitemapData() {
  // In a real app, you would fetch these from your API or database
  // This is a placeholder - replace with actual data fetching logic
  const products: any[] = []; // Fetch products from your API
  const categories: any[] = []; // Fetch categories from your API
  const pages = ['/about', '/contact', '/privacy', '/terms'];

  return { products, pages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, pages } = await getSitemapData();
  
  return generateSitemap({
    products,
    pages,
  });
}
