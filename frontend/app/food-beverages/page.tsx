'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { Loader2, Search, Grid, List, ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import { fixImageUrl } from '@/lib/supabase-storage';
import { supabase } from '@/lib/supabase-client';

interface StorageFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_modified?: string | null;
  metadata?: Record<string, any> | null;
  size?: number | null;
}

interface FoodProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category: string;
  inStock: boolean;
}

export default function FoodBeveragesPage() {
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { addToCart } = useCart();

  const bucketName = 'product-images';
  const folderPath = 'food&beverages';

  useEffect(() => {
    fetchStorageFiles();
  }, []);

  const fetchStorageFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch all files with pagination to ensure we get all 55 images
      let allFiles: StorageFile[] = [];
      let hasMore = true;
      let offset = 0;
      const limit = 100; // Increased limit to get more files per request

      while (hasMore) {
        const { data, error } = await supabaseClient.storage
          .from(bucketName)
          .list(folderPath, {
            limit: limit,
            offset: offset,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allFiles = [...allFiles, ...data];
          console.log(`Fetched ${data.length} files, total: ${allFiles.length}`);
          
          // If we got less than the limit, we've got all files
          if (data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Total files fetched: ${allFiles.length}`);
      
      if (allFiles.length > 0) {
        setStorageFiles(allFiles);
        // Convert storage files to product format
        const convertedProducts = await convertToProducts(allFiles);
        setProducts(convertedProducts);
        // Preload image URLs
        await preloadImageUrls(allFiles);
      } else {
        console.log('No files found in the food&beverages folder');
      }
    } catch (error) {
      console.error('Error fetching storage files:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const convertToProducts = async (files: StorageFile[]): Promise<FoodProduct[]> => {
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
        id: file.id || file.name,
        name: productName,
        price: price,
        image: `${folderPath}/${file.name}`,
        description: `Delicious ${productName} from our authentic African food collection. Perfect for any occasion.`,
        category: 'Food & Beverages',
        inStock: true
      };
    });
  };

  const preloadImageUrls = async (files: StorageFile[]) => {
    const urls: Record<string, string> = {};
    const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public';
    
    console.log(`Preloading URLs for ${files.length} files...`);
    
    for (const file of files) {
      try {
        const key = file.id || file.name;
        const fullPath = `${folderPath}/${file.name}`;
        const url = `${supabaseUrl}/${fullPath}`;
        urls[key] = url;
        
        // Log first few URLs for debugging
        if (files.indexOf(file) < 5) {
          console.log(`Image URL for ${file.name}: ${url}`);
        }
      } catch (error) {
        console.error(`Error getting URL for ${file.name}:`, error);
      }
    }
    
    console.log(`Successfully generated ${Object.keys(urls).length} image URLs`);
    setImageUrls(urls);
  };

  const handleAddToCart = (product: FoodProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
              >
                <List className="h-5 w-5" />
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
                🎉 All {products.length} products loaded from Supabase Storage
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
              <p>Storage Files: {storageFiles.length}</p>
              <p>Products Generated: {products.length}</p>
              <p>Image URLs Generated: {Object.keys(imageUrls).length}</p>
              <p>Filtered Products: {filteredProducts.length}</p>
              <p>Search Query: "{searchQuery}"</p>
              <p>Folder Path: {folderPath}</p>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'space-y-6'}>
            {filteredProducts.map((product) => (
              <div key={product.id}>
                {viewMode === 'grid' ? (
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                    <div className="relative aspect-square">
                      <Image
                        src={imageUrls[product.id] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        In Stock
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-gray-900">${product.price}</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 ml-1">4.5</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <ShoppingCart className="h-4 w-4 inline mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-4 gap-4 h-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={imageUrls[product.id] || '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="96px"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">${product.price}</span>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600 ml-1">4.5</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <ShoppingCart className="h-4 w-4 inline mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
               products.length === 0 ? 'No food & beverage items found in Supabase Storage' :
               'No items match your current filters'}
            </p>
            
            {products.length === 0 && !searchQuery && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm text-yellow-800 font-medium mb-2">Troubleshooting:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Check if images exist in the food&beverages folder</li>
                  <li>• Verify Supabase Storage permissions</li>
                  <li>• Try clicking the Refresh button above</li>
                  <li>• Check browser console for errors</li>
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
