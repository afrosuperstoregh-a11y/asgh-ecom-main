'use client';

import { useState } from 'react';
import { categories, brands, allColors, allSizes } from '@/data/products';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSidebarProps {
  filters: {
    category: string;
    brand: string;
    minPrice: number;
    maxPrice: number;
    color: string;
    size: string;
    rating: number;
    inStock: boolean;
    discount: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export default function FilterSidebar({ filters, onFiltersChange, onClearFilters }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    brand: true,
    color: true,
    size: true,
    rating: true,
    availability: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'bg-black',
      'white': 'bg-white border border-gray-300',
      'gray': 'bg-gray-500',
      'navy': 'bg-blue-900',
      'blue': 'bg-blue-500',
      'red': 'bg-red-500',
      'green': 'bg-green-500',
      'pink': 'bg-pink-500',
      'purple': 'bg-purple-500',
      'brown': 'bg-amber-800',
      'tan': 'bg-yellow-700',
      'silver': 'bg-gray-400',
      'gold': 'bg-yellow-500',
      'light-wash': 'bg-blue-200',
      'tortoise': 'bg-amber-700',
      'rose-gold': 'bg-pink-300',
      'olive': 'bg-green-700'
    };
    return colorMap[color] || 'bg-gray-400';
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 0 && value !== false && value !== 999999
  );

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Category</h3>
          {expandedSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.category && (
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={filters.category === category.id}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
                <span className="ml-auto text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Price Range</h3>
          {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice === 999999 ? '' : filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value) || 999999)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="No limit"
              />
            </div>
          </div>
        )}
      </div>

      {/* Brand */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('brand')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Brand</h3>
          {expandedSections.brand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.brand && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={brand}
                  checked={filters.brand === brand}
                  onChange={(e) => handleFilterChange('brand', e.target.checked ? brand : '')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('color')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Color</h3>
          {expandedSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.color && (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2">
              {allColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleFilterChange('color', filters.color === color ? '' : color)}
                  className={`w-8 h-8 rounded-full ${getColorClass(color)} ${
                    filters.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } transition-all duration-200`}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('size')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Size</h3>
          {expandedSections.size ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.size && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {allSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleFilterChange('size', filters.size === size ? '' : size)}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors duration-200 ${
                    filters.size === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Rating</h3>
          {expandedSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.rating && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={filters.rating === rating}
                  onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">& Up</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('availability')}
          className="flex items-center justify-between w-full mb-3 text-left"
        >
          <h3 className="font-medium text-gray-900">Availability</h3>
          {expandedSections.availability ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expandedSections.availability && (
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.discount}
                onChange={(e) => handleFilterChange('discount', e.target.checked)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
