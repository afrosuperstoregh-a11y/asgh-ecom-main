'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Star, Truck, Shield, Plus, Minus, X, ZoomIn, ZoomOut, Play } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
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
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Determine API URL
        const getApiUrl = () => {
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              return 'http://localhost:3001';
            }
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${hostname}:3001`;
            return baseUrl.replace(/\/api$/, '');
          }
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          return baseUrl.replace(/\/api$/, '');
        };

        const apiUrl = getApiUrl();
        const productId = Array.isArray(params.id) ? params.id[0] : params.id;
        
        console.log('Fetching product from:', `${apiUrl}/api/products/${productId}`);

        const response = await fetch(`${apiUrl}/api/products/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const data = await response.json();
        console.log('Product data:', data);
        
        // Handle different response formats
        const productData = data.data || data.product || data;
        
        if (!productData) {
          throw new Error('Product data not found');
        }
        
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error instanceof Error ? error.message : 'Failed to load product');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    
    try {
      setAddingToCart(true);
      
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        image: product.images[0] || '/placeholder-product.svg',
        category: product.category?.name || 'Uncategorized'
      });
      
      setTimeout(() => setAddingToCart(false), 1000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setAddingToCart(false);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
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

  const isInStock = product.stock > 0;
  const displayPrice = product.discountPrice || product.price;
  const originalPrice = product.discountPrice ? product.price : null;

  return (
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
              {product.videos && product.videos.length > 0 && currentMediaIndex >= product.images.length ? (
                <ProductVideo
                  src={product.videos[currentMediaIndex - product.images.length]}
                  poster={product.images[0] || '/placeholder-product.svg'}
                  title={product.name}
                  className="w-full h-full"
                />
              ) : (
                <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                  <img
                    src={product.images[currentMediaIndex] || '/placeholder-product.svg'}
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
              {product.images.map((image, index) => (
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
              {product.videos && product.videos.map((video, index) => (
                <button
                  key={`video-${index}`}
                  onClick={() => setCurrentMediaIndex(product.images.length + index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentMediaIndex === product.images.length + index
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
                    ✓ In Stock ({product.stock} available)
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
                      disabled={quantity >= product.stock}
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
                  <p><strong>Category:</strong> {product.category?.name}</p>
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
                <p><strong>Category:</strong> {product.category?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Zoom Modal */}
  {isZoomed && (
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
          {product.images.map((image, index) => (
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
);
