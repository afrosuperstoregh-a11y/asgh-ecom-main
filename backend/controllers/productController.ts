/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express'
import productService from '../services/productService'
import { asyncHandler, createError } from '../middleware/errorHandler'

class ProductController {
  // GET /api/products - Get all products
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 1000), // Increased max limit to 1000
      sort: req.query.sort as string || 'created_at',
      order: (req.query.order as 'ASC' | 'DESC') || 'DESC',
      category: req.query.category as string,
      search: req.query.search as string,
      status: req.query.status as string, // Removed default 'active' filter
      featured: req.query.featured ? req.query.featured === 'true' : undefined
    }

    const result = await productService.getProducts(options)

    res.json({
      success: true,
      data: result,
      message: 'Products retrieved successfully - ALL STATUSES'
    })
  })

  // GET /api/products/:id - Get single product
  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const product = await productService.getProductById(Array.isArray(id) ? id[0] : id)

    res.json({
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    })
  })

  // POST /api/products - Create new product (admin only)
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body
    const userId = req.user?.userId

    if (!userId) {
      throw createError('User authentication required', 401, 'AUTH_REQUIRED')
    }

    const product = await productService.createProduct(productData, userId)

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    })
  })

  // PUT /api/products/:id - Update product (admin only)
  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const productData = req.body
    const userId = req.user?.userId

    if (!userId) {
      throw createError('User authentication required', 401, 'AUTH_REQUIRED')
    }

    const product = await productService.updateProduct(Array.isArray(id) ? id[0] : id, productData, userId)

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    })
  })

  // DELETE /api/products/:id - Delete product (admin only)
  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await productService.deleteProduct(Array.isArray(id) ? id[0] : id)

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  })

  // GET /api/products/categories - Get categories
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await productService.getCategories()

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    })
  })

  // POST /api/products/:id/stock - Update stock (admin only)
  updateStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { quantity, operation = 'set' } = req.body

    if (quantity === undefined || quantity === null) {
      throw createError('Quantity is required', 400, 'QUANTITY_REQUIRED')
    }

    const result = await productService.updateStock(Array.isArray(id) ? id[0] : id, parseInt(quantity.toString()), operation)

    res.json({
      success: true,
      data: result,
      message: 'Stock updated successfully'
    })
  })

  // PATCH /api/products/bulk-activate - Bulk activate all products (admin only)
  bulkActivateProducts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId

    if (!userId) {
      throw createError('User authentication required', 401, 'AUTH_REQUIRED')
    }

    const result = await productService.bulkActivateProducts(userId)

    res.json({
      success: true,
      data: result,
      message: 'All products activated successfully'
    })
  })
}

export default new ProductController()
