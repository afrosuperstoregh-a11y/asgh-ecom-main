'use client';

import { useState } from 'react';
import { brands, allColors, allSizes } from '@/data/products';
import { useCategories } from '@/hooks/useCategories';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/Button';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  onApplyFilters: () => void;
}

export default function MobileFilterDrawer({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  onApplyFilters 
}: MobileFilterDrawerProps) {
  const { categories } = useCategories();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full w-full bg-white shadow-xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="p-2 text-gray-400 hover:text-gray-500"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Categories */}
            <div className="mb-6">
              <Button
                onClick={() => toggleSection('category')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Category</h3>
                {expandedSections.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('price')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Price Range</h3>
                {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('brand')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Brand</h3>
                {expandedSections.brand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('color')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Color</h3>
                {expandedSections.color ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('size')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Size</h3>
                {expandedSections.size ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('rating')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Rating</h3>
                {expandedSections.rating ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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
              <Button
                onClick={() => toggleSection('availability')}
                variant="ghost"
                size="sm"
                className="flex items-center justify-between w-full mb-3 text-left p-0 hover:bg-transparent"
              >
                <h3 className="font-medium text-gray-900">Availability</h3>
                {expandedSections.availability ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
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

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Button
              onClick={onClearFilters}
              variant="secondary"
              size="md"
              className="w-full py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              Clear All
            </Button>
            <Button
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              variant="primary"
              size="md"
              className="w-full py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
