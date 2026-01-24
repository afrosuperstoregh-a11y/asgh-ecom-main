"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const response_1 = require("../utils/response");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../types/enums");
class ProductController {
}
exports.ProductController = ProductController;
_a = ProductController;
// GET /api/products - Get all products with pagination and filtering
ProductController.getProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '20', sortBy = 'createdAt', sort = 'desc', category, minPrice, maxPrice, featured, q: search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build cache key
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    // Try to get from cache first
    const cachedProducts = await redis_1.redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
        return response_1.ApiResponseUtil.paginated(res, cachedProducts, {
            page: pageNum,
            limit: limitNum,
            total: cachedProducts.length,
            totalPages: Math.ceil(cachedProducts.length / limitNum),
            hasNext: false,
            hasPrev: pageNum > 1
        });
    }
    // Build where clause
    const where = {
        status: enums_1.ProductStatus.ACTIVE
    };
    if (category) {
        where.categoryId = category;
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = parseFloat(minPrice);
        if (maxPrice)
            where.price.lte = parseFloat(maxPrice);
    }
    if (featured === 'true') {
        where.featured = true;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { shortDesc: { contains: search, mode: 'insensitive' } }
        ];
    }
    // Get total count for pagination
    const total = await database_1.db.product.count({ where });
    // Get products with pagination
    const products = await database_1.db.product.findMany({
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
            [sortBy]: sort
        },
        skip,
        take: limitNum
    });
    // Cache the results
    await redis_1.redisClient.cacheProductsList(cacheKey, products);
    const pagination = (0, response_1.createPaginationMetadata)(pageNum, limitNum, total);
    return response_1.ApiResponseUtil.paginated(res, products, pagination);
});
// GET /api/products/:id - Get single product by ID
ProductController.getProductById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Try to get from cache first
    const cachedProduct = await redis_1.redisClient.getCachedProduct(id);
    if (cachedProduct) {
        return response_1.ApiResponseUtil.success(res, cachedProduct);
    }
    const product = await database_1.db.product.findUnique({
        where: {
            id,
            status: enums_1.ProductStatus.ACTIVE
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
        throw ApiError_1.ApiError.notFound('Product not found');
    }
    // Cache the product
    await redis_1.redisClient.cacheProduct(id, product);
    return response_1.ApiResponseUtil.success(res, product);
});
// GET /api/products/featured - Get featured products
ProductController.getFeaturedProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { limit = '8' } = req.query;
    const limitNum = parseInt(limit);
    const cacheKey = `products:featured:${limit}`;
    // Try cache first
    const cachedProducts = await redis_1.redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
        return response_1.ApiResponseUtil.success(res, cachedProducts);
    }
    const products = await database_1.db.product.findMany({
        where: {
            status: enums_1.ProductStatus.ACTIVE,
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
    await redis_1.redisClient.cacheProductsList(cacheKey, products);
    return response_1.ApiResponseUtil.success(res, products);
});
// GET /api/products/related/:id - Get related products
ProductController.getRelatedProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { limit = '4' } = req.query;
    const limitNum = parseInt(limit);
    const cacheKey = `products:related:${id}:${limit}`;
    // Try cache first
    const cachedProducts = await redis_1.redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
        return response_1.ApiResponseUtil.success(res, cachedProducts);
    }
    // First get the product to find its category
    const product = await database_1.db.product.findUnique({
        where: { id },
        select: { categoryId: true }
    });
    if (!product) {
        throw ApiError_1.ApiError.notFound('Product not found');
    }
    // Get related products from same category
    const relatedProducts = await database_1.db.product.findMany({
        where: {
            categoryId: product.categoryId,
            status: enums_1.ProductStatus.ACTIVE,
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
    await redis_1.redisClient.cacheProductsList(cacheKey, relatedProducts);
    return response_1.ApiResponseUtil.success(res, relatedProducts);
});
// GET /api/products/search - Search products
ProductController.searchProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { q: query, page = '1', limit = '20', category, minPrice, maxPrice } = req.query;
    if (!query) {
        throw ApiError_1.ApiError.badRequest('Search query is required');
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const cacheKey = `search:${query}:${JSON.stringify(req.query)}`;
    // Try cache first
    const cachedResults = await redis_1.redisClient.getCachedSearchResults(query);
    if (cachedResults) {
        const paginatedResults = cachedResults.slice(skip, skip + limitNum);
        return response_1.ApiResponseUtil.paginated(res, paginatedResults, {
            page: pageNum,
            limit: limitNum,
            total: cachedResults.length,
            totalPages: Math.ceil(cachedResults.length / limitNum),
            hasNext: pageNum * limitNum < cachedResults.length,
            hasPrev: pageNum > 1
        });
    }
    // Build where clause for search
    const where = {
        status: enums_1.ProductStatus.ACTIVE,
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { shortDesc: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } }
        ]
    };
    if (category) {
        where.categoryId = category;
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = parseFloat(minPrice);
        if (maxPrice)
            where.price.lte = parseFloat(maxPrice);
    }
    // Get total count
    const total = await database_1.db.product.count({ where });
    // Get search results
    const products = await database_1.db.product.findMany({
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
    await redis_1.redisClient.cacheSearchResults(query, products);
    const pagination = (0, response_1.createPaginationMetadata)(pageNum, limitNum, total);
    return response_1.ApiResponseUtil.paginated(res, products, pagination);
});
// GET /api/products/categories - Get all categories
ProductController.getCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cacheKey = 'categories:all';
    // Try cache first
    const cachedCategories = await redis_1.redisClient.getJSON(cacheKey);
    if (cachedCategories) {
        return response_1.ApiResponseUtil.success(res, cachedCategories);
    }
    const categories = await database_1.db.category.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: {
                    products: {
                        where: { status: enums_1.ProductStatus.ACTIVE }
                    }
                }
            }
        },
        orderBy: { sortOrder: 'asc' }
    });
    // Cache the results
    await redis_1.redisClient.setJSON(cacheKey, categories, 7200); // 2 hours
    return response_1.ApiResponseUtil.success(res, categories);
});
// GET /api/products/category/:slug - Get products by category slug
ProductController.getProductsByCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { slug } = req.params;
    const { page = '1', limit = '20', sortBy = 'createdAt', sort = 'desc', minPrice, maxPrice } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Find the category first
    const category = await database_1.db.category.findUnique({
        where: { slug, isActive: true }
    });
    if (!category) {
        throw ApiError_1.ApiError.notFound('Category not found');
    }
    const cacheKey = `products:category:${slug}:${JSON.stringify(req.query)}`;
    // Try cache first
    const cachedProducts = await redis_1.redisClient.getCachedProductsList(cacheKey);
    if (cachedProducts) {
        return response_1.ApiResponseUtil.paginated(res, cachedProducts, {
            page: pageNum,
            limit: limitNum,
            total: cachedProducts.length,
            totalPages: Math.ceil(cachedProducts.length / limitNum),
            hasNext: false,
            hasPrev: pageNum > 1
        });
    }
    // Build where clause
    const where = {
        categoryId: category.id,
        status: enums_1.ProductStatus.ACTIVE
    };
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = parseFloat(minPrice);
        if (maxPrice)
            where.price.lte = parseFloat(maxPrice);
    }
    // Get total count
    const total = await database_1.db.product.count({ where });
    // Get products
    const products = await database_1.db.product.findMany({
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
            [sortBy]: sort
        },
        skip,
        take: limitNum
    });
    // Cache the results
    await redis_1.redisClient.cacheProductsList(cacheKey, products);
    const pagination = (0, response_1.createPaginationMetadata)(pageNum, limitNum, total);
    return response_1.ApiResponseUtil.paginated(res, products, pagination);
});
