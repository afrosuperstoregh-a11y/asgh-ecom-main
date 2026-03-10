const productService = require('../services/productService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

class ProductController {
  // GET /api/products - Get all products
  async getProducts(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC',
        category: req.query.category,
        search: req.query.search,
        status: req.query.status || 'active',
        featured: req.query.featured ? req.query.featured === 'true' : undefined
      };

      const result = await productService.getProducts(options);

      res.json({
        success: true,
        data: result,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve products',
        message: error.message
      });
    }
  }

  // GET /api/products/:id - Get single product
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      console.error('Get product error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve product',
        message: error.message
      });
    }
  }

  // POST /api/products - Create new product (admin only)
  async createProduct(req, res) {
    try {
      const productData = req.body;
      const userId = req.user.userId; // From auth middleware

      const product = await productService.createProduct(productData, userId);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        message: error.message
      });
    }
  }

  // PUT /api/products/:id - Update product (admin only)
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;
      const userId = req.user.userId;

      const product = await productService.updateProduct(id, productData, userId);

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Update product error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        message: error.message
      });
    }
  }

  // DELETE /api/products/:id - Delete product (admin only)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        message: error.message
      });
    }
  }

  // GET /api/products/categories - Get categories
  async getCategories(req, res) {
    try {
      const categories = await productService.getCategories();

      res.json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve categories',
        message: error.message
      });
    }
  }

  // POST /api/products/:id/stock - Update stock (admin only)
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation = 'set' } = req.body;

      if (quantity === undefined || quantity === null) {
        return res.status(400).json({
          success: false,
          error: 'Quantity is required',
          message: 'Please provide a valid quantity'
        });
      }

      const result = await productService.updateStock(id, parseInt(quantity), operation);

      res.json({
        success: true,
        data: result,
        message: 'Stock updated successfully'
      });
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update stock',
        message: error.message
      });
    }
  }
}

module.exports = new ProductController();
