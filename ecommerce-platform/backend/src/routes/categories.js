const express = require('express');
const router = express.Router();

// Mock categories data (in production, this would come from database)
const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'books',
    name: 'Books',
    description: 'Books and educational materials',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    description: 'Home decor and furniture',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Fashion accessories and jewelry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Get all categories
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get single category
router.get('/:id', (req, res) => {
  try {
    const category = categories.find(c => c.id === req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// Create new category
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const newCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// Update category
router.put('/:id', (req, res) => {
  try {
    const index = categories.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const { name, description } = req.body;
    
    const updatedCategory = {
      ...categories[index],
      name: name || categories[index].name,
      description: description !== undefined ? description : categories[index].description,
      updatedAt: new Date().toISOString()
    };
    
    categories[index] = updatedCategory;
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// Delete category
router.delete('/:id', (req, res) => {
  try {
    const index = categories.findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    categories.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
