const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const SubscriptionPlanService = require('../services/subscriptionPlanService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// Rate limiting for subscription plans
const plansLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});

// Apply rate limiting to all routes
router.use(plansLimiter);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/subscription-plans - List all subscription plans
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
    query('billing_cycle').optional().isIn(['monthly', 'quarterly', 'annual']).withMessage('Invalid billing cycle'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      active,
      billing_cycle,
    } = req.query;

    const filters = {};
    if (active !== undefined) filters.isActive = active === 'true';
    if (billing_cycle) filters.billingCycle = billing_cycle;

    const result = await SubscriptionPlanService.getPlans({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    res.json({
      success: true,
      data: result.plans,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  })
);

// GET /api/subscription-plans/:id - Get subscription plan by ID
router.get('/:id',
  [
    param('id').isUUID().withMessage('Invalid plan ID'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await SubscriptionPlanService.getPlanById(id);

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan with ID ${id} not found`,
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  })
);

// GET /api/subscription-plans/slug/:slug - Get subscription plan by slug
router.get('/slug/:slug',
  [
    param('slug').isSlug().withMessage('Invalid slug format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const plan = await SubscriptionPlanService.getPlanBySlug(slug);

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan with slug ${slug} not found`,
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  })
);

// POST /api/subscription-plans - Create new subscription plan
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
    body('slug')
      .trim()
      .isSlug()
      .withMessage('Invalid slug format'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('billing_cycle')
      .isIn(['monthly', 'quarterly', 'annual'])
      .withMessage('Billing cycle must be monthly, quarterly, or annual'),
    body('trial_days')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Trial days must be a non-negative integer'),
    body('setup_fee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Setup fee must be a positive number'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('features')
      .optional()
      .isObject()
      .withMessage('Features must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const planData = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      price: parseFloat(req.body.price),
      billingCycle: req.body.billing_cycle,
      trialDays: parseInt(req.body.trial_days) || 0,
      setupFee: parseFloat(req.body.setup_fee) || 0,
      isActive: req.body.is_active !== undefined ? req.body.is_active : true,
      sortOrder: parseInt(req.body.sort_order) || 0,
      features: req.body.features || {},
      metadata: req.body.metadata || {},
    };

    const plan = await SubscriptionPlanService.createPlan(planData);

    logger.info('Subscription plan created', {
      planId: plan.id,
      name: plan.name,
      price: plan.price,
    });

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Subscription plan created successfully',
    });
  })
);

// PUT /api/subscription-plans/:id - Update subscription plan
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid plan ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('trial_days')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Trial days must be a non-negative integer'),
    body('setup_fee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Setup fee must be a positive number'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean'),
    body('sort_order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer'),
    body('features')
      .optional()
      .isObject()
      .withMessage('Features must be an object'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {};

    // Only include fields that are provided
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.trial_days !== undefined) updateData.trialDays = parseInt(req.body.trial_days);
    if (req.body.setup_fee !== undefined) updateData.setupFee = parseFloat(req.body.setup_fee);
    if (req.body.is_active !== undefined) updateData.isActive = req.body.is_active;
    if (req.body.sort_order !== undefined) updateData.sortOrder = parseInt(req.body.sort_order);
    if (req.body.features !== undefined) updateData.features = req.body.features;
    if (req.body.metadata !== undefined) updateData.metadata = req.body.metadata;

    const plan = await SubscriptionPlanService.updatePlan(id, updateData);

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan with ID ${id} not found`,
      });
    }

    logger.info('Subscription plan updated', {
      planId: plan.id,
      name: plan.name,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: plan,
      message: 'Subscription plan updated successfully',
    });
  })
);

// DELETE /api/subscription-plans/:id - Delete subscription plan
router.delete('/:id',
  [
    param('id').isUUID().withMessage('Invalid plan ID'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if plan has active subscriptions
    const hasActiveSubscriptions = await SubscriptionPlanService.hasActiveSubscriptions(id);

    if (hasActiveSubscriptions) {
      return res.status(400).json({
        error: 'Cannot delete plan',
        message: 'Cannot delete plan with active subscriptions. Deactivate it instead.',
      });
    }

    const deleted = await SubscriptionPlanService.deletePlan(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan with ID ${id} not found`,
      });
    }

    logger.info('Subscription plan deleted', { planId: id });

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully',
    });
  })
);

// POST /api/subscription-plans/:id/duplicate - Duplicate subscription plan
router.post('/:id/duplicate',
  [
    param('id').isUUID().withMessage('Invalid plan ID'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
    body('slug')
      .trim()
      .isSlug()
      .withMessage('Invalid slug format'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, slug } = req.body;

    const duplicatedPlan = await SubscriptionPlanService.duplicatePlan(id, { name, slug });

    if (!duplicatedPlan) {
      return res.status(404).json({
        error: 'Plan not found',
        message: `Subscription plan with ID ${id} not found`,
      });
    }

    logger.info('Subscription plan duplicated', {
      originalPlanId: id,
      newPlanId: duplicatedPlan.id,
      newName: duplicatedPlan.name,
    });

    res.status(201).json({
      success: true,
      data: duplicatedPlan,
      message: 'Subscription plan duplicated successfully',
    });
  })
);

// GET /api/subscription-plans/compare - Compare multiple plans
router.get('/compare',
  [
    query('ids').notEmpty().withMessage('Plan IDs are required'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { ids } = req.query;
    const planIds = ids.split(',').map(id => id.trim());

    if (planIds.length < 2 || planIds.length > 5) {
      return res.status(400).json({
        error: 'Invalid comparison',
        message: 'Please provide between 2 and 5 plan IDs for comparison',
      });
    }

    const comparison = await SubscriptionPlanService.comparePlans(planIds);

    res.json({
      success: true,
      data: comparison,
    });
  })
);

module.exports = router;
