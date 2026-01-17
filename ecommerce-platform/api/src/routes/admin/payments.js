const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get payments with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  query('provider').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'amount', 'status']),
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
    provider,
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
      { providerId: { contains: search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      { order: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { order: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { order: { guestEmail: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (provider) {
    where.provider = provider;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            user: {
              select: { name: true, email: true }
            },
            guestEmail: true
          }
        },
        paymentMethod: {
          select: { type: true, last4: true, brand: true }
        },
        refunds: {
          select: { id: true, amount: true, status: true, createdAt: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit)
    }),
    prisma.payment.count({ where })
  ]);

  res.json({
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single payment
router.get('/:id', asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: {
      order: {
        include: {
          user: {
            select: { name: true, email: true }
          },
          items: {
            include: {
              product: {
                select: { name: true, sku: true }
              }
            }
          }
        }
      },
      paymentMethod: {
        select: { type: true, last4: true, brand: true, expiryMonth: true, expiryYear: true }
      },
      refunds: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  res.json(payment);
}));

// Process refund
router.post('/:id/refund', [
  body('amount').isFloat({ min: 0.01 }),
  body('reason').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, reason } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: {
      order: true,
      refunds: true
    }
  });

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  if (payment.status !== 'COMPLETED') {
    return res.status(400).json({ message: 'Can only refund completed payments' });
  }

  // Calculate refundable amount
  const totalRefunded = payment.refunds.reduce((sum, refund) => {
    return refund.status === 'COMPLETED' ? sum + Number(refund.amount) : sum;
  }, 0);

  const refundableAmount = Number(payment.amount) - totalRefunded;

  if (amount > refundableAmount) {
    return res.status(400).json({ 
      message: `Refund amount cannot exceed ${refundableAmount.toFixed(2)}` 
    });
  }

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId: req.params.id,
      amount: parseFloat(amount),
      reason,
      status: 'PENDING'
    }
  });

  // TODO: Process refund with payment provider (Stripe, etc.)
  // For now, we'll simulate successful refund
  const updatedRefund = await prisma.refund.update({
    where: { id: refund.id },
    data: {
      status: 'COMPLETED',
      providerId: `refund_${Date.now()}`
    }
  });

  // Update payment status if fully refunded
  if (Math.abs((totalRefunded + amount) - Number(payment.amount)) < 0.01) {
    await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'REFUNDED' }
    });
  }

  // Log refund
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'REFUND',
      resourceId: updatedRefund.id,
      newValues: { amount, reason, paymentId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({
    message: 'Refund processed successfully',
    refund: updatedRefund
  });
}));

// Get payment statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
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
    case '1y':
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const [
    totalPayments,
    completedPayments,
    failedPayments,
    refundedPayments,
    totalRevenue,
    totalRefunded,
    paymentMethods,
    dailyStats
  ] = await Promise.all([
    // Total payments
    prisma.payment.count({
      where: { createdAt: { gte: startDate } }
    }),
    
    // Completed payments
    prisma.payment.count({
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    }),
    
    // Failed payments
    prisma.payment.count({
      where: { 
        createdAt: { gte: startDate },
        status: 'FAILED'
      }
    }),
    
    // Refunded payments
    prisma.payment.count({
      where: { 
        createdAt: { gte: startDate },
        status: 'REFUNDED'
      }
    }),
    
    // Total revenue
    prisma.payment.aggregate({
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    
    // Total refunded
    prisma.refund.aggregate({
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    
    // Payment methods breakdown
    prisma.payment.groupBy({
      by: ['provider'],
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _count: { id: true },
      _sum: { amount: true }
    }),
    
    // Daily payment stats
    prisma.payment.findMany({
      where: { 
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      select: {
        createdAt: true,
        amount: true,
        provider: true
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  // Group daily stats by date
  const dailyData = {};
  dailyStats.forEach(payment => {
    const day = payment.createdAt.toISOString().split('T')[0];
    if (!dailyData[day]) {
      dailyData[day] = {
        date: day,
        count: 0,
        amount: 0,
        providers: {}
      };
    }
    dailyData[day].count++;
    dailyData[day].amount += Number(payment.amount);
    dailyData[day].providers[payment.provider] = (dailyData[day].providers[payment.provider] || 0) + 1;
  });

  res.json({
    overview: {
      totalPayments,
      completedPayments,
      failedPayments,
      refundedPayments,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunded: totalRefunded._sum.amount || 0,
      netRevenue: (totalRevenue._sum.amount || 0) - (totalRefunded._sum.amount || 0)
    },
    paymentMethods: paymentMethods.map(method => ({
      provider: method.provider,
      count: method._count.id,
      amount: method._sum.amount || 0
    })),
    dailyStats: Object.values(dailyData)
  });
}));

// Get refunds with pagination
router.get('/refunds', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    page = 1,
    limit = 20,
    status,
    dateFrom,
    dateTo
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            order: {
              select: {
                orderNumber: true,
                user: {
                  select: { name: true, email: true }
                },
                guestEmail: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.refund.count({ where })
  ]);

  res.json({
    refunds,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Export payments
router.get('/export/csv', asyncHandler(async (req, res) => {
  const { status, provider, dateFrom, dateTo } = req.query;
  const where = {};

  if (status) where.status = status;
  if (provider) where.provider = provider;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: {
        select: { orderNumber: true }
      },
      paymentMethod: {
        select: { type: true, last4: true, brand: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Convert to CSV format
  const csvHeaders = [
    'Payment ID', 'Order Number', 'Provider', 'Amount', 'Currency', 'Status',
    'Payment Method', 'Last 4', 'Brand', 'Created At'
  ];

  const csvRows = payments.map(payment => [
    payment.id,
    payment.order?.orderNumber || '',
    payment.provider,
    payment.amount,
    payment.currency,
    payment.status,
    payment.paymentMethod?.type || '',
    payment.paymentMethod?.last4 || '',
    payment.paymentMethod?.brand || '',
    payment.createdAt.toISOString()
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="payments-export-${Date.now()}.csv"`);
  res.send(csvContent);
}));

module.exports = router;
