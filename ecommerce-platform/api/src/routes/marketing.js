const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const prisma = new PrismaClient();

// Rate limiting for marketing endpoints
const marketingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many marketing requests, please try again later.'
});

// Apply rate limiting to all marketing routes
router.use(marketingLimiter);

// Middleware to check validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// ==================== CAMPAIGN MANAGEMENT ====================

// Get all campaigns
router.get('/campaigns', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'COMPLETED']),
  query('type').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          template: true,
          segment: true,
          _count: {
            select: {
              interactions: true,
              analytics: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns'
    });
  }
});

// Get campaign by ID
router.get('/campaigns/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        segment: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign'
    });
  }
});

// Create new campaign
router.post('/campaigns', [
  body('name').notEmpty().trim().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('type').isIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP']),
  body('templateId').optional().isUUID(),
  body('segmentId').optional().isUUID(),
  body('scheduledAt').optional().isISO8601().toDate(),
  body('settings').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const campaignData = req.body;

    // Validate template and segment exist if provided
    if (campaignData.templateId) {
      const template = await prisma.marketingTemplate.findUnique({
        where: { id: campaignData.templateId }
      });
      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Template not found'
        });
      }
    }

    if (campaignData.segmentId) {
      const segment = await prisma.customerSegment.findUnique({
        where: { id: campaignData.segmentId }
      });
      if (!segment) {
        return res.status(400).json({
          success: false,
          message: 'Segment not found'
        });
      }
    }

    const campaign = await prisma.campaign.create({
      data: campaignData,
      include: {
        template: true,
        segment: true
      }
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign'
    });
  }
});

// Update campaign
router.put('/campaigns/:id', [
  param('id').isUUID(),
  body('name').optional().notEmpty().trim().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'COMPLETED']),
  body('templateId').optional().isUUID(),
  body('segmentId').optional().isUUID(),
  body('scheduledAt').optional().isISO8601().toDate(),
  body('settings').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Prevent updates to sent campaigns
    if (existingCampaign.status === 'SENT' || existingCampaign.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sent or completed campaigns'
      });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        segment: true
      }
    });

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign'
    });
  }
});

// Delete campaign
router.delete('/campaigns/:id', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Prevent deletion of sent campaigns
    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sent or sending campaigns'
      });
    }

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign'
    });
  }
});

// Send campaign
router.post('/campaigns/:id/send', [
  param('id').isUUID(),
  body('sendNow').optional().isBoolean(),
  body('testMode').optional().isBoolean(),
  body('testEmails').optional().isArray()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { sendNow = false, testMode = false, testEmails = [] } = req.body;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        segment: true
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: 'Campaign can only be sent from DRAFT or SCHEDULED status'
      });
    }

    if (!campaign.templateId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign must have a template to be sent'
      });
    }

    // Create marketing job for sending
    const jobData = {
      campaignId: id,
      sendNow,
      testMode,
      testEmails
    };

    const job = await prisma.marketingJob.create({
      data: {
        type: 'SEND_EMAIL', // This would vary based on campaign type
        status: 'PENDING',
        priority: 'HIGH',
        data: jobData,
        scheduledAt: sendNow ? new Date() : campaign.scheduledAt
      }
    });

    // Update campaign status
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: sendNow ? 'SENDING' : 'SCHEDULED',
        sentAt: sendNow ? new Date() : undefined
      }
    });

    res.json({
      success: true,
      data: {
        campaign: updatedCampaign,
        job
      },
      message: sendNow ? 'Campaign queued for sending' : 'Campaign scheduled successfully'
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign'
    });
  }
});

// ==================== TEMPLATES ====================

// Get all templates
router.get('/templates', [
  query('type').optional().isIn(['EMAIL', 'SMS', 'PUSH']),
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const where = {};
    
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.marketingTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            campaigns: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// Create template
router.post('/templates', [
  body('name').notEmpty().trim().isLength({ max: 255 }),
  body('type').isIn(['EMAIL', 'SMS', 'PUSH']),
  body('subject').optional().trim().isLength({ max: 255 }),
  body('content').notEmpty(),
  body('variables').optional().isObject(),
  body('styles').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const template = await prisma.marketingTemplate.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
});

// ==================== CUSTOMER SEGMENTS ====================

// Get all segments
router.get('/segments', [
  query('isActive').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const segments = await prisma.customerSegment.findMany({
      where,
      include: {
        _count: {
          select: {
            customers: true,
            campaigns: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segments'
    });
  }
});

// Create segment
router.post('/segments', [
  body('name').notEmpty().trim().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('rules').notEmpty().isObject(),
  body('isDynamic').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const segment = await prisma.customerSegment.create({
      data: req.body
    });

    // Create job to sync segment customers
    await prisma.marketingJob.create({
      data: {
        type: 'SYNC_SEGMENT',
        status: 'PENDING',
        priority: 'NORMAL',
        data: { segmentId: segment.id }
      }
    });

    res.status(201).json({
      success: true,
      data: segment
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create segment'
    });
  }
});

// ==================== SUBSCRIPTIONS ====================

// Subscribe to marketing
router.post('/subscribe', [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('emailSubscribed').optional().isBoolean(),
  body('smsSubscribed').optional().isBoolean(),
  body('source').optional().trim().isLength({ max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { email, phone, emailSubscribed = true, smsSubscribed = false, source } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone is required'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { email: email || null },
          { phone: phone || null }
        ]
      }
    });

    let subscription;
    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          emailSubscribed,
          smsSubscribed,
          unsubscribedAt: null,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          email,
          phone,
          emailSubscribed,
          smsSubscribed,
          source
        }
      });
    }

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription successful'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// ==================== ANALYTICS ====================

// Get campaign analytics
router.get('/analytics/campaigns/:id', [
  param('id').isUUID(),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where = { campaignId: id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const analytics = await prisma.campaignAnalytics.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Calculate aggregate metrics
    const aggregated = analytics.reduce((acc, item) => {
      if (!acc[item.metric]) {
        acc[item.metric] = { total: 0, revenue: 0 };
      }
      acc[item.metric].total += item.value;
      acc[item.metric].revenue += parseFloat(item.revenue);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        analytics,
        aggregated,
        summary: {
          totalSent: aggregated.sent?.total || 0,
          totalDelivered: aggregated.delivered?.total || 0,
          totalOpened: aggregated.opened?.total || 0,
          totalClicked: aggregated.clicked?.total || 0,
          totalConverted: aggregated.converted?.total || 0,
          totalRevenue: aggregated.converted?.revenue || 0,
          openRate: aggregated.sent?.total ? (aggregated.opened?.total / aggregated.sent.total) * 100 : 0,
          clickRate: aggregated.delivered?.total ? (aggregated.clicked?.total / aggregated.delivered.total) * 100 : 0,
          conversionRate: aggregated.clicked?.total ? (aggregated.converted?.total / aggregated.clicked.total) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign analytics'
    });
  }
});

// ==================== ABANDONED CARTS ====================

// Track abandoned cart
router.post('/abandoned-carts/track', [
  body('customerId').optional().isUUID(),
  body('sessionId').optional().isString(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('cartData').notEmpty().isObject(),
  body('totalValue').isDecimal()
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId, sessionId, email, phone, cartData, totalValue } = req.body;

    if (!customerId && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Either customerId or sessionId is required'
      });
    }

    // Check if abandoned cart already exists
    const existingCart = await prisma.abandonedCart.findFirst({
      where: {
        OR: [
          { customerId: customerId || null },
          { sessionId: sessionId || null }
        ],
        recoveredAt: null
      }
    });

    let abandonedCart;
    if (existingCart) {
      // Update existing abandoned cart
      abandonedCart = await prisma.abandonedCart.update({
        where: { id: existingCart.id },
        data: {
          cartData,
          totalValue: parseFloat(totalValue),
          email: email || existingCart.email,
          phone: phone || existingCart.phone,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new abandoned cart
      abandonedCart = await prisma.abandonedCart.create({
        data: {
          customerId,
          sessionId,
          email,
          phone,
          cartData,
          totalValue: parseFloat(totalValue),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    // Create job to process abandoned cart recovery
    await prisma.marketingJob.create({
      data: {
        type: 'PROCESS_ABANDONED_CART',
        status: 'PENDING',
        priority: 'NORMAL',
        data: { abandonedCartId: abandonedCart.id },
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      }
    });

    res.status(201).json({
      success: true,
      data: abandonedCart
    });
  } catch (error) {
    console.error('Error tracking abandoned cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track abandoned cart'
    });
  }
});

// Get abandoned carts
router.get('/abandoned-carts', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('recovered').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { recovered } = req.query;

    const where = {};
    if (recovered !== undefined) {
      where.recoveredAt = recovered === 'true' ? { not: null } : null;
    }

    const [carts, total] = await Promise.all([
      prisma.abandonedCart.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.abandonedCart.count({ where })
    ]);

    res.json({
      success: true,
      data: carts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch abandoned carts'
    });
  }
});

module.exports = router;
