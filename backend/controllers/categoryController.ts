import { Request, Response } from 'express'
import categoryService from '../services/categoryService'
import { asyncHandler, createError } from '../middleware/errorHandler'

class CategoryController {
  // GET /api/categories - Get all categories (public)
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.getCategories()
    res.json(result)
  })

  // GET /api/categories/:id - Get single category (public)
  getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const category = await categoryService.getCategoryById(id)
    
    res.json({
      success: true,
      data: category,
      message: 'Category retrieved successfully'
    })
  })

  // GET /api/categories/tree/all - Get category tree (hierarchical structure)
  getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.getCategoryTree()
    res.json(result)
  })

  // POST /api/categories - Create category (admin only)
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const categoryData = req.body
    const userId = req.user?.userId

    if (!userId) {
      throw createError('User authentication required', 401, 'AUTH_REQUIRED')
    }

    const result = await categoryService.createCategory(categoryData, userId)
    res.status(201).json(result)
  })

  // PUT /api/categories/:id - Update category (admin only)
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const categoryData = req.body
    const userId = req.user?.userId

    if (!userId) {
      throw createError('User authentication required', 401, 'AUTH_REQUIRED')
    }

    const result = await categoryService.updateCategory(id, categoryData, userId)
    res.json(result)
  })

  // DELETE /api/categories/:id - Delete category (admin only)
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await categoryService.deleteCategory(id)
    res.json(result)
  })

  // GET /api/categories/admin/all - Get all categories (admin - includes inactive)
  getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.getAllCategories()
    res.json(result)
  })
}

export default new CategoryController()
