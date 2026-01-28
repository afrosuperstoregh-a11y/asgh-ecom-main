'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ChevronDown,
  Tag,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt: string;
  endsAt?: string;
  autoApply: boolean;
  priority: number;
  codes: Array<{
    id: string;
    code: string;
    usageLimit?: number;
    usageCount: number;
  }>;
  _count: {
    usage: number;
  };
}

interface Filters {
  search: string;
  status: string;
  type: string;
  sortBy: string;
  sortOrder: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    type: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [pagination.page, filters]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/admin/promotions?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPromotions(data.data?.promotions || data.promotions || []);
        setPagination(data.data?.pagination || data.pagination || pagination);
      } else {
        setError('Failed to fetch promotions');
      }
    } catch (error) {
      console.error('Promotions fetch error:', error);
      setError('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (promotionId: string, promotionName: string) => {
    if (!confirm(`Are you sure you want to delete "${promotionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchPromotions(); // Refresh the list
      } else {
        alert('Failed to delete promotion');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete promotion');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isPromotionActive = (promotion: Promotion) => {
    if (!promotion.isActive) return false;
    const now = new Date();
    const startsAt = new Date(promotion.startsAt);
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
    
    return now >= startsAt && (!endsAt || now <= endsAt);
  };

  const getPromotionStatus = (promotion: Promotion) => {
    if (!promotion.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const startsAt = new Date(promotion.startsAt);
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
    
    if (now < startsAt) {
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    } else if (endsAt && now > endsAt) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'Percentage';
      case 'FIXED_AMOUNT': return 'Fixed Amount';
      case 'FREE_SHIPPING': return 'Free Shipping';
      case 'BUY_X_GET_Y': return 'Buy X Get Y';
      case 'BULK_DISCOUNT': return 'Bulk Discount';
      default: return type;
    }
  };

  const getValueDisplay = (promotion: Promotion) => {
    switch (promotion.type) {
      case 'PERCENTAGE':
        return `${promotion.value}%`;
      case 'FIXED_AMOUNT':
        return formatCurrency(promotion.value);
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      case 'BUY_X_GET_Y':
        return `Buy X Get ${promotion.value}`;
      case 'BULK_DISCOUNT':
        return `${promotion.value}% off bulk`;
      default:
        return promotion.value.toString();
    }
  };

  if (loading && promotions.length === 0) {
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
            <p className="text-gray-600 mt-2">Manage discounts and promotional campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Promotion
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
                  placeholder="Search promotions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
                <option value="BUY_X_GET_Y">Buy X Get Y</option>
                <option value="BULK_DISCOUNT">Bulk Discount</option>
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
                <option value="startsAt-desc">Starts Soon</option>
                <option value="endsAt-desc">Ends Soon</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No promotions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first promotion.
            </p>
            <div className="mt-6">
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Promotion
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {promotions.map((promotion) => {
              const status = getPromotionStatus(promotion);
              return (
                <div key={promotion.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {promotion.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {getTypeLabel(promotion.type)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Value Display */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {getValueDisplay(promotion)}
                    </div>
                    {promotion.minimumAmount && (
                      <p className="text-sm text-gray-500">
                        Min. order: {formatCurrency(promotion.minimumAmount)}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {promotion.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {promotion.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-blue-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">
                          {promotion._count.usage}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Uses</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-green-600">
                        <Tag className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold">
                          {promotion.codes.length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Codes</p>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {formatDate(promotion.startsAt)} - {promotion.endsAt ? formatDate(promotion.endsAt) : 'No end date'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(promotion.id, promotion.name)}
                        className="p-2 text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="p-2 text-gray-600 hover:text-gray-900">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {promotions.length > 0 && (
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
  );
}
