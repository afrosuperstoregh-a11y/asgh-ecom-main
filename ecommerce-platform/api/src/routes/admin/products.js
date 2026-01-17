const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get products with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('category').optional().isString(),
  query('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  query('featured').optional().isBoolean(),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt', 'stock']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    page = 1,
    limit = 20,
    search,
    category,
    status,
    featured,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Build filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (status) {
    where.status = status;
  }

  if (featured !== undefined) {
    where.featured = featured === 'true';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        variants: {
          select: { id: true, sku: true, price: true, stock: true }
        },
        _count: {
          select: { orderItems: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single product
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      variants: {
        orderBy: { position: 'asc' }
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  });

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
}));

// Create product
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('shortDesc').optional().trim(),
  body('sku').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('cost').optional().isFloat({ min: 0 }),
  body('categoryId').isUUID(),
  body('trackInventory').optional().isBoolean(),
  body('stock').optional().isInt({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('dimensions').optional().isObject(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  body('featured').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const productData = {
    ...req.body,
    dimensions: req.body.dimensions ? JSON.stringify(req.body.dimensions) : null,
    tags: req.body.tags ? JSON.stringify(req.body.tags) : null
  };

  const product = await prisma.product.create({
    data: productData,
    include: {
      category: {
        select: { id: true, name: true }
      }
    }
  });

  // Log the creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'PRODUCT',
      resourceId: product.id,
      newValues: productData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(product);
}));

// Update product
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('shortDesc').optional().trim(),
  body('sku').optional().notEmpty().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('cost').optional().isFloat({ min: 0 }),
  body('categoryId').optional().isUUID(),
  body('trackInventory').optional().isBoolean(),
  body('stock').optional().isInt({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('dimensions').optional().isObject(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  body('featured').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: req.params.id }
  });

  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const updateData = { ...req.body };
  if (req.body.dimensions) {
    updateData.dimensions = JSON.stringify(req.body.dimensions);
  }
  if (req.body.tags) {
    updateData.tags = JSON.stringify(req.body.tags);
  }

  const updatedProduct = await prisma.product.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      category: {
        select: { id: true, name: true }
      }
    }
  });

  // Log the update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'PRODUCT',
      resourceId: updatedProduct.id,
      oldValues: existingProduct,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedProduct);
}));

// Delete product
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: req.params.id }
  });

  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await prisma.product.delete({
    where: { id: req.params.id }
  });

  // Log the deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'PRODUCT',
      resourceId: existingProduct.id,
      oldValues: existingProduct,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Product deleted successfully' });
}));

// Upload product images
router.post('/:id/images', upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No images uploaded' });
  }

  const product = await prisma.product.findUnique({
    where: { id: req.params.id }
  });

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
  
  const existingImages = product.images ? JSON.parse(product.images) : [];
  const updatedImages = [...existingImages, ...imageUrls];

  const updatedProduct = await prisma.product.update({
    where: { id: req.params.id },
    data: { images: JSON.stringify(updatedImages) }
  });

  res.json({
    message: 'Images uploaded successfully',
    images: imageUrls,
    product: updatedProduct
  });
}));

// Product variants management
router.get('/:id/variants', asyncHandler(async (req, res) => {
  const variants = await prisma.productVariant.findMany({
    where: { productId: req.params.id },
    orderBy: { position: 'asc' }
  });

  res.json(variants);
}));

router.post('/:id/variants', [
  body('name').notEmpty().trim(),
  body('sku').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('cost').optional().isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('trackInventory').optional().isBoolean(),
  body('attributes').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const product = await prisma.product.findUnique({
    where: { id: req.params.id }
  });

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const variantData = {
    ...req.body,
    productId: req.params.id,
    attributes: req.body.attributes ? JSON.stringify(req.body.attributes) : null
  };

  const variant = await prisma.productVariant.create({
    data: variantData
  });

  res.status(201).json(variant);
}));

// Bulk operations
router.post('/bulk-import', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Create bulk operation record
  const bulkOperation = await prisma.bulkOperation.create({
    data: {
      type: 'PRODUCT_IMPORT',
      status: 'PROCESSING',
      totalItems: 0, // Will be updated after parsing
      filePath: req.file.path,
      createdBy: req.adminUser?.id
    }
  });

  // Process file asynchronously (in a real implementation)
  // For now, just return the operation ID
  res.status(202).json({
    message: 'Import started',
    operationId: bulkOperation.id
  });
}));

router.get('/bulk-operations', asyncHandler(async (req, res) => {
  const operations = await prisma.bulkOperation.findMany({
    where: { type: { contains: 'PRODUCT' } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json(operations);
}));

module.exports = router;
