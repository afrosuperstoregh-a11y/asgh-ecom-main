const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const authService = require('../services/authService');

// Simple async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();
const prisma = new PrismaClient();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required'
      }
    });
  }

  try {
    const userId = await authService.validateToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array().map(error => ({
          field: error.param,
          message: error.msg
        }))
      }
    });
  }
  next();
};

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      timezone: true,
      language: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      addresses: {
        where: { isDefault: true },
        take: 1
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found'
      }
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  body('timezone')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Timezone is required'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { name, phone, dateOfBirth, gender, timezone, language } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      name,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      timezone,
      language
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      timezone: true,
      language: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

/**
 * @route   GET /api/user/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/addresses', authenticateToken, asyncHandler(async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  res.json({
    success: true,
    data: { addresses }
  });
}));

/**
 * @route   POST /api/user/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post('/addresses', authenticateToken, [
  body('type')
    .isIn(['SHIPPING', 'BILLING'])
    .withMessage('Address type must be SHIPPING or BILLING'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('address1')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address line 1 is required and must be less than 255 characters'),
  body('address2')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must be less than 255 characters'),
  body('city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be less than 100 characters'),
  body('province')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Province/State is required and must be less than 100 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters'),
  body('postalCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code is required and must be between 3 and 20 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('Is default must be a boolean')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const {
    type,
    firstName,
    lastName,
    company,
    address1,
    address2,
    city,
    province,
    country,
    postalCode,
    phone,
    isDefault
  } = req.body;

  // If setting as default, unset other default addresses of same type
  if (isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: req.userId,
        type,
        isDefault: true
      },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: req.userId,
      type,
      firstName,
      lastName,
      company,
      address1,
      address2,
      city,
      province,
      country,
      postalCode,
      phone,
      isDefault: isDefault || false
    }
  });

  res.status(201).json({
    success: true,
    message: 'Address created successfully',
    data: { address }
  });
}));

/**
 * @route   PUT /api/user/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put('/addresses/:id', authenticateToken, [
  body('type')
    .optional()
    .isIn(['SHIPPING', 'BILLING'])
    .withMessage('Address type must be SHIPPING or BILLING'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('address1')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Address line 1 must be less than 255 characters'),
  body('address2')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must be less than 255 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('province')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Province/State must be less than 100 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('Is default must be a boolean')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if address belongs to user
  const existingAddress = await prisma.address.findFirst({
    where: { id, userId: req.userId }
  });

  if (!existingAddress) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Address not found'
      }
    });
  }

  // If setting as default, unset other default addresses of same type
  if (updateData.isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: req.userId,
        type: existingAddress.type,
        isDefault: true,
        id: { not: id }
      },
      data: { isDefault: false }
    });
  }

  const address = await prisma.address.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Address updated successfully',
    data: { address }
  });
}));

/**
 * @route   DELETE /api/user/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete('/addresses/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if address belongs to user
  const existingAddress = await prisma.address.findFirst({
    where: { id, userId: req.userId }
  });

  if (!existingAddress) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Address not found'
      }
    });
  }

  await prisma.address.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Address deleted successfully'
  });
}));

/**
 * @route   PUT /api/user/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.put('/addresses/:id/default', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if address belongs to user
  const existingAddress = await prisma.address.findFirst({
    where: { id, userId: req.userId }
  });

  if (!existingAddress) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Address not found'
      }
    });
  }

  // Unset other default addresses of same type
  await prisma.address.updateMany({
    where: {
      userId: req.userId,
      type: existingAddress.type,
      isDefault: true,
      id: { not: id }
    },
    data: { isDefault: false }
  });

  // Set this address as default
  const address = await prisma.address.update({
    where: { id },
    data: { isDefault: true }
  });

  res.json({
    success: true,
    message: 'Address set as default successfully',
    data: { address }
  });
}));

/**
 * @route   GET /api/user/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get('/wishlist', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [wishlistItems, total] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId: req.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            status: true,
            stock: true
          }
        }
      },
      orderBy: { addedAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.wishlistItem.count({
      where: { userId: req.userId }
    })
  ]);

  res.json({
    success: true,
    data: {
      wishlist: wishlistItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @route   POST /api/user/wishlist
 * @desc    Add item to wishlist
 * @access  Private
 */
router.post('/wishlist', authenticateToken, [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { productId } = req.body;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found'
      }
    });
  }

  // Check if already in wishlist
  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: req.userId,
        productId
      }
    }
  });

  if (existingItem) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Product already in wishlist'
      }
    });
  }

  const wishlistItem = await prisma.wishlistItem.create({
    data: {
      userId: req.userId,
      productId
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          status: true,
          stock: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
    data: { wishlistItem }
  });
}));

/**
 * @route   DELETE /api/user/wishlist/:productId
 * @desc    Remove item from wishlist
 * @access  Private
 */
router.delete('/wishlist/:productId', authenticateToken, asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlistItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: req.userId,
        productId
      }
    }
  });

  if (!wishlistItem) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found in wishlist'
      }
    });
  }

  await prisma.wishlistItem.delete({
    where: { id: wishlistItem.id }
  });

  res.json({
    success: true,
    message: 'Product removed from wishlist'
  });
}));

/**
 * @route   POST /api/user/wishlist/clear
 * @desc    Clear wishlist
 * @access  Private
 */
router.post('/wishlist/clear', authenticateToken, asyncHandler(async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.userId }
  });

  res.json({
    success: true,
    message: 'Wishlist cleared successfully'
  });
}));

/**
 * @route   GET /api/user/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/orders', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const where = { userId: req.userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productSku: true,
            quantity: true,
            price: true,
            total: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * @route   GET /api/user/orders/:id
 * @desc    Get specific order details
 * @access  Private
 */
router.get('/orders/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.userId
    },
    include: {
      items: true,
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          provider: true,
          createdAt: true
        }
      }
    }
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Order not found'
      }
    });
  }

  res.json({
    success: true,
    data: { order }
  });
}));

/**
 * @route   GET /api/user/sessions
 * @desc    Get active user sessions
 * @access  Private
 */
router.get('/sessions', authenticateToken, asyncHandler(async (req, res) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId: req.userId,
      isActive: true
    },
    orderBy: { lastUsedAt: 'desc' }
  });

  // Mark current session
  const currentToken = req.headers.authorization?.replace('Bearer ', '');
  const sessionsWithCurrent = sessions.map(session => ({
    ...session,
    isCurrent: session.token === currentToken
  }));

  res.json({
    success: true,
    data: { sessions: sessionsWithCurrent }
  });
}));

/**
 * @route   DELETE /api/user/sessions/:id
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.userSession.findFirst({
    where: {
      id,
      userId: req.userId,
      isActive: true
    }
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Session not found'
      }
    });
  }

  await prisma.userSession.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Session revoked successfully'
  });
}));

/**
 * @route   DELETE /api/user/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete('/sessions', authenticateToken, asyncHandler(async (req, res) => {
  const currentToken = req.headers.authorization?.replace('Bearer ', '');

  await prisma.userSession.updateMany({
    where: {
      userId: req.userId,
      isActive: true,
      token: { not: currentToken }
    },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'All other sessions revoked successfully'
  });
}));

module.exports = router;
