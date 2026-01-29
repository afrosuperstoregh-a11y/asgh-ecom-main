const express = require('express');
const router = express.Router();
const FeatureCollector = require('../utils/feature_collector');

// Initialize feature collector
const featureCollector = new FeatureCollector();

// Initialize on startup
featureCollector.initialize().catch(console.error);

/**
 * GET /api/admin/features
 * Get all features with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, type, active_only } = req.query;
    
    let features = [];
    
    if (category && category !== 'all') {
      const categoryFeatures = featureCollector.getFeaturesByCategory(category);
      features = Object.values(categoryFeatures);
    } else {
      // Get all features
      featureCollector.features.forEach(feature => {
        features.push(feature);
      });
    }
    
    // Apply filters
    if (type) {
      features = features.filter(f => f.type === type);
    }
    
    if (active_only === 'true') {
      features = features.filter(f => f.is_active);
    }
    
    // Sort by category and name
    features.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      success: true,
      features,
      total: features.length
    });
    
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features'
    });
  }
});

/**
 * GET /api/admin/features/stats
 * Get feature statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = featureCollector.getFeatureStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching feature stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature statistics'
    });
  }
});

/**
 * GET /api/admin/features/:category
 * Get features for a specific category
 */
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const features = featureCollector.getFeaturesByCategory(category);
    
    res.json({
      success: true,
      features,
      total: Object.keys(features).length
    });
    
  } catch (error) {
    console.error('Error fetching category features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category features'
    });
  }
});

/**
 * GET /api/admin/features/:category/:name
 * Get a specific feature
 */
router.get('/:category/:name', async (req, res) => {
  try {
    const { category, name } = req.params;
    const feature = featureCollector.getFeature(category, name);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    res.json({
      success: true,
      feature
    });
    
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature'
    });
  }
});

/**
 * POST /api/admin/features
 * Create a new feature
 */
router.post('/', async (req, res) => {
  try {
    const featureData = {
      category: req.body.category,
      name: req.body.name,
      type: req.body.type || 'string',
      required: req.body.required || false,
      default_value: req.body.default_value,
      validation_rules: req.body.validation_rules || {},
      options: req.body.options || [],
      description: req.body.description,
      is_active: req.body.is_active !== false,
      sort_order: req.body.sort_order || 0
    };
    
    // Validate required fields
    if (!featureData.category || !featureData.name) {
      return res.status(400).json({
        success: false,
        message: 'Category and name are required'
      });
    }
    
    // Check if feature already exists
    const existingFeature = featureCollector.getFeature(featureData.category, featureData.name);
    if (existingFeature) {
      return res.status(409).json({
        success: false,
        message: 'Feature already exists'
      });
    }
    
    const newFeature = await featureCollector.addFeature(featureData);
    
    res.status(201).json({
      success: true,
      message: 'Feature created successfully',
      feature: newFeature
    });
    
  } catch (error) {
    console.error('Error creating feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feature'
    });
  }
});

/**
 * PUT /api/admin/features/:id
 * Update a feature
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find the feature
    let featureToUpdate = null;
    featureCollector.features.forEach((feature, key) => {
      if (feature.id === id) {
        featureToUpdate = { category: feature.category, name: feature.name };
      }
    });
    
    if (!featureToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    const updatedFeature = await featureCollector.updateFeature(
      featureToUpdate.category, 
      featureToUpdate.name, 
      updates
    );
    
    res.json({
      success: true,
      message: 'Feature updated successfully',
      feature: updatedFeature
    });
    
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feature'
    });
  }
});

/**
 * DELETE /api/admin/features/:id
 * Delete a feature
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the feature
    let featureToDelete = null;
    featureCollector.features.forEach((feature, key) => {
      if (feature.id === id) {
        featureToDelete = { category: feature.category, name: feature.name };
      }
    });
    
    if (!featureToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    await featureCollector.deleteFeature(featureToDelete.category, featureToDelete.name);
    
    res.json({
      success: true,
      message: 'Feature deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feature'
    });
  }
});

/**
 * POST /api/admin/features/validate
 * Validate a feature value
 */
router.post('/validate', async (req, res) => {
  try {
    const { category, name, value } = req.body;
    
    if (!category || !name) {
      return res.status(400).json({
        success: false,
        message: 'Category and name are required'
      });
    }
    
    const feature = featureCollector.getFeature(category, name);
    
    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }
    
    const validation = featureCollector.validateFeatureValue(feature, value);
    
    res.json({
      success: true,
      validation
    });
    
  } catch (error) {
    console.error('Error validating feature value:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate feature value'
    });
  }
});

/**
 * POST /api/admin/features/refresh
 * Refresh feature cache
 */
router.post('/refresh', async (req, res) => {
  try {
    await featureCollector.refreshCache();
    
    res.json({
      success: true,
      message: 'Feature cache refreshed successfully'
    });
    
  } catch (error) {
    console.error('Error refreshing feature cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh feature cache'
    });
  }
});

/**
 * GET /api/admin/features/export
 * Export features to JSON
 */
router.get('/export', async (req, res) => {
  try {
    const features = [];
    
    featureCollector.features.forEach(feature => {
      features.push({
        category: feature.category,
        name: feature.name,
        type: feature.type,
        required: feature.required,
        default_value: feature.default_value,
        validation_rules: feature.validation_rules,
        options: feature.options,
        description: feature.description,
        is_active: feature.is_active,
        sort_order: feature.sort_order
      });
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="features.json"');
    
    res.json({
      exported_at: new Date().toISOString(),
      total_features: features.length,
      features
    });
    
  } catch (error) {
    console.error('Error exporting features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export features'
    });
  }
});

/**
 * POST /api/admin/features/import
 * Import features from JSON
 */
router.post('/import', async (req, res) => {
  try {
    const { features } = req.body;
    
    if (!Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: 'Features must be an array'
      });
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = [];
    
    for (const featureData of features) {
      try {
        // Check if feature already exists
        const existingFeature = featureCollector.getFeature(featureData.category, featureData.name);
        
        if (existingFeature) {
          skipped++;
          continue;
        }
        
        await featureCollector.addFeature(featureData);
        imported++;
        
      } catch (error) {
        errors.push({
          feature: featureData.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error importing features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import features'
    });
  }
});

module.exports = router;
