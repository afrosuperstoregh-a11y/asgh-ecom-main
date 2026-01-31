/**
 * Feature Collector System
 * Collects and manages features for products, categories, promotions, and other ecommerce entities
 * Integrates with Supabase for real-time feature storage and retrieval
 */

const { createClient } = require('@supabase/supabase-js');

class FeatureCollector {
  constructor() {
    this.supabase = createClient({
      url: process.env.SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_KEY
    });
    this.features = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.lastCacheUpdate = 0;
  }

  /**
   * Initialize feature collector with default features
   */
  async initialize() {
    console.log('🔧 Initializing Feature Collector...');
    
    // Define default feature categories
    this.defaultFeatures = {
      product: {
        attributes: [
          'brand', 'color', 'size', 'material', 'weight', 
          'dimensions', 'warranty', 'origin', 'care_instructions'
        ],
        variants: [
          'size', 'color', 'material', 'style', 'pattern'
        ],
        pricing: [
          'base_price', 'sale_price', 'bulk_discount', 'member_price'
        ],
        inventory: [
          'stock_quantity', 'low_stock_threshold', 'backorder_allowed',
          'track_inventory', 'allow_negative_stock'
        ],
        shipping: [
          'weight', 'dimensions', 'free_shipping', 'shipping_class',
          'shipping_restrictions', 'hazmat'
        ],
        digital: [
          'downloadable', 'license_key', 'access_duration', 'download_limit'
        ]
      },
      category: {
        display: [
          'featured_image', 'banner_image', 'icon', 'description',
          'sort_order', 'is_featured'
        ],
        seo: [
          'meta_title', 'meta_description', 'meta_keywords',
          'canonical_url', 'structured_data'
        ],
        navigation: [
          'parent_category', 'children', 'depth_level',
          'url_slug', 'redirect_url'
        ]
      },
      promotion: {
        discount: [
          'percentage_off', 'fixed_amount_off', 'buy_x_get_y',
          'free_shipping', 'free_gift'
        ],
        conditions: [
          'minimum_order_value', 'product_inclusion', 'exclusion_rules',
          'customer_segment', 'usage_limit'
        ],
        scheduling: [
          'start_date', 'end_date', 'recurring', 'seasonal'
        ]
      },
      customer: {
        profile: [
          'name', 'email', 'phone', 'date_of_birth', 'gender',
          'preferences', 'communication_settings'
        ],
        segmentation: [
          'customer_tier', 'purchase_history', 'behavioral_data',
          'location', 'demographics'
        ],
        loyalty: [
          'points_balance', 'tier_level', 'rewards_earned',
          'expiry_dates', 'redemption_history'
        ]
      }
    };

    // Load existing features from database
    await this.loadFeaturesFromDatabase();
    
    console.log('✅ Feature Collector initialized successfully');
  }

  /**
   * Load features from Supabase database
   */
  async loadFeaturesFromDatabase() {
    try {
      const { data, error } = await this.supabase
        .from('features')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('❌ Error loading features from database:', error);
        // Use default features if database fails
        this.loadDefaultFeatures();
        return;
      }

      // Process and cache features
      data.forEach(feature => {
        const key = `${feature.category}_${feature.name}`;
        this.features.set(key, {
          id: feature.id,
          category: feature.category,
          name: feature.name,
          type: feature.type,
          required: feature.required || false,
          default_value: feature.default_value,
          validation_rules: feature.validation_rules || {},
          options: feature.options || [],
          description: feature.description,
          is_active: feature.is_active !== false
        });
      });

      // If no features in database, load defaults
      if (data.length === 0) {
        await this.loadDefaultFeatures();
      }

      this.lastCacheUpdate = Date.now();
      console.log(`📊 Loaded ${this.features.size} features from database`);

    } catch (error) {
      console.error('❌ Failed to load features from database:', error);
      this.loadDefaultFeatures();
    }
  }

  /**
   * Load default features into database
   */
  async loadDefaultFeatures() {
    console.log('🔄 Loading default features...');
    
    for (const [category, featureGroups] of Object.entries(this.defaultFeatures)) {
      for (const [group, featureList] of Object.entries(featureGroups)) {
        for (const featureName of featureList) {
          const key = `${category}_${featureName}`;
          
          if (!this.features.has(key)) {
            const featureData = {
              category,
              name: featureName,
              type: this.inferFeatureType(featureName),
              required: this.isRequiredFeature(featureName),
              default_value: this.getDefaultValue(featureName),
              validation_rules: this.getValidationRules(featureName),
              options: this.getFeatureOptions(featureName),
              description: this.generateFeatureDescription(featureName, category, group),
              is_active: true,
              created_at: new Date().toISOString()
            };

            this.features.set(key, featureData);

            // Save to database
            try {
              await this.supabase
                .from('features')
                .insert(featureData);
            } catch (error) {
              console.error(`❌ Error saving feature ${featureName}:`, error);
            }
          }
        }
      }
    }
  }

  /**
   * Infer feature type based on name
   */
  inferFeatureType(featureName) {
    const name = featureName.toLowerCase();
    
    if (name.includes('price') || name.includes('amount') || name.includes('value')) {
      return 'number';
    } else if (name.includes('date') || name.includes('time')) {
      return 'datetime';
    } else if (name.includes('url') || name.includes('image') || name.includes('redirect')) {
      return 'url';
    } else if (name.includes('description') || name.includes('instructions')) {
      return 'text';
    } else if (name.includes('is_') || name.includes('has_') || name.includes('allow_') || name.includes('track_')) {
      return 'boolean';
    } else if (name.includes('color') || name.includes('size') || name.includes('material')) {
      return 'select';
    } else {
      return 'string';
    }
  }

  /**
   * Determine if feature is required
   */
  isRequiredFeature(featureName) {
    const requiredFeatures = [
      'name', 'email', 'base_price', 'stock_quantity', 'url_slug'
    ];
    return requiredFeatures.includes(featureName.toLowerCase());
  }

  /**
   * Get default value for feature
   */
  getDefaultValue(featureName) {
    const name = featureName.toLowerCase();
    
    if (name.includes('is_') || name.includes('has_') || name.includes('allow_')) {
      return false;
    } else if (name.includes('quantity') || name.includes('threshold')) {
      return 0;
    } else if (name.includes('percentage')) {
      return 0;
    } else {
      return null;
    }
  }

  /**
   * Get validation rules for feature
   */
  getValidationRules(featureName) {
    const name = featureName.toLowerCase();
    const rules = {};

    if (name.includes('email')) {
      rules.format = 'email';
    } else if (name.includes('url')) {
      rules.format = 'url';
    } else if (name.includes('price') || name.includes('amount')) {
      rules.min = 0;
      rules.type = 'number';
    } else if (name.includes('quantity')) {
      rules.min = 0;
      rules.type = 'integer';
    } else if (name.includes('percentage')) {
      rules.min = 0;
      rules.max = 100;
      rules.type = 'number';
    }

    return rules;
  }

  /**
   * Get options for select-type features
   */
  getFeatureOptions(featureName) {
    const name = featureName.toLowerCase();
    
    if (name.includes('color')) {
      return ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray'];
    } else if (name.includes('size')) {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    } else if (name.includes('material')) {
      return ['Cotton', 'Polyester', 'Wool', 'Silk', 'Denim', 'Leather', 'Nylon', 'Spandex'];
    } else if (name.includes('tier')) {
      return ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    }
    
    return [];
  }

  /**
   * Generate feature description
   */
  generateFeatureDescription(featureName, category, group) {
    const descriptions = {
      product: {
        attributes: `${featureName} attribute for product specification`,
        variants: `${featureName} variant option for product customization`,
        pricing: `${featureName} pricing configuration for product`,
        inventory: `${featureName} inventory management setting`,
        shipping: `${featureName} shipping configuration`,
        digital: `${featureName} digital product setting`
      },
      category: {
        display: `${featureName} category display setting`,
        seo: `${featureName} SEO optimization setting`,
        navigation: `${featureName} navigation configuration`
      },
      promotion: {
        discount: `${featureName} discount type configuration`,
        conditions: `${featureName} promotion condition setting`,
        scheduling: `${featureName} promotion scheduling option`
      },
      customer: {
        profile: `${featureName} customer profile information`,
        segmentation: `${featureName} customer segmentation data`,
        loyalty: `${featureName} customer loyalty program setting`
      }
    };

    return descriptions[category]?.[group] || `${featureName} feature for ${category}`;
  }

  /**
   * Get all features for a category
   */
  getFeaturesByCategory(category) {
    const categoryFeatures = {};
    
    this.features.forEach((feature, key) => {
      if (feature.category === category && feature.is_active) {
        categoryFeatures[feature.name] = feature;
      }
    });

    return categoryFeatures;
  }

  /**
   * Get specific feature
   */
  getFeature(category, name) {
    const key = `${category}_${name}`;
    return this.features.get(key);
  }

  /**
   * Add new feature
   */
  async addFeature(featureData) {
    try {
      const key = `${featureData.category}_${featureData.name}`;
      
      // Add to cache
      this.features.set(key, {
        ...featureData,
        is_active: true,
        created_at: new Date().toISOString()
      });

      // Save to database
      const { data, error } = await this.supabase
        .from('features')
        .insert(featureData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Added new feature: ${featureData.name}`);
      return data;

    } catch (error) {
      console.error('❌ Error adding feature:', error);
      throw error;
    }
  }

  /**
   * Update feature
   */
  async updateFeature(category, name, updates) {
    try {
      const key = `${category}_${name}`;
      const existingFeature = this.features.get(key);
      
      if (!existingFeature) {
        throw new Error(`Feature ${name} not found in category ${category}`);
      }

      // Update cache
      this.features.set(key, {
        ...existingFeature,
        ...updates,
        updated_at: new Date().toISOString()
      });

      // Update database
      const { data, error } = await this.supabase
        .from('features')
        .update(updates)
        .eq('category', category)
        .eq('name', name)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Updated feature: ${name}`);
      return data;

    } catch (error) {
      console.error('❌ Error updating feature:', error);
      throw error;
    }
  }

  /**
   * Delete feature
   */
  async deleteFeature(category, name) {
    try {
      const key = `${category}_${name}`;
      
      // Remove from cache
      this.features.delete(key);

      // Delete from database
      const { error } = await this.supabase
        .from('features')
        .delete()
        .eq('category', category)
        .eq('name', name);

      if (error) {
        throw error;
      }

      console.log(`✅ Deleted feature: ${name}`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting feature:', error);
      throw error;
    }
  }

  /**
   * Validate feature value
   */
  validateFeatureValue(feature, value) {
    if (!feature || !feature.validation_rules) {
      return { valid: true };
    }

    const rules = feature.validation_rules;
    const errors = [];

    // Type validation
    if (rules.type === 'number' && isNaN(Number(value))) {
      errors.push('Value must be a number');
    } else if (rules.type === 'integer' && !Number.isInteger(Number(value))) {
      errors.push('Value must be an integer');
    }

    // Range validation
    if (rules.min !== undefined && Number(value) < rules.min) {
      errors.push(`Value must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && Number(value) > rules.max) {
      errors.push(`Value must be at most ${rules.max}`);
    }

    // Format validation
    if (rules.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push('Invalid email format');
    } else if (rules.format === 'url' && !/^https?:\/\/.+/.test(value)) {
      errors.push('Invalid URL format');
    }

    // Options validation
    if (feature.options && feature.options.length > 0 && !feature.options.includes(value)) {
      errors.push(`Value must be one of: ${feature.options.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get feature statistics
   */
  getFeatureStats() {
    const stats = {
      total: this.features.size,
      by_category: {},
      by_type: {},
      active: 0,
      required: 0
    };

    this.features.forEach(feature => {
      // Count by category
      stats.by_category[feature.category] = (stats.by_category[feature.category] || 0) + 1;
      
      // Count by type
      stats.by_type[feature.type] = (stats.by_type[feature.type] || 0) + 1;
      
      // Count active and required
      if (feature.is_active) stats.active++;
      if (feature.required) stats.required++;
    });

    return stats;
  }

  /**
   * Refresh cache from database
   */
  async refreshCache() {
    console.log('🔄 Refreshing feature cache...');
    this.features.clear();
    await this.loadFeaturesFromDatabase();
  }
}

module.exports = FeatureCollector;
