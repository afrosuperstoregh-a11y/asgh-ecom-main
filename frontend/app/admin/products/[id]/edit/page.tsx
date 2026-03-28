'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../../../lib/admin-api-client';
import { uploadFiles } from '../../../../../lib/supabase-storage';
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  shortDesc: string;
  sku: string;
  price: string;
  comparePrice: string;
  cost: string;
  categoryId: string;
  trackInventory: boolean;
  stock: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  status: string;
  featured: boolean;
  tags: string[];
  images: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [productId, setProductId] = useState<string>('');
  const [skuValidating, setSkuValidating] = useState(false);
  const [skuValid, setSkuValid] = useState<boolean | null>(null);
  const [priceError, setPriceError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    shortDesc: '',
    sku: '',
    price: '',
    comparePrice: '',
    cost: '',
    categoryId: '',
    trackInventory: true,
    stock: '0',
    weight: '',
    length: '',
    width: '',
    height: '',
    status: 'DRAFT',
    featured: false,
    tags: [],
    images: []
  });

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
      fetchProduct(resolvedParams.id);
      fetchCategories();
    };
    
    getParams();
  }, [params]);

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

  const fetchProduct = async (id: string) => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/admin/products/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const product = await response.json();
        setFormData({
          name: product.name || '',
          description: product.description || '',
          shortDesc: product.shortDesc || '',
          sku: product.sku || '',
          price: product.price?.toString() || '',
          comparePrice: product.comparePrice?.toString() || '',
          cost: product.cost?.toString() || '',
          categoryId: product.categoryId || '',
          trackInventory: product.trackInventory ?? true,
          stock: product.stock?.toString() || '0',
          weight: product.weight?.toString() || '',
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || '',
          status: product.status || 'DRAFT',
          featured: product.featured || false,
          tags: product.tags || [],
          images: product.images || []
        });
      } else {
        setError('Failed to fetch product');
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Fetch product error:', error);
    }
      setError('An error occurred while fetching the product');
    } finally {
      setFetchLoading(false);
    }
  };

  const validateSKU = async (sku: string, excludeId?: string) => {
    if (!sku.trim()) {
      setSkuValid(null);
      return;
    }

    try {
      setSkuValidating(true);
      const response = await fetch(`/api/admin/products/check-sku?sku=${encodeURIComponent(sku)}&excludeId=${excludeId || ''}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setSkuValid(!result.exists);
        if (result.exists) {
          setValidationErrors(prev => ({ ...prev, sku: 'SKU already exists' }));
        } else {
          setValidationErrors(prev => ({ ...prev, sku: '' }));
        }
      }
    } catch (error) {
      console.error('SKU validation error:', error);
      setSkuValid(null);
    } finally {
      setSkuValidating(false);
    }
  };

  const validatePrice = (price: string, comparePrice: string) => {
    const priceNum = parseFloat(price);
    const compareNum = parseFloat(comparePrice);
    
    if (compareNum && priceNum > compareNum) {
      setPriceError('Sale price must be less than or equal to compare price');
      setValidationErrors(prev => ({ ...prev, price: 'Sale price must be less than or equal to compare price' }));
    } else {
      setPriceError('');
      setValidationErrors(prev => ({ ...prev, price: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Real-time validations
    if (name === 'sku') {
      validateSKU(value, productId);
    }
    
    if (name === 'price' || name === 'comparePrice') {
      const newFormData = {
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      };
      validatePrice(newFormData.price, newFormData.comparePrice);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    
    try {
      // Upload files to Supabase Storage
      const imageUrls = await uploadFiles('products', Array.from(files));
      
      // Add uploaded image URLs to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      
      console.log(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setImageUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== imageIndex)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Validation
      const errors: Record<string, string> = {};
      
      if (!formData.name.trim()) {
        errors.name = 'Product name is required';
      }
      
      if (!formData.sku.trim()) {
        errors.sku = 'SKU is required';
      } else if (skuValid === false) {
        errors.sku = 'SKU already exists';
      }
      
      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = 'Valid price is required';
      } else if (priceError) {
        errors.price = priceError;
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      // Prepare data for API
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price) || 0,
        description: formData.description.trim(),
        shortDesc: formData.shortDesc.trim(),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        category_id: formData.categoryId || null,
        trackInventory: formData.trackInventory,
        stock: parseInt(formData.stock) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: (formData.length || formData.width || formData.height) ? {
          length: parseFloat(formData.length) || null,
          width: parseFloat(formData.width) || null,
          height: parseFloat(formData.height) || null
        } : null,
        status: formData.status.toLowerCase(),
        featured: formData.featured,
        tags: formData.tags,
        images: formData.images.length > 0 ? formData.images : null
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update product');
      }
    } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error('Update product error:', error);
    }
      setError('An error occurred while updating the product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600 mt-2">Update product information</p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.sku ? 'border-red-500' : skuValid === true ? 'border-green-500' : 'border-gray-300'
                  }`}
                />
                <div className="mt-1 flex items-center space-x-2">
                  {skuValidating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {skuValid === true && (
                    <span className="text-green-600 text-sm">✓ SKU available</span>
                  )}
                  {skuValid === false && (
                    <span className="text-red-600 text-sm">✗ SKU already exists</span>
                  )}
                </div>
                {validationErrors.sku && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.sku}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="shortDesc" className="block text-sm font-medium text-gray-700">
                Short Description
              </label>
              <input
                type="text"
                id="shortDesc"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief product description for listings"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Full Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category"
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="__add_new__" className="text-blue-600 font-medium">
                  ➕ Add New Category
                </option>
              </select>
              {formData.categoryId === '__add_new__' && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Click <button 
                      type="button"
                      onClick={() => router.push('/admin/categories/create')}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      here
                    </button> to create a new category first.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pricing</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Sale Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`pl-7 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.price ? 'border-red-500' : priceError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {priceError && (
                    <p className="mt-1 text-sm text-red-600">{priceError}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="comparePrice" className="block text-sm font-medium text-gray-700">
                  Compare Price
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="comparePrice"
                    name="comparePrice"
                    step="0.01"
                    min="0"
                    value={formData.comparePrice}
                    onChange={handleInputChange}
                    className={`pl-7 block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      priceError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost Per Item
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="pl-7 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Inventory</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="trackInventory"
                name="trackInventory"
                checked={formData.trackInventory}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="trackInventory" className="ml-2 block text-sm text-gray-900">
                Track inventory
              </label>
            </div>

            {formData.trackInventory && (
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Product Options */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Product Options</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                Featured product
              </label>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Product Images</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {imageUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Uploading...</span>
                        </p>
                        <p className="text-xs text-gray-500">Please wait</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                </label>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
