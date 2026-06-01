'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { adminApi } from '../../../lib/admin-api-client';
import { tokenManager } from '../../../lib/token-manager';
import { useConfirmModal } from '../../../components/admin/ConfirmModal';
import { useToast } from '../../../components/admin/Toast';
import { getCategoryImageUrl, CATEGORY_CARD_IMAGE_PROPS } from '../../../lib/images';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Upload,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  _count: {
    products: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const { openConfirmModal, ConfirmModalComponent } = useConfirmModal();
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Validate token before making request
      const token = tokenManager.getToken();
      if (!token || !tokenManager.validateToken(token)) {
        setError('Authentication required');
        return;
      }

      const result = await adminApi.categories.list();
      
      if (result.success && result.data) {
        const data = result.data as any;
        setCategories(data.categories || data || []);
      } else {
        setError(result.error?.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (categoryId: string) => {
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId);
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`/admin/categories/${categoryId}/edit`);
  };

  const handleImportCategories = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setImporting(true);
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/admin/categories/import', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            showSuccess(`Successfully imported ${result.imported} categories. ${result.errors?.length || 0} errors.`);
            fetchCategories();
          } else {
            const error = await response.json();
            showError(`Import failed: ${error.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Import error:', error);
          showError('Import failed due to an error');
        } finally {
          setImporting(false);
        }
      }
    };
    input.click();
  };

  const handleExportCategories = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/admin/categories/export', {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Categories exported successfully');
      } else {
        showError('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('Export failed due to an error');
    } finally {
      setExporting(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    await openConfirmModal({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Validate token before making request
          const token = tokenManager.getToken();
          if (!token || !tokenManager.validateToken(token)) {
            showError('Authentication required');
            return;
          }

          const result = await adminApi.categories.delete(categoryId);
          
          if (result.success) {
            fetchCategories(); // Refresh the list
            showSuccess('Category deleted successfully');
          } else {
            showError(result.error?.message || 'Failed to delete category');
          }
        } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Delete error:', error);
    }
          showError('Failed to delete category');
        }
      }
    });
  };

  const filterCategories = (categories: Category[], term: string): Category[] => {
    if (!term) return categories;
    
    return categories.reduce((acc: Category[], category) => {
      const matchesSearch = category.name.toLowerCase().includes(term.toLowerCase()) ||
                         category.description?.toLowerCase().includes(term.toLowerCase());
      
      const filteredChildren = category.children ? filterCategories(category.children, term) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...category,
          children: filteredChildren.length > 0 ? filteredChildren : category.children
        });
      }
      
      return acc;
    }, []);
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="border-b border-gray-200">
        <div 
          className="flex items-center p-4 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={() => toggleCategoryExpansion(category.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          
          {!hasChildren && <div className="w-7 mr-2" />}
          
          {/* Category image */}
          <div className="flex-shrink-0 w-12 h-12 mr-4 relative">
            {category.image ? (
              <Image
                src={getCategoryImageUrl(category.image)}
                alt={category.name}
                fill
                className="rounded-lg object-cover"
                {...CATEGORY_CARD_IMAGE_PROPS}
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Category info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {category.name}
              </h3>
              {!category.isActive && (
                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {category.description || 'No description'}
            </p>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>Slug: {category.slug}</span>
              <span className="mx-2">•</span>
              <span>{category._count?.products || 0} products</span>
              <span className="mx-2">•</span>
              <span>Order: {category.sortOrder}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button 
              onClick={() => handleEditCategory(category.id)}
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors duration-200"
              aria-label="Edit category"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDelete(category.id, category.name)}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-200"
              aria-label="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="relative dropdown-menu">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown(category.id);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
                aria-label="More options"
                aria-expanded={activeDropdown === category.id}
                aria-controls={`dropdown-${category.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {activeDropdown === category.id && (
                <div 
                  id={`dropdown-${category.id}`}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 dropdown-menu" 
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleEditCategory(category.id);
                        setActiveDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Edit Category
                    </button>
                    <button
                      onClick={() => {
                        // View category details
                        setActiveDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      View Details
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        handleDelete(category.id, category.name);
                        setActiveDropdown(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      Delete Category
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">Manage your product categories and hierarchy</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleImportCategories}
              disabled={importing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Import categories"
            >
              <Upload className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
              {importing ? 'Importing...' : 'Import'}
            </button>
            <button 
              onClick={handleExportCategories}
              disabled={exporting}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Export categories"
            >
              <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            <button 
              onClick={() => router.push('/admin/categories/create')}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="Add new category"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              {searchTerm ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'No categories match your search criteria.'
                : 'Get started by creating your first category.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button 
                  onClick={() => router.push('/admin/categories/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Add new category"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {categories.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Categories</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {categories.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Categories</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {categories.filter(cat => cat.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {categories.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
    <ConfirmModalComponent />
    </>
  );
}
