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
    cb(null, 'uploads/categories/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
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

// Get categories with hierarchy
router.get('/', asyncHandler(async (req, res) => {
  const { includeInactive = false } = req.query;
  
  const categories = await prisma.category.findMany({
    where: {
      isActive: includeInactive === 'true' ? undefined : true
    },
    include: {
      parent: {
        select: { id: true, name: true }
      },
      children: {
        select: { id: true, name: true, sortOrder: true }
      },
      seo: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });

  // Build hierarchy tree
  const buildTree = (categories, parentId = null) => {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        children: buildTree(categories, category.id)
      }));
  };

  const tree = buildTree(categories);

  res.json({
    categories: tree,
    flat: categories
  });
}));

// Get single category
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      parent: true,
      children: {
        orderBy: { sortOrder: 'asc' }
      },
      seo: true,
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          status: true,
          images: true
        },
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        take: 10 // Preview of products
      },
      _count: {
        select: { products: true }
      }
    }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  res.json(category);
}));

// Create category
router.post('/', [
  body('name').notEmpty().trim(),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('parentId').optional().isUUID(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, slug, description, parentId, sortOrder = 0, isActive = true } = req.body;

  // Generate slug if not provided
  const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check if slug is unique
  const existingCategory = await prisma.category.findUnique({
    where: { slug: categorySlug }
  });

  if (existingCategory) {
    return res.status(400).json({ message: 'Category slug already exists' });
  }

  // Validate parent category
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId }
    });

    if (!parentCategory) {
      return res.status(400).json({ message: 'Parent category not found' });
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug: categorySlug,
      description,
      parentId,
      sortOrder,
      isActive
    },
    include: {
      parent: {
        select: { id: true, name: true }
      }
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'CATEGORY',
      resourceId: category.id,
      newValues: { name, slug: categorySlug, description, parentId, sortOrder, isActive },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(category);
}));

// Update category
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('parentId').optional().isUUID(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!existingCategory) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const updateData = { ...req.body };

  // Generate slug if name changed and slug not provided
  if (req.body.name && !req.body.slug) {
    updateData.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Check slug uniqueness if changed
  if (updateData.slug && updateData.slug !== existingCategory.slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: updateData.slug }
    });

    if (slugExists) {
      return res.status(400).json({ message: 'Category slug already exists' });
    }
  }

  // Validate parent category
  if (updateData.parentId) {
    // Prevent circular reference
    if (updateData.parentId === req.params.id) {
      return res.status(400).json({ message: 'Category cannot be its own parent' });
    }

    const parentCategory = await prisma.category.findUnique({
      where: { id: updateData.parentId }
    });

    if (!parentCategory) {
      return res.status(400).json({ message: 'Parent category not found' });
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      parent: {
        select: { id: true, name: true }
      }
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'CATEGORY',
      resourceId: updatedCategory.id,
      oldValues: existingCategory,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedCategory);
}));

// Delete category
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: { 
          products: true,
          children: true
        }
      }
    }
  });

  if (!existingCategory) {
    return res.status(404).json({ message: 'Category not found' });
  }

  // Check if category has products or subcategories
  if (existingCategory._count.products > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete category with products. Please move or delete the products first.' 
    });
  }

  if (existingCategory._count.children > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete category with subcategories. Please delete or move subcategories first.' 
    });
  }

  await prisma.category.delete({
    where: { id: req.params.id }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'CATEGORY',
      resourceId: existingCategory.id,
      oldValues: existingCategory,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Category deleted successfully' });
}));

// Update category order
router.put('/:id/order', [
  body('sortOrder').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sortOrder } = req.body;

  const category = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const updatedCategory = await prisma.category.update({
    where: { id: req.params.id },
    data: { sortOrder }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'CATEGORY',
      resourceId: req.params.id,
      oldValues: { sortOrder: category.sortOrder },
      newValues: { sortOrder },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedCategory);
}));

// Upload category image
router.post('/:id/image', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const category = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const imagePath = `/uploads/categories/${req.file.filename}`;

  const updatedCategory = await prisma.category.update({
    where: { id: req.params.id },
    data: { image: imagePath }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'CATEGORY',
      resourceId: req.params.id,
      oldValues: { image: category.image },
      newValues: { image: imagePath },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    message: 'Image uploaded successfully',
    image: imagePath,
    category: updatedCategory
  });
}));

// Update SEO data
router.put('/:id/seo', [
  body('metaTitle').optional().trim(),
  body('metaDescription').optional().trim(),
  body('metaKeywords').optional().trim(),
  body('ogTitle').optional().trim(),
  body('ogDescription').optional().trim(),
  body('ogImage').optional().trim(),
  body('canonicalUrl').optional().trim(),
  body('robots').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const category = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const seoData = await prisma.categorySEO.upsert({
    where: { categoryId: req.params.id },
    update: req.body,
    create: {
      categoryId: req.params.id,
      ...req.body
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'CATEGORY_SEO',
      resourceId: seoData.id,
      newValues: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(seoData);
}));

// Get SEO data
router.get('/:id/seo', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    select: { id: true }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const seoData = await prisma.categorySEO.findUnique({
    where: { categoryId: req.params.id }
  });

  res.json(seoData || {});
}));

module.exports = router;
