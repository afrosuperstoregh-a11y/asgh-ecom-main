'use client';

import React, { useState, useEffect } from 'react';
import { HeroSection } from '@/components/about/HeroSection';
import { FilterSortBar } from '@/components/about/FilterSortBar';
import { ProductGrid } from '@/components/about/ProductGrid';
import { api } from '@/lib/api/products';
import type { Product } from '@/lib/api/products';

export default function AboutPage() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all-products');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Load products and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products
        const productsResponse = await api.getProducts();
        const productsData = productsResponse.data?.products || [];
        setProductsList(productsData);
        
        // Load categories
        const categoriesResponse = await api.getCategories();
        const categoriesData = categoriesResponse.data || [];
        setCategoriesList(categoriesData);
        
        setFilteredProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setProductsList([]);
        setCategoriesList([]);
        setFilteredProducts([]);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter and sort products
  useEffect(() => {
    setLoading(true);
    
    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      let filtered = [...productsList];

      // Apply category filter
      if (selectedCategory !== 'all-products') {
        filtered = productsList.filter(product => 
          product && (product.category_name === selectedCategory || product.category_slug === selectedCategory)
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => {
            if (!a || !b) return 0;
            return (a.compare_price || a.price) - (b.compare_price || b.price);
          });
          break;
        case 'price-high':
          filtered.sort((a, b) => {
            if (!a || !b) return 0;
            return (b.compare_price || b.price) - (a.compare_price || a.price);
          });
          break;
        case 'name-asc':
          filtered.sort((a, b) => {
            if (!a || !b) return 0;
            return (a.name || '').localeCompare(b.name || '');
          });
          break;
        case 'name-desc':
          filtered.sort((a, b) => {
            if (!a || !b) return 0;
            return (b.name || '').localeCompare(a.name || '');
          });
          break;
        case 'featured':
        default:
          // Keep original order or apply featured logic
          filtered.sort((a, b) => {
            if (!a || !b) return 0;
            // Featured items first (those with compare_price lower than price or new tags)
            const aFeatured = (a.compare_price && a.compare_price < a.price) || (a.tags && a.tags.includes('new'));
            const bFeatured = (b.compare_price && b.compare_price < b.price) || (b.tags && b.tags.includes('new'));
            if (aFeatured && !bFeatured) return -1;
            if (!aFeatured && bFeatured) return 1;
            return 0;
          });
          break;
      }

      setFilteredProducts(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, sortBy, productsList]);

  const handleBuyNow = (productId: string) => {
    console.log('Buy Now clicked for product:', productId);
    // Here you would typically add to cart or navigate to checkout
    alert(`Product ${productId} added to cart!`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const categoryOptions = ['all-products', ...categoriesList.map((cat: any) => cat.id)];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection
        title="About Our Store"
        subtitle="Quality Products, Amazing Prices"
        description="Discover our carefully curated collection of premium products. From fashion to electronics, we offer the best quality at unbeatable prices."
        ctaText="Explore Products"
      />

      {/* Filter and Sort Bar */}
      <FilterSortBar
        categories={categoryOptions}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onFilterToggle={() => setShowFilters(!showFilters)}
      />

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {productsList.length} products
          </p>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          onBuyNow={handleBuyNow}
          loading={loading}
        />
      </div>

      {/* Features Section */}
      <section className="bg-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Shop With Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to providing you with the best shopping experience possible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Shipping</h3>
              <p className="text-gray-600">Free shipping on orders over $50. Quick delivery to your doorstep.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">All products are carefully selected and quality checked.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Our customer service team is always here to help you.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
