'use client';

import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

interface SortBarProps {
  totalProducts: number;
  currentSort: string;
  onSortChange: (sort: string) => void;
  onMobileFilterOpen: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export default function SortBar({ 
  totalProducts, 
  currentSort, 
  onSortChange, 
  onMobileFilterOpen,
  viewMode = 'grid',
  onViewModeChange
}: SortBarProps) {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'new', label: 'New Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' }
  ];

  const currentSortLabel = sortOptions.find(option => option.value === currentSort)?.label || 'Featured';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Product Count */}
        <div className="flex items-center justify-between sm:justify-start">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{totalProducts}</span> products
          </p>
          
          {/* Mobile Filter Button */}
          <button
            onClick={onMobileFilterOpen}
            className="sm:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>

        {/* Sort and View Options */}
        <div className="flex items-center gap-4">
          {/* View Mode Toggle - Desktop Only */}
          {onViewModeChange && (
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <span className="text-sm text-gray-900">{currentSortLabel}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isSortDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                        currentSort === option.value
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary - Could be expanded to show active filter chips */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Active filters:</span>
        <span className="text-xs text-gray-600">None</span>
      </div>
    </div>
  );
}
