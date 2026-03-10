import React, { useState, useEffect } from 'react';
import { Filter, SortAsc, Grid, List, Search, X } from 'lucide-react';
import { categories } from '@/data/products';

interface DealsFilterBarProps {
  onFilterChange: (filters: any) => void;
  onSortChange: (sort: string) => void;
  onViewChange: (view: 'grid' | 'list') => void;
  currentView: 'grid' | 'list';
  totalProducts: number;
}

const DealsFilterBar: React.FC<DealsFilterBarProps> = ({
  onFilterChange,
  onSortChange,
  onViewChange,
  currentView,
  totalProducts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all-products');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [discountRange, setDiscountRange] = useState('');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categories.getAll();
        setCategoriesList(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategoriesList([]);
      }
    };
    
    loadCategories();
  }, []);

  const sortOptions = [
    { value: 'discount-high', label: 'Highest Discount' },
    { value: 'discount-low', label: 'Lowest Discount' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'ending-soon', label: 'Ending Soon' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ searchTerm, category: selectedCategory, priceRange, discountRange });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all-products');
    setPriceRange({ min: '', max: '' });
    setDiscountRange('');
    onFilterChange({});
  };

  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => onViewChange('grid')}
                className={`p-2 ${currentView === 'grid' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={`p-2 ${currentView === 'list' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categoriesList.length > 0 ? (
                categoriesList.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              ) : (
                <option value="">Loading categories...</option>
              )}
            </select>

            <select
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Sort by</option>
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {totalProducts} deals found
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Advanced Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Discount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Discount</label>
                <select
                  value={discountRange}
                  onChange={(e) => setDiscountRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Any Discount</option>
                  <option value="10">10% or more</option>
                  <option value="25">25% or more</option>
                  <option value="50">50% or more</option>
                  <option value="75">75% or more</option>
                </select>
              </div>

              {/* Apply/Clear Buttons */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => onFilterChange({ searchTerm, category: selectedCategory, priceRange, discountRange })}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsFilterBar;
