'use client';

import { useState, useEffect } from 'react';
import { adminApi, ProductsListResponse } from '../../../lib/admin-api-client';
import { useConfirmModal } from '../../../components/admin/ConfirmModal';
import { useToast } from '../../../components/admin/Toast';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ChevronDown,
  Package,
  RefreshCw
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  status: string;
  featured: boolean;
  stock: number;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  _count: {
    orderItems: number;
  };
}

interface Filters {
  search: string;
  category: string;
  status: string;
  featured: string;
  sortBy: string;
  sortOrder: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    status: '',
    featured: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [duplicatingProduct, setDuplicatingProduct] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { openConfirmModal, ConfirmModalComponent } = useConfirmModal();
  const { showSuccess, showError } = useToast();


  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log('🔄 ProductsPage useEffect triggered');
    }
    fetchProducts();
    fetchCategories();
  }, [pagination.page, filters]);

  // Refresh data when page becomes visible (navigation back from create/edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !fetching) {
    if (process.env.NODE_ENV === "development") {
      console.log('Page became visible, refreshing products...');
    }
        fetchProducts();
        fetchCategories();
      }
    };

    // Also refresh when window gets focus (better detection of navigation)
    const handleFocus = () => {
      if (!fetching) {
    if (process.env.NODE_ENV === "development") {
      console.log('Window got focus, refreshing products...');
    }
      fetchProducts();
      fetchCategories();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await adminApi.categories.list();
      if (result.success && result.data) {
        const data = result.data as any;
        setCategories(data.categories || data || []);
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Categories fetch error:', error);
    }
    }
  };

  const fetchProducts = async () => {
    try {
      if (fetching) {
        if (process.env.NODE_ENV === "development") {
          console.log('🔄 Already fetching, skipping...');
        }
        return;
      }
      
      setFetching(true);
      setLoading(true);
      setError(null);
      
    if (process.env.NODE_ENV === "development") {
      console.log('🛒 Fetching products...');
    }
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

    if (process.env.NODE_ENV === "development") {
      console.log('📡 Making request via adminApi:', queryParams);
    }
      
      const result = await adminApi.products.list(queryParams);

    if (process.env.NODE_ENV === "development") {
      console.log('📊 API result:', result);
      console.log('📊 API result keys:', Object.keys(result));
      console.log('📊 API result.success:', result.success);
      console.log('📊 API result.data:', result.data);
      console.log('📊 API result.data type:', typeof result.data);
      console.log('📊 result.data keys:', Object.keys(result.data || {}));
      console.log('📊 result.data.data:', result.data?.data);
      console.log('📊 result.data.data.products:', result.data?.data?.products);
      console.log('📊 result.data.data.products type:', typeof result.data?.data?.products);
      console.log('📊 result.data.data.products keys:', Object.keys(result.data?.data?.products || {}));
    }

      if (result.success && result.data) {
        const data = result.data as ProductsListResponse;
        // Handle different response structures
        let products = data.data?.products || data.data || data || [];
        const paginationData = data.data?.pagination || data.data || data || {} as any;
        
        // Convert products object to array if needed
        if (!Array.isArray(products)) {
          if (typeof products === 'object' && products !== null) {
            products = Object.values(products);
          } else {
            products = [];
          }
        }
        
        // Ensure pagination data has the correct structure
        const safePaginationData = {
          page: (paginationData as any).page || 1,
          limit: (paginationData as any).limit || 20,
          total: (paginationData as any).total || 0,
          pages: (paginationData as any).pages || 1
        };
        
    if (process.env.NODE_ENV === "development") {
      console.log('✅ Products fetched successfully:', data);
      console.log('📦 Products array (after conversion):', products);
      console.log('📊 Products type:', typeof products);
      console.log('📊 Products isArray:', Array.isArray(products));
      console.log('📊 Products length:', products?.length);
      console.log('📊 First product:', products?.[0]);
      console.log('📊 Pagination:', paginationData);
    }
        setProducts(products);
        setPagination(safePaginationData);
      } else {
    if (process.env.NODE_ENV === "development") {
      console.log('❌ Products fetch failed:', result.error);
    }
        setError(result.error?.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('❌ Products fetch error:', error);
    }
      setError('Network error while fetching products');
      setProducts([]);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchProducts();
    fetchCategories();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    await fetchCategories();
    setRefreshing(false);
  };

  const toggleDropdown = (productId: string) => {
    setActiveDropdown(activeDropdown === productId ? null : productId);
  };

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }
  }, [activeDropdown]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleAddProduct = () => {
    router.push('/admin/products/create');
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/admin/products/${productId}/edit`);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/admin/products/${productId}`);
  };
  const handleImport = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setImporting(true);
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/admin/products/import', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            showSuccess(`Successfully imported ${result.imported} products. ${result.errors?.length || 0} errors.`);
            fetchProducts(); // Refresh the list
          } else {
            const error = await response.json();
            showError(`Import failed: ${error.message || 'Unknown error'}`);
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error('Import error:', error);
          }
          showError('Import failed due to an error');
        } finally {
          setImporting(false);
        }
      }
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/admin/products/export', {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Products exported successfully');
      } else {
        showError('Export failed');
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error('Export error:', error);
      }
      showError('Export failed due to an error');
    } finally {
      setExporting(false);
    }
  };

  const handleDuplicate = async (productId: string) => {
    try {
      setDuplicatingProduct(productId);
      
      // Fetch the original product data
      const response = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        showError('Failed to fetch product data');
        return;
      }
      
      const originalProduct = await response.json();
      
      // Prepare duplicate data
      const duplicateData = {
        name: `${originalProduct.name} (Copy)`,
        sku: `${originalProduct.sku}-COPY-${Date.now()}`,
        price: originalProduct.price,
        description: originalProduct.description || '',
        category_id: originalProduct.categoryId || originalProduct.category?.id || null,
        inventory_quantity: originalProduct.stock || 0,
        status: 'draft', // Start as draft
        featured: false, // Don't feature duplicates by default
        image_url: originalProduct.image_url || originalProduct.image || null
      };
      
      // Create the duplicate
      const duplicateResponse = await adminApi.products.create(duplicateData);
      
      if (duplicateResponse.success) {
        showSuccess('Product duplicated successfully!');
        fetchProducts(); // Refresh the list
        setActiveDropdown(null);
      } else {
        showError(duplicateResponse.message || 'Failed to duplicate product');
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error('Duplicate error:', error);
      }
      showError('Failed to duplicate product');
    } finally {
      setDuplicatingProduct(null);
    }
  };

  const handleDelete = async (productId: string) => {
    const confirmed = await openConfirmModal({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            fetchProducts(); // Refresh the list
          } else {
            showError('Failed to delete product');
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
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    {process.env.NODE_ENV === "development" && console.log('🔄 RENDER: Products state length:', products.length)}
    {process.env.NODE_ENV === "development" && console.log('🔄 RENDER: Products array:', products)}
    {process.env.NODE_ENV === "development" && console.log('🔄 RENDER: Products type:', typeof products)}
    {process.env.NODE_ENV === "development" && console.log('🔄 RENDER: Products isArray:', Array.isArray(products))}
    {process.env.NODE_ENV === "development" && products.length > 0 && console.log('🔄 RENDER: First product:', products[0])}
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Refresh products"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleImport} 
              disabled={importing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Import products"
            >
              <Upload className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button 
              onClick={handleExport} 
              disabled={exporting}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Export products"
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            <button 
              onClick={handleAddProduct} 
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="Add new product"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-expanded={showFilters}
              aria-controls="filters-panel"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Featured</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>

              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium">Error loading products</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new product.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddProduct} 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                aria-label="Add new product"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock <= 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                      {product.featured && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product._count.orderItems}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewProduct(product.id)} 
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors duration-200"
                          aria-label={`View ${product.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditProduct(product.id)} 
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-1 rounded transition-colors duration-200"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors duration-200"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="relative dropdown-menu">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(product.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-1 rounded transition-colors duration-200"
                            aria-label="More options"
                            aria-expanded={activeDropdown === product.id}
                            aria-controls={`dropdown-${product.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {activeDropdown === product.id && (
                            <div 
                              id={`dropdown-${product.id}`}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 dropdown-menu" 
                              role="menu"
                              aria-orientation="vertical"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleViewProduct(product.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => {
                                    handleEditProduct(product.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => {
                                    handleDuplicate(product.id);
                                  }}
                                  disabled={duplicatingProduct === product.id}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  role="menuitem"
                                >
                                  {duplicatingProduct === product.id ? (
                                    <>
                                      <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-2"></div>
                                      Duplicating...
                                    </>
                                  ) : (
                                    'Duplicate'
                                  )}
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={() => {
                                    handleDelete(product.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  role="menuitem"
                                >
                                  Delete Product
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <ConfirmModalComponent />
    </>
  );
}
