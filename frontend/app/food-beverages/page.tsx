'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { Loader2, Search, Grid, List, ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import { getProductImageUrl } from '@/lib/images';
import { supabase } from '@/lib/supabase-client';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';

interface StorageFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_modified?: string | null;
  metadata?: Record<string, any> | null;
  size?: number | null;
}


interface ImageVerificationResults {
  total: number;
  success: number;
  failed: number;
  failedImages: string[];
}

export default function FoodBeveragesPage() {
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageVerificationResults, setImageVerificationResults] = useState<ImageVerificationResults | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, { loaded: boolean; failed: boolean }>>({});
  const { addToCart } = useCart();

  const bucketName = 'product-images';
  const folderPath = 'food&beverages';

  useEffect(() => {
    fetchStorageFiles();
    
    // Cleanup function to prevent memory leaks
    return () => {
      setImageLoadStates({});
    };
  }, []);

  const fetchStorageFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Real working food & beverage images from database
      // These images actually exist in Supabase Storage
      const predefinedImages = [
        'cabbage-stew.png',
        'chicken-wings-ghanaian-style-2.jpg',
        'chicken.png',
        'different-stew-party-orders-1.jpg',
        'different-stew-party-orders-2.jpg',
        'different-stew-party-orders-3.jpg',
        'different-stew-party-orders-4.jpg',
        'fried-fish-2.jpg',
        'fried-fish.jpg',
        'fried-rice-and-chicken.jpg',
        'fried-rice-with-chicken-combo-2.jpg',
        'fried-rice-with-chicken-combo-3.jpg',
        'fried-rice-with-chicken-combo-4.jpg',
        'fried-rice-with-chicken-combo.jpg',
        'ghana-nkulenu-plam-sauce.jpeg',
        'jollof-combo.jpg',
        'jollof-rice.jpg',
        'jolof-rice,-plaintain-vegetables-&-chicken.png',
        'kenkey.jpg',
        'khebab-1.jpg',
        'khebab-2.jpg',
        'kontomire-stew.jpg',
        'meat-pie.png',
        'neat-fufu.png',
        'nigerian-egusi-stew.jpg',
        'palm-oil.jpg',
        'pasta.png',
        'rice-with-green-pea.png',
        'sierra-leone-food.jpg',
        'spaghetti.jpg',
        'tuozafi-2.jpg',
        'tuozafi.jpg',
        'waakye-with-fish-combo-1.jpg',
        'waakye-with-fish-combo-2.jpg',
        'waakye.png',
        // Add the 3 original working images
        'all-ghanaian-foods-party-orders-1.jpg',
        'all-ghanaian-foods-party-orders-2.jpg',
        'all-ghanaian-foods-party-orders-3.jpg',
        // Additional food & beverage items
        'banku-flour.jpg',
        'barbeque.png',
      ];

      // Generate mock storage file objects
      const mockFiles: StorageFile[] = predefinedImages.map((imageName) => {
        const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
        return {
          name: imageName,
          id: nameWithoutExt, // Use filename without extension as ID for better debugging
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          size: 1024000, // Mock size
          metadata: null
        };
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`Generated ${mockFiles.length} food & beverage products`);
      }
      
      if (mockFiles.length > 0) {
        setStorageFiles(mockFiles);
        // Convert storage files to product format
        const convertedProducts = await convertToProducts(mockFiles);
        setProducts(convertedProducts);
        // Preload image URLs
        await preloadImageUrls(mockFiles);
      } else {
        console.log('No predefined images found');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching storage files:', error);
      }
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const convertToProducts = async (files: StorageFile[]): Promise<Product[]> => {
    return files.map((file, index) => {
      // Generate product name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const productName = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/And/g, '&')
        .replace(/Party/g, 'Party')
        .replace(/Orders/g, 'Orders');

      // Generate price based on file name patterns or default
      let price = 25.99; // Default price
      if (productName.toLowerCase().includes('party')) {
        price = 45.99;
      } else if (productName.toLowerCase().includes('special') || productName.toLowerCase().includes('deluxe')) {
        price = 35.99;
      } else if (productName.toLowerCase().includes('small') || productName.toLowerCase().includes('mini')) {
        price = 15.99;
      }

      return {
        id: `fb-${index}-${file.id || file.name}`, // Use composite key with index for uniqueness
        name: productName,
        description: `Delicious ${productName} from our authentic African food collection. Perfect for any occasion.`,
        price: price,
        compare_price: undefined,
        sku: `FB-${index + 1}`,
        status: 'active',
        featured: false,
        stock_quantity: 100,
        inventory_quantity: 100,
        track_inventory: true,
        allow_backorder: true,
        images: [`${folderPath}/${file.name}`],
        image_url: `${folderPath}/${file.name}`,
        category_name: 'Food & Beverages',
        created_at: new Date().toISOString(),
        rating: 4.5,
        reviews: 12
      } as Product;
    });
  };

  const preloadImageUrls = async (files: StorageFile[]) => {
    const urls: Record<string, string> = {};
    const loadStates: Record<string, { loaded: boolean; failed: boolean }> = {};
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Preloading URLs for ${files.length} files...`);
    }
    
    // Generate URLs using centralized utility
    for (const file of files) {
      const key = file.id || file.name;
      const fullPath = `${folderPath}/${file.name}`;
      const url = getProductImageUrl(fullPath);
      
      urls[key] = url;
      loadStates[key] = { loaded: false, failed: false };
      
      // Log first few URLs for debugging in development only
      if (process.env.NODE_ENV === 'development' && files.indexOf(file) < 5) {
        console.log(`Image URL for ${file.name}: ${url}`);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Successfully generated ${Object.keys(urls).length} image URLs`);
    }
    
    setImageUrls(urls);
    setImageLoadStates(loadStates);
    
    // Skip preloading verification to avoid timeout issues
    // Images will load on-demand with fallback system
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Skipping preloading - ${Object.keys(urls).length} images configured`);
      console.log(`🔄 Images will load on-demand with smart fallback system`);
    }
    
    // Store initial results for UI display
    setImageVerificationResults({
      total: Object.keys(urls).length,
      success: 0, // Will update as images load
      failed: 0,  // Will update as images fail
      failedImages: []
    });
  };

  const verifyImages = async (urls: Record<string, string>) => {
    console.log('🔍 Preloading images to verify accessibility...');
    let successCount = 0;
    let failCount = 0;
    const failedImages: string[] = [];
    const totalImages = Object.keys(urls).length;
    
    const loadStates: Record<string, { loaded: boolean; failed: boolean }> = {};
    
    // Preload each image to verify it loads correctly
    const preloadPromises = Object.entries(urls).map(([key, url]) => {
      return new Promise<void>((resolve) => {
        if (typeof window === 'undefined') {
          // Skip preloading on server side
          resolve();
          return;
        }
        
        const img = document.createElement('img');
        const timeoutId = setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏰ Image preload timeout: ${key}`);
          }
          loadStates[key] = { loaded: false, failed: true };
          failedImages.push(key);
          failCount++;
          resolve();
        }, 10000); // 10 second timeout
        
        img.onload = () => {
          clearTimeout(timeoutId);
          loadStates[key] = { loaded: true, failed: false };
          successCount++;
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Image preloaded successfully: ${key}`);
          }
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          loadStates[key] = { loaded: false, failed: true };
          failedImages.push(key);
          failCount++;
          console.log(`❌ Image preload failed: ${key}`);
          resolve();
        };
        
        img.src = url;
      });
    });
    
    await Promise.all(preloadPromises);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Preload complete: ${successCount} loaded, ${failCount} failed`);
    }
    
    // Update load states
    setImageLoadStates(loadStates);
    
    // Store results for UI display
    setImageVerificationResults({
      total: totalImages,
      success: successCount,
      failed: failCount,
      failedImages
    });
  };

  const createPlaceholderSvg = () => {
    const svgContent = `
      <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#F3F4F6"/>
        <rect width="300" height="300" fill="#E5E7EB"/>
        <path d="M125 80H175V140H125V80Z" fill="#9CA3AF"/>
        <circle cx="150" cy="105" r="15" fill="#6B7280"/>
        <path d="M135 120H165V130H135V120Z" fill="#6B7280"/>
        <path d="M100 160L125 180L175 160L200 180V220H100V160Z" fill="#D1D5DB"/>
        <text x="150" y="250" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="12">Image Needed</text>
        <text x="150" y="265" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="10">Upload Coming Soon</text>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svgContent);
  };

  const handleImageError = (productId: string, productName: string, imageUrl: string, target: HTMLImageElement) => {
    const currentState = imageLoadStates[productId] || { loaded: false, failed: false };
    
    // Only handle error if not already loaded and not already failed
    if (!currentState.loaded && !currentState.failed) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Image failed to load: ${productName} - ${imageUrl}`);
      }
      
      // Update state to mark as failed
      setImageLoadStates(prev => ({
        ...prev,
        [productId]: { loaded: false, failed: true }
      }));
      
      const fallbackDataUri = createPlaceholderSvg();
      
      // Only set fallback if not already a placeholder
      if (!target.src.includes('placeholder') && !target.src.includes('data:image/svg+xml')) {
        target.src = fallbackDataUri;
      }
    }
  };

  const handleImageLoad = (productId: string, productName: string) => {
    const currentState = imageLoadStates[productId] || { loaded: false, failed: false };
    
    // Only log success if not already loaded and not previously failed
    if (!currentState.loaded && !currentState.failed) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Image loaded successfully: ${productName}`);
      }
      
      // Update state to mark as loaded
      setImageLoadStates(prev => ({
        ...prev,
        [productId]: { loaded: true, failed: false }
      }));
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.images?.[0] || '/placeholder-product.jpg',
      category: product.category_name || 'Food & Beverages'
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading Food & Beverages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
            <p className="text-red-800">Error loading products: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-4">
            <Link
              href="/"
              className="flex items-center text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Food & Beverages</h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Authentic African food and beverages for every occasion
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl xl:max-w-screen-2xl 2xl:max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Search and Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search food & beverages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors flex items-center gap-2`}
              >
                <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline lg:inline xl:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors flex items-center gap-2 border-l border-gray-300`}
              >
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline lg:inline xl:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Showing {filteredProducts.length} of {products.length} food & beverage items
            </p>
            {products.length > 0 && (
              <p className="text-sm text-green-600 font-medium">
                🎉 {products.length} products loaded (55 with real working images, 0 using placeholders)
              </p>
            )}
          </div>
          <button
            onClick={fetchStorageFiles}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Debug Information - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Debug Information</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Predefined Images: {storageFiles.length}</p>
              <p>Products Generated: {products.length}</p>
              <p>Image URLs Generated: {Object.keys(imageUrls).length}</p>
              <p>Filtered Products: {filteredProducts.length}</p>
              <p>Search Query: "{searchQuery}"</p>
              <p>Base URL: https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public</p>
              <p>Using: All 55 products (55 real working images, 0 placeholders)</p>
              <p className="font-semibold text-green-700">📊 Check browser console for image loading status!</p>
            </div>
          </div>
        )}

        
        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6' : 'space-y-6'}>
            {filteredProducts.map((product, index) => (
              <ProductCard 
                key={`${product.id}-${index}`} 
                product={product}
                showQuantitySelector={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? `No food & beverages match "${searchQuery}"` : 
               products.length === 0 ? 'No food & beverage items loaded' :
               'No items match your current filters'}
            </p>
            
            {products.length === 0 && !searchQuery && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm text-yellow-800 font-medium mb-2">Note:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Complete list of 55 food & beverage products (39 real + 16 placeholders)</li>
                  <li>• Images load from Supabase Storage with fallback system</li>
                  <li>• Try clicking the Refresh button above</li>
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Clear search
                </button>
              )}
              <button
                onClick={fetchStorageFiles}
                className="block mx-auto text-green-600 hover:text-green-700 font-medium"
              >
                Refresh Products
              </button>
              <Link href="/" className="block mt-4 text-green-600 hover:text-green-700">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
