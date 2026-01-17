const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get customers with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['active', 'blocked']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'name', 'email', 'totalSpent']),
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
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Build filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true
          }
        },
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  // Calculate additional metrics for each customer
  const customersWithMetrics = customers.map(customer => {
    const totalSpent = customer.orders.reduce((sum, order) => {
      return order.status !== 'CANCELLED' ? sum + Number(order.total) : sum;
    }, 0);

    const averageOrderValue = customer.orders.length > 0 
      ? totalSpent / customer.orders.filter(o => o.status !== 'CANCELLED').length 
      : 0;

    const lastOrder = customer.orders.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    return {
      ...customer,
      totalSpent,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      lastOrderDate: lastOrder?.createdAt,
      orderCount: customer._count.orders
    };
  });

  res.json({
    customers: customersWithMetrics,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single customer with full details
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      addresses: {
        orderBy: { isDefault: 'desc' }
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true }
              }
            }
          },
          payments: {
            select: { id: true, status: true, amount: true, createdAt: true }
          }
        }
      },
      paymentMethods: {
        where: { isActive: true },
        orderBy: { isDefault: 'desc' }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Calculate customer metrics
  const totalSpent = customer.orders.reduce((sum, order) => {
    return order.status !== 'CANCELLED' ? sum + Number(order.total) : sum;
  }, 0);

  const completedOrders = customer.orders.filter(order => order.status === 'DELIVERED');
  const averageOrderValue = completedOrders.length > 0 
    ? totalSpent / completedOrders.length 
    : 0;

  const customerMetrics = {
    totalSpent,
    totalOrders: customer.orders.length,
    completedOrders: completedOrders.length,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    totalReviews: customer.reviews.length,
    averageRating: customer.reviews.length > 0
      ? customer.reviews.reduce((sum, review) => sum + review.rating, 0) / customer.reviews.length
      : 0
  };

  res.json({
    customer,
    metrics: customerMetrics
  });
}));

// Update customer information
router.put('/:id', [
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('emailVerified').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingCustomer = await prisma.user.findUnique({
    where: { id: req.params.id }
  });

  if (!existingCustomer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.emailVerified !== undefined) updateData.emailVerified = req.body.emailVerified;

  const updatedCustomer = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData
  });

  // Log the update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: req.params.id,
      oldValues: existingCustomer,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    message: 'Customer updated successfully',
    customer: updatedCustomer
  });
}));

// Block/Unblock customer
router.put('/:id/status', [
  body('action').isIn(['block', 'unblock']),
  body('reason').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { action, reason } = req.body;

  const customer = await prisma.user.findUnique({
    where: { id: req.params.id }
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // For this example, we'll use a system setting to track blocked customers
  // In a real implementation, you might add an isActive field to the User model
  const isBlocked = action === 'block';
  
  await prisma.systemSetting.upsert({
    where: { key: `blocked_user_${req.params.id}` },
    update: { 
      value: { blocked: isBlocked, reason, blockedAt: new Date() },
      updatedAt: new Date()
    },
    create: {
      key: `blocked_user_${req.params.id}`,
      value: { blocked: isBlocked, reason, blockedAt: new Date() },
      description: `Block status for user ${req.params.id}`,
      category: 'user_management'
    }
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: action.toUpperCase(),
      resourceType: 'USER',
      resourceId: req.params.id,
      newValues: { blocked: isBlocked, reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    message: `Customer ${action}ed successfully`,
    blocked: isBlocked
  });
}));

// Get customer addresses
router.get('/:id/addresses', asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.params.id },
    orderBy: { isDefault: 'desc' }
  });

  res.json(addresses);
}));

// Add customer address
router.post('/:id/addresses', [
  body('type').isIn(['SHIPPING', 'BILLING']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('address1').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('province').notEmpty().trim(),
  body('country').notEmpty().trim(),
  body('postalCode').notEmpty().trim(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('isDefault').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customer = await prisma.user.findUnique({
    where: { id: req.params.id }
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const addressData = { ...req.body, userId: req.params.id };

  // If this is set as default, unset other default addresses of the same type
  if (addressData.isDefault) {
    await prisma.address.updateMany({
      where: { 
        userId: req.params.id, 
        type: addressData.type 
      },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: addressData
  });

  // Log the address creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'ADDRESS',
      resourceId: address.id,
      newValues: addressData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(address);
}));

// Get customer order history
router.get('/:id/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { userId: req.params.id };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true }
            }
          }
        },
        payments: {
          select: { id: true, status: true, amount: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Export customers
router.get('/export/csv', asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo } = req.query;
  const where = {};

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const customers = await prisma.user.findMany({
    where,
    include: {
      orders: {
        select: { total: true, status: true }
      },
      addresses: {
        where: { isDefault: true },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate metrics and convert to CSV
  const csvHeaders = [
    'Customer ID', 'Name', 'Email', 'Phone', 'Registration Date',
    'Total Orders', 'Total Spent', 'Average Order Value', 'Last Order Date'
  ];

  const csvRows = customers.map(customer => {
    const totalSpent = customer.orders.reduce((sum, order) => {
      return order.status !== 'CANCELLED' ? sum + Number(order.total) : sum;
    }, 0);

    const completedOrders = customer.orders.filter(o => o.status === 'DELIVERED');
    const averageOrderValue = completedOrders.length > 0 
      ? totalSpent / completedOrders.length 
      : 0;

    return [
      customer.id,
      customer.name || '',
      customer.email,
      customer.phone || '',
      customer.createdAt.toISOString(),
      customer.orders.length,
      totalSpent.toFixed(2),
      averageOrderValue.toFixed(2),
      customer.orders.length > 0 ? customer.orders[0].createdAt.toISOString() : ''
    ];
  });

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="customers-export-${Date.now()}.csv"`);
  res.send(csvContent);
}));

module.exports = router;
