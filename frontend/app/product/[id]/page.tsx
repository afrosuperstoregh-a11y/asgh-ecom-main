'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Star, Truck, Shield, Plus, Minus, X, ZoomIn, ZoomOut, Play } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { useProduct, useProducts } from '@/hooks/useProducts';
import ProductVideo from '../../../components/ProductVideo';
import ProductInfo from '../../../components/ProductInfo';

import { Product } from '@/types/product';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { product, loading, error } = useProduct(productId as string);
  const { products: relatedProducts } = useProducts({ limit: 4 });

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      // Add the specified quantity to cart
      for (let i = 0; i < quantity; i++) {
        await addToCart({
          id: product.id.toString(),
          name: product.name,
          price: product.compare_price || product.price,
          image: product.image_url || product.image || '/placeholder-product.svg',
          category: product.categories?.name || 'Uncategorized'
        });
      }
      
      // Reset quantity to 1 after adding to cart
      setQuantity(1);
      
      setTimeout(() => setAddingToCart(false), 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < (product.inventory_quantity || 0)) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="text-red-800 mb-4">{error || 'Product not found'}</p>
            <button 
              onClick={() => router.push('/products')} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isInStock = product.inventory_quantity > 0 || product.allow_backorder;
  const displayPrice = product.compare_price || product.price;
  const originalPrice = product.compare_price ? product.price : null;
  
  // Handle images from Supabase Storage
  let images: string[] = [];
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    images = product.images;
  } else if (product.image_url) {
    images = [product.image_url];
  } else if (product.image) {
    images = [product.image];
  } else {
    images = ['/placeholder-product.svg'];
  }
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": images,
    "brand": {
      "@type": "Brand",
      "name": "Afro Superstore"
    },
    "offers": {
      "@type": "Offer",
      "price": displayPrice,
      "priceCurrency": "USD",
      "availability": isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Afro Superstore"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews || 0
    } : undefined,
    "sku": product.sku,
    "category": product.categories?.name
  };

  return (
    <ErrorBoundary>
      <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <Link href="/products" className="text-gray-500 hover:text-gray-700">
                  Products
                </Link>
              </li>
              <li>
                <span className="text-gray-500">/</span>
              </li>
              <li>
                <span className="text-gray-900">{product.name}</span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Media Gallery */}
            <div className="space-y-4">
              {/* Main Media Display */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden relative">
                {Array.isArray(product.videos) && product.videos.length > 0 && currentMediaIndex >= images.length ? (
                  <ProductVideo
                    src={product.videos[currentMediaIndex - images.length]}
                    poster={images[0] || '/placeholder-product.svg'}
                    title={product.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                    <Image
                      src={images[currentMediaIndex] || '/placeholder-product.svg'}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    {/* Zoom Icon Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                )}
              </div>

              {/* Media Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* Images */}
                {images.map((image: any, index: number) => (
                  <button
                    key={`img-${index}`}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentMediaIndex === index
                        ? 'border-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
                
                {/* Videos */}
                {Array.isArray(product.videos) && product.videos.map((video: any, index: number) => (
                  <button
                    key={`video-${index}`}
                    onClick={() => setCurrentMediaIndex(images.length + index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentMediaIndex === images.length + index
                        ? 'border-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <ProductInfo product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && product && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-7xl max-h-screen bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                onClick={() => setZoomedImageIndex(null)}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Image Gallery in Zoom */}
            <div className="flex gap-4 p-4 overflow-x-auto">
              {images.map((image: any, index: number) => (
                <div
                  key={`zoom-img-${index}`}
                  className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    zoomedImageIndex === index ? 'ring-4 ring-primary-600' : ''
                  }`}
                  onClick={() => setZoomedImageIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    width={400}
                    height={400}
                    className="max-w-md max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>
    </ErrorBoundary>
  );
}
