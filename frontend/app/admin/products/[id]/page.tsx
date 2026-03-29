'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirmModal } from '../../../../components/admin/ConfirmModal';
import { useToast } from '../../../../components/admin/Toast';
import { adminApi } from '../../../../lib/admin-api-client';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Box,
  Tag,
  Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  description: string;
  shortDesc: string;
  status: string;
  featured: boolean;
  stock: number;
  trackInventory: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  category: {
    id: string;
    name: string;
  };
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    orderItems: number;
  };
}

export default function ViewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { openConfirmModal, ConfirmModalComponent } = useConfirmModal();
  const { showSuccess, showError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
      
      // Check if ID is valid
      if (!resolvedParams.id || resolvedParams.id === 'undefined') {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }
      
      fetchProduct(resolvedParams.id);
    };
    
    getParams();
  }, [params]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id || id === 'undefined') {
        setError('Invalid product ID');
        return;
      }
      
      const result = await adminApi.products.get(id);

      if (result.success && result.data) {
        setProduct(result.data as Product);
      } else {
        setError(result.error?.message || 'Failed to fetch product');
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Fetch product error:', error);
    }
      setError('An error occurred while fetching the product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await openConfirmModal({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const result = await adminApi.products.delete(productId);

          if (result.success) {
            showSuccess('Product deleted successfully');
            router.push('/admin/products');
          } else {
            showError(result.error?.message || 'Failed to delete product');
          }
        } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Delete error:', error);
    }
          showError('Failed to delete product');
        }
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                {product.status}
              </span>
              {product.featured && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images */}
              {product.images && product.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <div className="space-y-4">
                  {product.shortDesc && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Short Description</h4>
                      <p className="mt-1 text-gray-600">{product.shortDesc}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Full Description</h4>
                    <div className="mt-1 text-gray-600 whitespace-pre-wrap">
                      {product.description || 'No description provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Pricing</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sale Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.comparePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Compare Price</span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(product.comparePrice)}
                      </span>
                    </div>
                  )}
                  {product.cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cost</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(product.cost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Inventory</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Track Inventory</span>
                    <span className={`text-sm font-medium ${product.trackInventory ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.trackInventory ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {product.trackInventory && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock</span>
                      <span className={`text-sm font-medium ${
                        product.stock <= 10 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.stock} units
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Category</h3>
                <p className="text-sm text-gray-600">{product.category.name}</p>
              </div>

              {/* Physical Properties */}
              {(product.weight || product.dimensions) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Physical Properties</h3>
                  <div className="space-y-2">
                    {product.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Weight</span>
                        <span className="text-sm text-gray-900">{product.weight} kg</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">Dimensions</span>
                        <div className="text-sm text-gray-900">
                          {product.dimensions.length && <span>L: {product.dimensions.length} cm</span>}
                          {product.dimensions.width && <span> × W: {product.dimensions.width} cm</span>}
                          {product.dimensions.height && <span> × H: {product.dimensions.height} cm</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sales Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Sales</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product._count.orderItems}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Dates</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-900">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ConfirmModalComponent />
    </>
  );
}
