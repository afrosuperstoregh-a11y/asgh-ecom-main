import { Metadata } from 'next';
import { Product } from '@/types/product';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products/${id}`);
    if (!response.ok) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }
    
    const result = await response.json();
    const product = result.data;
    
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }

    const images = product.images || [product.image];
    const price = product.compare_price || product.price;

    return {
      title: product.name,
      description: product.description || `Shop ${product.name} at Afro Superstore`,
      keywords: [
        product.name,
        product.category?.name || 'African products',
        'Afro Superstore',
        'shopping',
        'e-commerce'
      ].filter(Boolean),
      openGraph: {
        title: product.name,
        description: product.description || `Shop ${product.name} at Afro Superstore`,
        images: images.map((img: string) => ({
          url: img,
          width: 800,
          height: 600,
          alt: product.name,
        })),
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || `Shop ${product.name} at Afro Superstore`,
        images: images,
      },
      alternates: {
        canonical: `/product/${id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product',
      description: 'Product details',
    };
  }
}
