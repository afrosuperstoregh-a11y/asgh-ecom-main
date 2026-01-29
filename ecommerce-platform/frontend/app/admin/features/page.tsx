'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Settings,
  Database,
  Package,
  Tag,
  Users,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Feature {
  id: string;
  category: string;
  name: string;
  type: string;
  required: boolean;
  default_value: any;
  validation_rules: Record<string, any>;
  options: string[];
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FeatureStats {
  total: number;
  by_category: Record<string, number>;
  by_type: Record<string, number>;
  active: number;
  required: number;
}

export default function FeaturesManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<FeatureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const categories = ['all', 'product', 'category', 'promotion', 'customer'];
  const categoryIcons = {
    product: Package,
    category: Tag,
    promotion: Settings,
    customer: Users
  };

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/features');
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      setError('Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/features/stats');
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesActive = showInactive || feature.is_active;
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  const groupedFeatures = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const toggleFeatureStatus = async (featureId: string, isActive: boolean) => {
    try {
      await apiRequest(`/admin/features/${featureId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
      });
      
      setFeatures(features.map(f => 
        f.id === featureId ? { ...f, is_active: isActive } : f
      ));
      
      fetchStats();
    } catch (error) {
      console.error('Error toggling feature status:', error);
      setError('Failed to update feature status');
    }
  };

  const deleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    
    try {
      await apiRequest(`/admin/features/${featureId}`, {
        method: 'DELETE'
      });
      
      setFeatures(features.filter(f => f.id !== featureId));
      fetchStats();
    } catch (error) {
      console.error('Error deleting feature:', error);
      setError('Failed to delete feature');
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-gray-100 text-gray-800',
      number: 'bg-blue-100 text-blue-800',
      boolean: 'bg-green-100 text-green-800',
      datetime: 'bg-purple-100 text-purple-800',
      url: 'bg-indigo-100 text-indigo-800',
      text: 'bg-yellow-100 text-yellow-800',
      select: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Features Manager</h1>
            <p className="text-gray-600 mt-2">Manage dynamic features for products, categories, promotions, and customers</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Features</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Required</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.required}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold text-gray-900">{Object.keys(stats.by_category).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showInactive 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <Eye className="h-4 w-4 mr-2 inline" />
                {showInactive ? 'Show All' : 'Active Only'}
              </button>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="bg-white rounded-lg shadow">
                <div 
                  className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategoryExpansion(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {Icon && <Icon className="h-5 w-5 text-gray-600 mr-3" />}
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{category}</h3>
                      <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {categoryFeatures.length} features
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {categoryFeatures.map(feature => (
                      <div key={feature.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{feature.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(feature.type)}`}>
                                {feature.type}
                              </span>
                              {feature.required && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  Required
                                </span>
                              )}
                              {!feature.is_active && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            {feature.options && feature.options.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Options: {feature.options.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => toggleFeatureStatus(feature.id, !feature.is_active)}
                              className={`p-2 rounded-lg transition-colors ${
                                feature.is_active 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={feature.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {feature.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteFeature(feature.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
