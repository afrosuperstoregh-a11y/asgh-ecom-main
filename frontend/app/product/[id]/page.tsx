'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Star, Truck, Shield, Plus, Minus, X, ZoomIn, ZoomOut, Play } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { useProduct, useProducts } from '@/hooks/useSupabaseData';
import ProductVideo from '../../../components/ProductVideo';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  sku: string;
  status: string;
  featured: boolean;
  stock: number;
  images: string[];
  videos?: string[]; // Add videos field
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  _count: {
    orderItems: number;
  };
  // Additional fields for frontend compatibility
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  discountPrice?: number;
}

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
      
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.compare_price || product.price,
        image: product.image || '/placeholder-product.svg',
        category: product.categories?.name || 'Uncategorized'
      });
      
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
  const images = Array.isArray(product.images) ? product.images : [product.image];

  return (
    <>
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
                {product.videos && product.videos.length > 0 && currentMediaIndex >= images.length ? (
                  <ProductVideo
                    src={product.videos[currentMediaIndex - images.length]}
                    poster={images[0] || '/placeholder-product.svg'}
                    title={product.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                    <img
                      src={images[currentMediaIndex] || '/placeholder-product.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
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
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                
                {/* Videos */}
                {product.videos && product.videos.map((video: any, index: number) => (
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
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-500 ml-2">({product.reviews || 0} reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-3xl font-bold text-gray-900">${displayPrice}</span>
                  {originalPrice && (
                    <span className="text-xl text-gray-500 line-through">${originalPrice}</span>
                  )}
                  {product.discountPrice && originalPrice && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                      Save ${originalPrice - displayPrice}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-6">
                  {isInStock ? (
                    <span className="text-green-600 font-medium">
                      ✓ In Stock ({product.inventory_quantity} available)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ✗ Out of Stock
                    </span>
                  )}
                </div>

                {/* Quantity and Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700">Quantity:</span>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 border-x">{quantity}</span>
                      <button
                        onClick={increaseQuantity}
                        disabled={quantity >= (product.inventory_quantity || 0)}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || addingToCart}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </button>
                </div>

                {/* Product Info */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Truck className="h-5 w-5" />
                    <span>Free shipping on orders over $50</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Shield className="h-5 w-5" />
                    <span>1-year warranty included</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>SKU:</strong> {product.sku}</p>
                    <p><strong>Category:</strong> {product.categories?.name}</p>
                  </div>
                </div>
              </div>
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
                  <img
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="max-w-md max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
