import { Request, Response } from 'express';
import { db } from '../config/database';
import { redisClient } from '../config/redis';
import { ApiResponseUtil, createPaginationMetadata } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ProductStatus } from '../types/enums';

export class ProductController {
  // GET /api/products - Get all products with pagination and filtering
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sort = 'desc',
      category,
      minPrice,
      maxPrice,
      featured,
      q: search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    
    // Try to get from cache first
    const cachedProducts = await redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
      return ApiResponseUtil.paginated(res, cachedProducts, {
        page: pageNum,
        limit: limitNum,
        total: cachedProducts.length,
        totalPages: Math.ceil(cachedProducts.length / limitNum),
        hasNext: false,
        hasPrev: pageNum > 1
      });
    }

    // Build where clause
    const where: any = {
      status: ProductStatus.ACTIVE
    };

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { shortDesc: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await db.product.count({ where });

    // Get products with pagination
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sort
      },
      skip,
      take: limitNum
    });

    // Cache the results
    await redisClient.cacheProductsList(cacheKey, products);

    const pagination = createPaginationMetadata(pageNum, limitNum, total);

    return ApiResponseUtil.paginated(res, products, pagination);
  });

  // GET /api/products/:id - Get single product by ID
  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Try to get from cache first
    const cachedProduct = await redisClient.getCachedProduct(id);
    if (cachedProduct) {
      return ApiResponseUtil.success(res, cachedProduct);
    }

    const product = await db.product.findUnique({
      where: { 
        id,
        status: ProductStatus.ACTIVE 
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        reviews: {
          where: { verified: true },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Cache the product
    await redisClient.cacheProduct(id, product);

    return ApiResponseUtil.success(res, product);
  });

  // GET /api/products/featured - Get featured products
  static getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { limit = '8' } = req.query;
    const limitNum = parseInt(limit as string);

    const cacheKey = `products:featured:${limit}`;
    
    // Try cache first
    const cachedProducts = await redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
      return ApiResponseUtil.success(res, cachedProducts);
    }

    const products = await db.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        featured: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum
    });

    // Cache the results
    await redisClient.cacheProductsList(cacheKey, products);

    return ApiResponseUtil.success(res, products);
  });

  // GET /api/products/related/:id - Get related products
  static getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = '4' } = req.query;
    const limitNum = parseInt(limit as string);

    const cacheKey = `products:related:${id}:${limit}`;
    
    // Try cache first
    const cachedProducts = await redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
      return ApiResponseUtil.success(res, cachedProducts);
    }

    // First get the product to find its category
    const product = await db.product.findUnique({
      where: { id },
      select: { categoryId: true }
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Get related products from same category
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        status: ProductStatus.ACTIVE,
        id: { not: id }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum
    });

    // Cache the results
    await redisClient.cacheProductsList(cacheKey, relatedProducts);

    return ApiResponseUtil.success(res, relatedProducts);
  });

  // GET /api/products/search - Search products
  static searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
      q: query,
      page = '1',
      limit = '20',
      category,
      minPrice,
      maxPrice
    } = req.query;

    if (!query) {
      throw ApiError.badRequest('Search query is required');
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `search:${query}:${JSON.stringify(req.query)}`;
    
    // Try cache first
    const cachedResults = await redisClient.getCachedSearchResults(query as string);
    if (cachedResults) {
      const paginatedResults = cachedResults.slice(skip, skip + limitNum);
      return ApiResponseUtil.paginated(res, paginatedResults, {
        page: pageNum,
        limit: limitNum,
        total: cachedResults.length,
        totalPages: Math.ceil(cachedResults.length / limitNum),
        hasNext: pageNum * limitNum < cachedResults.length,
        hasPrev: pageNum > 1
      });
    }

    // Build where clause for search
    const where: any = {
      status: ProductStatus.ACTIVE,
      OR: [
        { name: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } },
        { shortDesc: { contains: query as string, mode: 'insensitive' } },
        { sku: { contains: query as string, mode: 'insensitive' } }
      ]
    };

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Get total count
    const total = await db.product.count({ where });

    // Get search results
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    // Cache search results
    await redisClient.cacheSearchResults(query as string, products);

    const pagination = createPaginationMetadata(pageNum, limitNum, total);

    return ApiResponseUtil.paginated(res, products, pagination);
  });

  // GET /api/products/categories - Get all categories
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const cacheKey = 'categories:all';
    
    // Try cache first
    const cachedCategories = await redisClient.getJSON(cacheKey);
    if (cachedCategories) {
      return ApiResponseUtil.success(res, cachedCategories);
    }

    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: ProductStatus.ACTIVE }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Cache the results
    await redisClient.setJSON(cacheKey, categories, 7200); // 2 hours

    return ApiResponseUtil.success(res, categories);
  });

  // GET /api/products/category/:slug - Get products by category slug
  static getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sort = 'desc',
      minPrice,
      maxPrice
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Find the category first
    const category = await db.category.findUnique({
      where: { slug, isActive: true }
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    const cacheKey = `products:category:${slug}:${JSON.stringify(req.query)}`;
    
    // Try cache first
    const cachedProducts = await redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
      return ApiResponseUtil.paginated(res, cachedProducts, {
        page: pageNum,
        limit: limitNum,
        total: cachedProducts.length,
        totalPages: Math.ceil(cachedProducts.length / limitNum),
        hasNext: false,
        hasPrev: pageNum > 1
      });
    }

    // Build where clause
    const where: any = {
      categoryId: category.id,
      status: ProductStatus.ACTIVE
    };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Get total count
    const total = await db.product.count({ where });

    // Get products
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        [sortBy as string]: sort
      },
      skip,
      take: limitNum
    });

    // Cache the results
    await redisClient.cacheProductsList(cacheKey, products);

    const pagination = createPaginationMetadata(pageNum, limitNum, total);

    return ApiResponseUtil.paginated(res, products, pagination);
  });
}
