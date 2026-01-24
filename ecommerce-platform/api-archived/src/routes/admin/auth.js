const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!adminUser || !adminUser.isActive) {
      return res.status(401).json({ message: 'Invalid token or inactive user.' });
    }

    req.adminUser = adminUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Permission check middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    const permissions = req.adminUser.role.permissions || [];
    if (!permissions.includes(permission) && !permissions.includes('SUPER_ADMIN')) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    next();
  };
};

// Admin Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!adminUser || !adminUser.isActive) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(password, adminUser.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: { lastLoginAt: new Date() }
  });

  // Log the login
  await prisma.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      action: 'LOGIN',
      resourceType: 'ADMIN_USER',
      resourceId: adminUser.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  const token = jwt.sign(
    { userId: adminUser.id, email: adminUser.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      lastLoginAt: adminUser.lastLoginAt
    }
  });
}));

// Get current admin user
router.get('/me', verifyAdminToken, asyncHandler(async (req, res) => {
  res.json({
    id: req.adminUser.id,
    email: req.adminUser.email,
    name: req.adminUser.name,
    role: req.adminUser.role,
    lastLoginAt: req.adminUser.lastLoginAt
  });
}));

// Change password
router.put('/change-password', [
  verifyAdminToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, req.adminUser.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await prisma.adminUser.update({
    where: { id: req.adminUser.id },
    data: { password: hashedNewPassword }
  });

  // Log password change
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser.id,
      action: 'UPDATE',
      resourceType: 'ADMIN_USER',
      resourceId: req.adminUser.id,
      newValues: { passwordChanged: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Password changed successfully.' });
}));

// Logout (client-side token removal, but we log it)
router.post('/logout', verifyAdminToken, asyncHandler(async (req, res) => {
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser.id,
      action: 'LOGOUT',
      resourceType: 'ADMIN_USER',
      resourceId: req.adminUser.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Logged out successfully.' });
}));

module.exports = { router, verifyAdminToken, requirePermission };
