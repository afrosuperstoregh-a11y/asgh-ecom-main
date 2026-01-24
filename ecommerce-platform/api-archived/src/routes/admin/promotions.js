const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get promotions with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'expired']),
  query('type').optional().isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'BULK_DISCOUNT']),
  query('sortBy').optional().isIn(['name', 'createdAt', 'startsAt', 'endsAt']),
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
    status,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Build filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    if (status === 'active') {
      where.isActive = true;
      where.AND = [
        { startsAt: { lte: new Date() } },
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: new Date() } }
          ]
        }
      ];
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'expired') {
      where.endsAt = { lt: new Date() };
    }
  }

  if (type) {
    where.type = type;
  }

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      include: {
        codes: {
          select: { id: true, code: true, usageLimit: true, usageCount: true }
        },
        _count: {
          select: { usage: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    }),
    prisma.promotion.count({ where })
  ]);

  res.json({
    promotions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single promotion
router.get('/:id', asyncHandler(async (req, res) => {
  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    include: {
      codes: {
        orderBy: { createdAt: 'desc' }
      },
      usage: {
        include: {
          order: {
            select: { orderNumber: true, total: true }
          },
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      _count: {
        select: { usage: true }
      }
    }
  });

  if (!promotion) {
    return res.status(404).json({ message: 'Promotion not found' });
  }

  res.json(promotion);
}));

// Create promotion
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('type').isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'BULK_DISCOUNT']),
  body('value').isFloat({ min: 0 }),
  body('minimumAmount').optional().isFloat({ min: 0 }),
  body('maximumDiscount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('usageLimitPerUser').optional().isInt({ min: 1 }),
  body('startsAt').isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('applicableProducts').optional().isArray(),
  body('applicableCategories').optional().isArray(),
  body('excludedProducts').optional().isArray(),
  body('excludedCategories').optional().isArray(),
  body('autoApply').optional().isBoolean(),
  body('priority').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const promotionData = {
    ...req.body,
    startsAt: new Date(req.body.startsAt),
    endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
    applicableProducts: req.body.applicableProducts ? JSON.stringify(req.body.applicableProducts) : null,
    applicableCategories: req.body.applicableCategories ? JSON.stringify(req.body.applicableCategories) : null,
    excludedProducts: req.body.excludedProducts ? JSON.stringify(req.body.excludedProducts) : null,
    excludedCategories: req.body.excludedCategories ? JSON.stringify(req.body.excludedCategories) : null
  };

  const promotion = await prisma.promotion.create({
    data: promotionData,
    include: {
      codes: true
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'PROMOTION',
      resourceId: promotion.id,
      newValues: promotionData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(promotion);
}));

// Update promotion
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('type').optional().isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'BULK_DISCOUNT']),
  body('value').optional().isFloat({ min: 0 }),
  body('minimumAmount').optional().isFloat({ min: 0 }),
  body('maximumDiscount').optional().isFloat({ min: 0 }),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('usageLimitPerUser').optional().isInt({ min: 1 }),
  body('startsAt').optional().isISO8601(),
  body('endsAt').optional().isISO8601(),
  body('applicableProducts').optional().isArray(),
  body('applicableCategories').optional().isArray(),
  body('excludedProducts').optional().isArray(),
  body('excludedCategories').optional().isArray(),
  body('autoApply').optional().isBoolean(),
  body('priority').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingPromotion = await prisma.promotion.findUnique({
    where: { id: req.params.id }
  });

  if (!existingPromotion) {
    return res.status(404).json({ message: 'Promotion not found' });
  }

  const updateData = { ...req.body };
  
  if (req.body.startsAt) {
    updateData.startsAt = new Date(req.body.startsAt);
  }
  if (req.body.endsAt) {
    updateData.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
  }
  if (req.body.applicableProducts) {
    updateData.applicableProducts = JSON.stringify(req.body.applicableProducts);
  }
  if (req.body.applicableCategories) {
    updateData.applicableCategories = JSON.stringify(req.body.applicableCategories);
  }
  if (req.body.excludedProducts) {
    updateData.excludedProducts = JSON.stringify(req.body.excludedProducts);
  }
  if (req.body.excludedCategories) {
    updateData.excludedCategories = JSON.stringify(req.body.excludedCategories);
  }

  const updatedPromotion = await prisma.promotion.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      codes: true
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'PROMOTION',
      resourceId: req.params.id,
      oldValues: existingPromotion,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedPromotion);
}));

// Delete promotion
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingPromotion = await prisma.promotion.findUnique({
    where: { id: req.params.id }
  });

  if (!existingPromotion) {
    return res.status(404).json({ message: 'Promotion not found' });
  }

  await prisma.promotion.delete({
    where: { id: req.params.id }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'PROMOTION',
      resourceId: existingPromotion.id,
      oldValues: existingPromotion,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Promotion deleted successfully' });
}));

// Create discount code for promotion
router.post('/:id/codes', [
  body('code').notEmpty().trim().toUpperCase(),
  body('usageLimit').optional().isInt({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code, usageLimit } = req.body;

  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id }
  });

  if (!promotion) {
    return res.status(404).json({ message: 'Promotion not found' });
  }

  // Check if code already exists
  const existingCode = await prisma.discountCode.findUnique({
    where: { code }
  });

  if (existingCode) {
    return res.status(400).json({ message: 'Discount code already exists' });
  }

  const discountCode = await prisma.discountCode.create({
    data: {
      promotionId: req.params.id,
      code,
      usageLimit
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'DISCOUNT_CODE',
      resourceId: discountCode.id,
      newValues: { code, usageLimit, promotionId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(discountCode);
}));

// Update discount code
router.put('/codes/:codeId', [
  body('code').optional().notEmpty().trim().toUpperCase(),
  body('usageLimit').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingCode = await prisma.discountCode.findUnique({
    where: { id: req.params.codeId }
  });

  if (!existingCode) {
    return res.status(404).json({ message: 'Discount code not found' });
  }

  const updateData = {};
  if (req.body.code !== undefined) updateData.code = req.body.code;
  if (req.body.usageLimit !== undefined) updateData.usageLimit = req.body.usageLimit;
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

  // Check code uniqueness if changed
  if (req.body.code && req.body.code !== existingCode.code) {
    const codeExists = await prisma.discountCode.findUnique({
      where: { code: req.body.code }
    });

    if (codeExists) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }
  }

  const updatedCode = await prisma.discountCode.update({
    where: { id: req.params.codeId },
    data: updateData
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'DISCOUNT_CODE',
      resourceId: req.params.codeId,
      oldValues: existingCode,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedCode);
}));

// Delete discount code
router.delete('/codes/:codeId', asyncHandler(async (req, res) => {
  const existingCode = await prisma.discountCode.findUnique({
    where: { id: req.params.codeId }
  });

  if (!existingCode) {
    return res.status(404).json({ message: 'Discount code not found' });
  }

  await prisma.discountCode.delete({
    where: { id: req.params.codeId }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'DISCOUNT_CODE',
      resourceId: existingCode.id,
      oldValues: existingCode,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Discount code deleted successfully' });
}));

// Get promotion analytics
router.get('/:id/analytics', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  let startDate;
  switch (period) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id }
  });

  if (!promotion) {
    return res.status(404).json({ message: 'Promotion not found' });
  }

  const [usage, totalUsage, totalDiscount] = await Promise.all([
    // Daily usage data
    prisma.promotionUsage.findMany({
      where: {
        promotionId: req.params.id,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        discountAmount: true
      },
      orderBy: { createdAt: 'asc' }
    }),
    
    // Total usage count
    prisma.promotionUsage.count({
      where: {
        promotionId: req.params.id,
        createdAt: { gte: startDate }
      }
    }),
    
    // Total discount amount
    prisma.promotionUsage.aggregate({
      where: {
        promotionId: req.params.id,
        createdAt: { gte: startDate }
      },
      _sum: { discountAmount: true }
    })
  ]);

  // Group usage by day
  const dailyUsage = {};
  usage.forEach(item => {
    const day = item.createdAt.toISOString().split('T')[0];
    if (!dailyUsage[day]) {
      dailyUsage[day] = {
        date: day,
        usage: 0,
        discountAmount: 0
      };
    }
    dailyUsage[day].usage++;
    dailyUsage[day].discountAmount += Number(item.discountAmount);
  });

  res.json({
    promotion: {
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value
    },
    analytics: {
      totalUsage,
      totalDiscount: totalDiscount._sum.discountAmount || 0,
      dailyUsage: Object.values(dailyUsage)
    }
  });
}));

module.exports = router;
