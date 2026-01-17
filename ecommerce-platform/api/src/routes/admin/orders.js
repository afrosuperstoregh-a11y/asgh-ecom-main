const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get orders with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  query('paymentStatus').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'total', 'status']),
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
    paymentStatus,
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
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { guestEmail: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true }
            }
          }
        },
        payments: {
          select: { id: true, status: true, amount: true, provider: true }
        },
        invoice: {
          select: { id: true, invoiceNumber: true, status: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
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

// Get single order with full details
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true }
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, images: true }
          }
        }
      },
      payments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true }
          }
        }
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true }
          }
        }
      },
      invoice: true
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.json(order);
}));

// Update order status
router.put('/:id/status', [
  body('status').isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  body('notes').optional().trim(),
  body('notifyCustomer').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status, notes, notifyCustomer = false } = req.body;

  const existingOrder = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!existingOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === 'SHIPPED' && { shippedAt: new Date() }),
      ...(status === 'DELIVERED' && { deliveredAt: new Date() })
    }
  });

  // Add status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: req.params.id,
      status,
      notes,
      notifyCustomer,
      createdBy: req.adminUser?.id
    }
  });

  // Log the status change
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'ORDER',
      resourceId: req.params.id,
      oldValues: { status: existingOrder.status },
      newValues: { status },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // TODO: Send notification to customer if notifyCustomer is true

  res.json({
    message: 'Order status updated successfully',
    order: updatedOrder
  });
}));

// Add tracking number
router.put('/:id/tracking', [
  body('trackingNumber').notEmpty().trim(),
  body('carrier').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { trackingNumber, carrier } = req.body;

  const existingOrder = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!existingOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      trackingNumber,
      status: 'SHIPPED',
      shippedAt: new Date()
    }
  });

  // Add status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: req.params.id,
      status: 'SHIPPED',
      notes: `Tracking number: ${trackingNumber}${carrier ? ` (${carrier})` : ''}`,
      notifyCustomer: true,
      createdBy: req.adminUser?.id
    }
  });

  // Log the update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'ORDER',
      resourceId: req.params.id,
      oldValues: { trackingNumber: existingOrder.trackingNumber },
      newValues: { trackingNumber, carrier },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    message: 'Tracking number added successfully',
    order: updatedOrder
  });
}));

// Add order note
router.post('/:id/notes', [
  body('content').notEmpty().trim(),
  body('isInternal').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content, isInternal = true } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const note = await prisma.orderNote.create({
    data: {
      orderId: req.params.id,
      content,
      isInternal,
      createdBy: req.adminUser?.id
    },
    include: {
      createdBy: {
        select: { name: true }
      }
    }
  });

  res.status(201).json(note);
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

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      payments: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.payments.length === 0) {
    return res.status(400).json({ message: 'No completed payment found for this order' });
  }

  const payment = order.payments[0];

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      amount: parseFloat(amount),
      reason,
      status: 'PENDING'
    }
  });

  // TODO: Process refund with payment provider (Stripe, etc.)
  // For now, we'll mark it as completed
  const updatedRefund = await prisma.refund.update({
    where: { id: refund.id },
    data: {
      status: 'COMPLETED',
      providerId: `refund_${Date.now()}`
    }
  });

  // Update order status if full refund
  if (parseFloat(amount) >= parseFloat(order.total)) {
    await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'REFUNDED' }
    });

    // Add status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: req.params.id,
        status: 'REFUNDED',
        notes: `Full refund processed: $${amount}`,
        notifyCustomer: true,
        createdBy: req.adminUser?.id
      }
    });
  }

  // Log the refund
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'REFUND',
      resourceId: updatedRefund.id,
      newValues: { amount, reason, orderId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({
    message: 'Refund processed successfully',
    refund: updatedRefund
  });
}));

// Generate invoice
router.post('/:id/invoice', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findUnique({
    where: { orderId: req.params.id }
  });

  if (existingInvoice) {
    return res.status(400).json({ message: 'Invoice already exists for this order' });
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;

  const invoice = await prisma.invoice.create({
    data: {
      orderId: req.params.id,
      invoiceNumber,
      status: 'DRAFT',
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total
    }
  });

  // TODO: Generate PDF invoice and save to pdfPath

  // Log the invoice creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'INVOICE',
      resourceId: invoice.id,
      newValues: { invoiceNumber, orderId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({
    message: 'Invoice generated successfully',
    invoice
  });
}));

// Export orders
router.get('/export/csv', asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo } = req.query;
  const where = {};

  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const orders = await prisma.order.findMany({
    where,
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
    },
    orderBy: { createdAt: 'desc' }
  });

  // Convert to CSV format
  const csvHeaders = [
    'Order Number', 'Date', 'Customer Name', 'Customer Email', 'Status',
    'Payment Status', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Items Count'
  ];

  const csvRows = orders.map(order => [
    order.orderNumber,
    order.createdAt.toISOString(),
    order.user?.name || order.guestEmail || 'Guest',
    order.user?.email || order.guestEmail || '',
    order.status,
    order.paymentStatus,
    order.subtotal,
    order.taxAmount,
    order.shippingAmount,
    order.total,
    order.items.length
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
  res.send(csvContent);
}));

module.exports = router;
