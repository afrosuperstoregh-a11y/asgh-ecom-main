const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

// Mock data storage (in production, this would be a database)
let products = [
  {
    id: '1',
    name: 'Sample Product 1',
    sku: 'SP001',
    price: 29.99,
    comparePrice: 39.99,
    cost: 15.00,
    description: 'This is a sample product description',
    shortDesc: 'Sample product',
    status: 'ACTIVE',
    featured: true,
    stock: 50,
    trackInventory: true,
    weight: 1.5,
    dimensions: {
      length: 10,
      width: 8,
      height: 5
    },
    categoryId: 'electronics',
    category: {
      id: 'electronics',
      name: 'Electronics'
    },
    tags: ['sample', 'electronics'],
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      orderItems: 5
    }
  },
  {
    id: '2',
    name: 'Sample Product 2',
    sku: 'SP002',
    price: 19.99,
    description: 'Another sample product',
    status: 'DRAFT',
    featured: false,
    stock: 25,
    trackInventory: true,
    categoryId: 'clothing',
    category: {
      id: 'clothing',
      name: 'Clothing'
    },
    tags: ['sample', 'clothing'],
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      orderItems: 2
    }
  }
];

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all products with pagination and filtering
router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = '',
      featured = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredProducts = [...products];

    // Apply filters
    if (search) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.categoryId === category
      );
    }

    if (status) {
      filteredProducts = filteredProducts.filter(product => 
        product.status === status
      );
    }

    if (featured !== '') {
      const isFeatured = featured === 'true';
      filteredProducts = filteredProducts.filter(product => 
        product.featured === isFeatured
      );
    }

    // Apply sorting
    filteredProducts.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'price' || sortBy === 'stock') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(filteredProducts.length / limitNum);
    
    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredProducts.length,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

// Create new product
router.post('/', (req, res) => {
  try {
    const newProduct = {
      id: (products.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        orderItems: 0
      }
    };
    
    // Add category object
    const categories = {
      'electronics': { id: 'electronics', name: 'Electronics' },
      'clothing': { id: 'clothing', name: 'Clothing' },
      'books': { id: 'books', name: 'Books' }
    };
    
    newProduct.category = categories[newProduct.categoryId] || { id: newProduct.categoryId, name: 'Unknown' };
    
    products.push(newProduct);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const updatedProduct = {
      ...products[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Update category object if categoryId changed
    const categories = {
      'electronics': { id: 'electronics', name: 'Electronics' },
      'clothing': { id: 'clothing', name: 'Clothing' },
      'books': { id: 'books', name: 'Books' }
    };
    
    updatedProduct.category = categories[updatedProduct.categoryId] || { id: updatedProduct.categoryId, name: 'Unknown' };
    
    products[index] = updatedProduct;
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    products.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// Import products from CSV
router.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];
    
    // Create readable stream from buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    
    bufferStream
      .pipe(csv())
      .on('data', (data) => {
        try {
          const product = {
            id: (products.length + results.length + 1).toString(),
            name: data.name || '',
            sku: data.sku || '',
            price: parseFloat(data.price) || 0,
            comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
            cost: data.cost ? parseFloat(data.cost) : null,
            description: data.description || '',
            shortDesc: data.shortDesc || '',
            status: data.status || 'DRAFT',
            featured: data.featured === 'true' || data.featured === 'TRUE',
            stock: parseInt(data.stock) || 0,
            trackInventory: data.trackInventory !== 'false' && data.trackInventory !== 'FALSE',
            weight: data.weight ? parseFloat(data.weight) : null,
            dimensions: (data.length || data.width || data.height) ? {
              length: data.length ? parseFloat(data.length) : null,
              width: data.width ? parseFloat(data.width) : null,
              height: data.height ? parseFloat(data.height) : null
            } : null,
            categoryId: data.categoryId || 'uncategorized',
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            images: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: {
              orderItems: 0
            }
          };
          
          // Add category object
          const categories = {
            'electronics': { id: 'electronics', name: 'Electronics' },
            'clothing': { id: 'clothing', name: 'Clothing' },
            'books': { id: 'books', name: 'Books' }
          };
          
          product.category = categories[product.categoryId] || { id: product.categoryId, name: 'Unknown' };
          
          results.push(product);
        } catch (error) {
          errors.push({
            row: results.length + 1,
            error: error.message
          });
        }
      })
      .on('end', () => {
        // Add valid products to the array
        products.push(...results);
        
        res.json({
          success: true,
          message: `Successfully imported ${results.length} products`,
          imported: results.length,
          errors: errors
        });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to parse CSV file'
        });
      });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import products'
    });
  }
});

// Export products to CSV
router.get('/export', (req, res) => {
  try {
    const csvHeader = 'id,name,sku,price,comparePrice,cost,description,shortDesc,status,featured,stock,trackInventory,weight,length,width,height,categoryId,tags\n';
    
    const csvData = products.map(product => {
      return [
        product.id,
        `"${product.name}"`,
        product.sku,
        product.price,
        product.comparePrice || '',
        product.cost || '',
        `"${product.description}"`,
        `"${product.shortDesc}"`,
        product.status,
        product.featured,
        product.stock,
        product.trackInventory,
        product.weight || '',
        product.dimensions?.length || '',
        product.dimensions?.width || '',
        product.dimensions?.height || '',
        product.categoryId,
        `"${product.tags.join(',')}"`
      ].join(',');
    }).join('\n');
    
    const csv = csvHeader + csvData;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export products'
    });
  }
});

module.exports = router;
