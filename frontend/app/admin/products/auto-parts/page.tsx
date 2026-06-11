'use client';

import { useState, useEffect } from 'react';
import { getPublicImageUrl } from '@/lib/supabase-storage';
import { supabase } from '@/lib/supabase-client';
import {
  ArrowLeft,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface StorageFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  last_modified?: string | null;
  metadata?: Record<string, any> | null;
  size?: number | null;
}

export default function FoodBeveragesProductsPage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const bucketName = 'product-images';
  const folderPath = 'food&beverages';

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // List all files in the food&beverages folder
      const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      if (data) {
        setFiles(data);
        // Preload image URLs for better performance
        await preloadImageUrls(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const preloadImageUrls = async (files: StorageFile[]) => {
    const urls: Record<string, string> = {};
    
    for (const file of files) {
      try {
        const key = file.id || file.name;
        const fullPath = `${folderPath}/${file.name}`;
        const url = await getPublicImageUrl(bucketName, fullPath);
        urls[key] = url;
      } catch (error) {
        console.error(`Error getting URL for ${file.name}:`, error);
      }
    }
    
    setImageUrls(urls);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  };

  const handleDownload = async (file: StorageFile) => {
    try {
      const supabaseClient = supabase();
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .download(`${folderPath}/${file.name}`);

      if (error) throw error;
      if (!data) throw new Error('No data received');

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading products from Food & Beverages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/products"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Food & Beverages Products</h1>
              <p className="text-gray-600 mt-1">
                All product images from the food & beverages category
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search product images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-medium">Error loading products</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredFiles.length} of {files.length} product images
        </p>
      </div>

      {/* Products Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No product images found in the food & beverages folder'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredFiles.map((file) => (
            <div
              key={file.id || file.name}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100 relative group">
                {imageUrls[file.id || file.name] ? (
                  <img
                    src={imageUrls[file.id || file.name]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm truncate" title={file.name}>
                  {file.name}
                </h3>
                <div className="mt-1 text-xs text-gray-500 space-y-1">
                  <p>{formatFileSize(file.size)}</p>
                  <p>{formatDate(file.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">{selectedFile.name}</h2>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {imageUrls[selectedFile.id || selectedFile.name] ? (
                <img
                  src={imageUrls[selectedFile.id || selectedFile.name]}
                  alt={selectedFile.name}
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                </div>
              )}
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                <p><strong>Created:</strong> {formatDate(selectedFile.created_at)}</p>
                <p><strong>Modified:</strong> {formatDate(selectedFile.updated_at)}</p>
                <p><strong>Path:</strong> {folderPath}/{selectedFile.name}</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
