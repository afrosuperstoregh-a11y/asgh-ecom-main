const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all system settings
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  const where = category ? { category } : {};
  
  const settings = await prisma.systemSetting.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { key: 'asc' }
    ]
  });

  // Group by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  res.json({
    settings: groupedSettings,
    flat: settings
  });
}));

// Get single setting
router.get('/:key', asyncHandler(async (req, res) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: req.params.key }
  });

  if (!setting) {
    return res.status(404).json({ message: 'Setting not found' });
  }

  res.json(setting);
}));

// Update setting
router.put('/:key', [
  body('value').notEmpty(),
  body('description').optional().trim(),
  body('category').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { value, description, category } = req.body;

  const setting = await prisma.systemSetting.upsert({
    where: { key: req.params.key },
    update: {
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      description,
      category: category || 'general',
      updatedAt: new Date()
    },
    create: {
      key: req.params.key,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      description,
      category: category || 'general'
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'SYSTEM_SETTING',
      resourceId: setting.id,
      newValues: { key: req.params.key, value },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(setting);
}));

// Tax Zones Management
router.get('/tax-zones', asyncHandler(async (req, res) => {
  const taxZones = await prisma.taxZone.findMany({
    include: {
      rates: {
        orderBy: { validFrom: 'desc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json(taxZones);
}));

router.post('/tax-zones', [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('countries').isArray(),
  body('provinces').optional().isArray(),
  body('postalCodes').optional().isArray(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const taxZone = await prisma.taxZone.create({
    data: {
      ...req.body,
      countries: JSON.stringify(req.body.countries),
      provinces: req.body.provinces ? JSON.stringify(req.body.provinces) : null,
      postalCodes: req.body.postalCodes ? JSON.stringify(req.body.postalCodes) : null
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'TAX_ZONE',
      resourceId: taxZone.id,
      newValues: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(taxZone);
}));

router.put('/tax-zones/:id', [
  body('name').optional().notEmpty().trim(),
  body('code').optional().notEmpty().trim(),
  body('countries').optional().isArray(),
  body('provinces').optional().isArray(),
  body('postalCodes').optional().isArray(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingTaxZone = await prisma.taxZone.findUnique({
    where: { id: req.params.id }
  });

  if (!existingTaxZone) {
    return res.status(404).json({ message: 'Tax zone not found' });
  }

  const updateData = { ...req.body };
  if (req.body.countries) {
    updateData.countries = JSON.stringify(req.body.countries);
  }
  if (req.body.provinces) {
    updateData.provinces = JSON.stringify(req.body.provinces);
  }
  if (req.body.postalCodes) {
    updateData.postalCodes = JSON.stringify(req.body.postalCodes);
  }

  const updatedTaxZone = await prisma.taxZone.update({
    where: { id: req.params.id },
    data: updateData
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'TAX_ZONE',
      resourceId: req.params.id,
      oldValues: existingTaxZone,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedTaxZone);
}));

router.delete('/tax-zones/:id', asyncHandler(async (req, res) => {
  const existingTaxZone = await prisma.taxZone.findUnique({
    where: { id: req.params.id }
  });

  if (!existingTaxZone) {
    return res.status(404).json({ message: 'Tax zone not found' });
  }

  await prisma.taxZone.delete({
    where: { id: req.params.id }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'TAX_ZONE',
      resourceId: existingTaxZone.id,
      oldValues: existingTaxZone,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Tax zone deleted successfully' });
}));

// Tax Rates Management
router.post('/tax-zones/:zoneId/rates', [
  body('name').notEmpty().trim(),
  body('rate').isFloat({ min: 0, max: 100 }),
  body('type').isIn(['STANDARD', 'REDUCED', 'ZERO', 'EXEMPT']),
  body('appliesTo').optional().isObject(),
  body('validFrom').isISO8601(),
  body('validTo').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const taxZone = await prisma.taxZone.findUnique({
    where: { id: req.params.zoneId }
  });

  if (!taxZone) {
    return res.status(404).json({ message: 'Tax zone not found' });
  }

  const taxRate = await prisma.taxRate.create({
    data: {
      ...req.body,
      taxZoneId: req.params.zoneId,
      appliesTo: req.body.appliesTo ? JSON.stringify(req.body.appliesTo) : null,
      validFrom: new Date(req.body.validFrom),
      validTo: req.body.validTo ? new Date(req.body.validTo) : null
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'TAX_RATE',
      resourceId: taxRate.id,
      newValues: { ...req.body, taxZoneId: req.params.zoneId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(taxRate);
}));

// Shipping Zones Management
router.get('/shipping-zones', asyncHandler(async (req, res) => {
  const shippingZones = await prisma.shippingZone.findMany({
    include: {
      rates: {
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json(shippingZones);
}));

router.post('/shipping-zones', [
  body('name').notEmpty().trim(),
  body('countries').isArray(),
  body('provinces').optional().isArray(),
  body('postalCodes').optional().isArray(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const shippingZone = await prisma.shippingZone.create({
    data: {
      ...req.body,
      countries: JSON.stringify(req.body.countries),
      provinces: req.body.provinces ? JSON.stringify(req.body.provinces) : null,
      postalCodes: req.body.postalCodes ? JSON.stringify(req.body.postalCodes) : null
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'SHIPPING_ZONE',
      resourceId: shippingZone.id,
      newValues: req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(shippingZone);
}));

router.put('/shipping-zones/:id', [
  body('name').optional().notEmpty().trim(),
  body('countries').optional().isArray(),
  body('provinces').optional().isArray(),
  body('postalCodes').optional().isArray(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingShippingZone = await prisma.shippingZone.findUnique({
    where: { id: req.params.id }
  });

  if (!existingShippingZone) {
    return res.status(404).json({ message: 'Shipping zone not found' });
  }

  const updateData = { ...req.body };
  if (req.body.countries) {
    updateData.countries = JSON.stringify(req.body.countries);
  }
  if (req.body.provinces) {
    updateData.provinces = JSON.stringify(req.body.provinces);
  }
  if (req.body.postalCodes) {
    updateData.postalCodes = JSON.stringify(req.body.postalCodes);
  }

  const updatedShippingZone = await prisma.shippingZone.update({
    where: { id: req.params.id },
    data: updateData
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'SHIPPING_ZONE',
      resourceId: req.params.id,
      oldValues: existingShippingZone,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedShippingZone);
}));

// Shipping Rates Management
router.post('/shipping-zones/:zoneId/rates', [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('freeOverAmount').optional().isFloat({ min: 0 }),
  body('deliveryTime').optional().trim(),
  body('maxWeight').optional().isFloat({ min: 0 }),
  body('maxDimensions').optional().isObject(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const shippingZone = await prisma.shippingZone.findUnique({
    where: { id: req.params.zoneId }
  });

  if (!shippingZone) {
    return res.status(404).json({ message: 'Shipping zone not found' });
  }

  const shippingRate = await prisma.shippingRate.create({
    data: {
      ...req.body,
      shippingZoneId: req.params.zoneId,
      maxDimensions: req.body.maxDimensions ? JSON.stringify(req.body.maxDimensions) : null
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'SHIPPING_RATE',
      resourceId: shippingRate.id,
      newValues: { ...req.body, shippingZoneId: req.params.zoneId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(shippingRate);
}));

// Get tax calculation for cart
router.post('/calculate-tax', [
  body('items').isArray(),
  body('shippingAddress').isObject(),
  body('customerAddress').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, shippingAddress, customerAddress } = req.body;
  
  // Find applicable tax zone
  const address = shippingAddress || customerAddress;
  if (!address) {
    return res.json({ taxAmount: 0, taxRates: [] });
  }

  const taxZone = await prisma.taxZone.findFirst({
    where: {
      isActive: true,
      countries: {
        has: address.country
      }
    },
    include: {
      rates: {
        where: {
          isValid: true,
          validFrom: { lte: new Date() },
          OR: [
            { validTo: null },
            { validTo: { gte: new Date() } }
          ]
        }
      }
    }
  });

  if (!taxZone) {
    return res.json({ taxAmount: 0, taxRates: [] });
  }

  // Calculate tax based on rates
  let totalTax = 0;
  const applicableRates = [];

  for (const rate of taxZone.rates) {
    let taxableAmount = 0;
    
    // Check if rate applies to specific products/categories
    if (rate.appliesTo) {
      const appliesTo = JSON.parse(rate.appliesTo);
      // Logic to check if items match the appliesTo criteria
      // This is simplified - in production you'd have more complex matching
      taxableAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else {
      taxableAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    const taxAmount = (taxableAmount * rate.rate) / 100;
    totalTax += taxAmount;
    
    applicableRates.push({
      name: rate.name,
      rate: rate.rate,
      taxableAmount,
      taxAmount
    });
  }

  res.json({
    taxAmount: totalTax,
    taxRates: applicableRates,
    taxZone: {
      name: taxZone.name,
      code: taxZone.code
    }
  });
}));

// Get shipping calculation for cart
router.post('/calculate-shipping', [
  body('items').isArray(),
  body('shippingAddress').isObject(),
  body('customerAddress').optional().isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, shippingAddress, customerAddress } = req.body;
  
  // Calculate total weight and cart value
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const cartValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Find applicable shipping zone
  const address = shippingAddress || customerAddress;
  if (!address) {
    return res.json({ shippingRates: [] });
  }

  const shippingZone = await prisma.shippingZone.findFirst({
    where: {
      isActive: true,
      countries: {
        has: address.country
      }
    },
    include: {
      rates: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!shippingZone) {
    return res.json({ shippingRates: [] });
  }

  // Filter applicable rates based on weight and cart value
  const applicableRates = shippingZone.rates.filter(rate => {
    if (rate.maxWeight && totalWeight > rate.maxWeight) {
      return false;
    }
    if (rate.freeOverAmount && cartValue >= rate.freeOverAmount) {
      return true; // Free shipping
    }
    return true;
  }).map(rate => {
    let price = rate.price;
    
    // Check for free shipping
    if (rate.freeOverAmount && cartValue >= rate.freeOverAmount) {
      price = 0;
    }
    
    return {
      id: rate.id,
      name: rate.name,
      code: rate.code,
      price,
      deliveryTime: rate.deliveryTime,
      isFree: price === 0
    };
  });

  res.json({
    shippingRates: applicableRates,
    shippingZone: {
      name: shippingZone.name
    },
    cartSummary: {
      totalWeight,
      cartValue
    }
  });
}));

module.exports = router;
