'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DealsHero from '@/components/DealsHero';
import DealsFilterBar from '@/components/DealsFilterBar';
import DealProductCard from '@/components/DealProductCard';
import { dealsData } from '@/data/deals';

interface Deal {
  id: number;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  stock: number;
  dealEnds: string;
  badge: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: 'all-products',
    priceRange: { min: '', max: '' },
    discountRange: ''
  });
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setDeals(dealsData.deals as Deal[]);
      setFilteredDeals(dealsData.deals as Deal[]);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = [...deals];

    // Apply search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(deal =>
        deal && (
          deal.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          deal.brand?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          deal.category?.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all-products') {
      filtered = filtered.filter(deal =>
        deal && deal.category && deal.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply price range filter
    if (filters.priceRange.min) {
      filtered = filtered.filter(deal => deal && deal.discountedPrice >= parseFloat(filters.priceRange.min));
    }
    if (filters.priceRange.max) {
      filtered = filtered.filter(deal => deal && deal.discountedPrice <= parseFloat(filters.priceRange.max));
    }

    // Apply discount range filter
    if (filters.discountRange) {
      filtered = filtered.filter(deal => deal && deal.discount >= parseInt(filters.discountRange));
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        if (!a || !b) return 0;
        switch (sortBy) {
          case 'discount-high':
            return b.discount - a.discount;
          case 'discount-low':
            return a.discount - b.discount;
          case 'price-low':
            return a.discountedPrice - b.discountedPrice;
          case 'price-high':
            return b.discountedPrice - a.discountedPrice;
          case 'name-asc':
            return (a.name || '').localeCompare(b.name || '');
          case 'name-desc':
            return (b.name || '').localeCompare(a.name || '');
          default:
            return 0;
        }
      });
    }

    setFilteredDeals(filtered);
  }, [deals, filters, sortBy]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    setViewMode(view);
  };

  const stats = useMemo(() => {
    const totalSavings = filteredDeals.reduce((acc, deal) => 
      acc + ((deal?.originalPrice || 0) - (deal?.discountedPrice || 0)), 0
    );
    const avgDiscount = filteredDeals.length > 0 
      ? filteredDeals.reduce((acc, deal) => acc + (deal?.discount || 0), 0) / filteredDeals.length 
      : 0;
    const avgRating = filteredDeals.length > 0
      ? filteredDeals.reduce((acc, deal) => acc + (deal?.rating || 0), 0) / filteredDeals.length
      : 0;

    return {
      totalSavings,
      avgDiscount,
      avgRating,
      totalDeals: filteredDeals.length
    };
  }, [filteredDeals]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gradient-to-r from-gray-300 to-gray-400"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border">
                  <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <DealsHero />

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.totalDeals}</div>
              <div className="text-sm text-gray-600">Active Deals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalSavings.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.avgDiscount.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Discount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.avgRating.toFixed(1)}★
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <DealsFilterBar
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onViewChange={handleViewChange}
        currentView={viewMode}
        totalProducts={filteredDeals.length}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-xl mb-4">No deals found</div>
            <p className="text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredDeals.filter(deal => deal && deal.id).map((deal) => (
              <DealProductCard
                key={deal.id}
                product={deal}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Deal</h2>
          <p className="text-gray-300 mb-8">
            Get notified about new deals and exclusive offers before anyone else
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
