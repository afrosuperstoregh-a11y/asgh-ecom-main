const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all roles
router.get('/', asyncHandler(async (req, res) => {
  const roles = await prisma.adminRole.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json(roles);
}));

// Get single role
router.get('/:id', asyncHandler(async (req, res) => {
  const role = await prisma.adminRole.findUnique({
    where: { id: req.params.id },
    include: {
      users: {
        select: { id: true, name: true, email: true, isActive: true, createdAt: true }
      }
    }
  });

  if (!role) {
    return res.status(404).json({ message: 'Role not found' });
  }

  res.json(role);
}));

// Create role
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('permissions').isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, permissions } = req.body;

  // Check if role name already exists
  const existingRole = await prisma.adminRole.findUnique({
    where: { name }
  });

  if (existingRole) {
    return res.status(400).json({ message: 'Role name already exists' });
  }

  const role = await prisma.adminRole.create({
    data: {
      name,
      description,
      permissions: JSON.stringify(permissions)
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'CREATE',
      resourceType: 'ADMIN_ROLE',
      resourceId: role.id,
      newValues: { name, description, permissions },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json(role);
}));

// Update role
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('permissions').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingRole = await prisma.adminRole.findUnique({
    where: { id: req.params.id }
  });

  if (!existingRole) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (existingRole.isSystem) {
    return res.status(400).json({ message: 'Cannot modify system roles' });
  }

  const updateData = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.permissions !== undefined) updateData.permissions = JSON.stringify(req.body.permissions);

  // Check name uniqueness if changed
  if (req.body.name && req.body.name !== existingRole.name) {
    const nameExists = await prisma.adminRole.findUnique({
      where: { name: req.body.name }
    });

    if (nameExists) {
      return res.status(400).json({ message: 'Role name already exists' });
    }
  }

  const updatedRole = await prisma.adminRole.update({
    where: { id: req.params.id },
    data: updateData
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'ADMIN_ROLE',
      resourceId: req.params.id,
      oldValues: existingRole,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedRole);
}));

// Delete role
router.delete('/:id', asyncHandler(async (req, res) => {
  const existingRole = await prisma.adminRole.findUnique({
    where: { id: req.params.id }
  });

  if (!existingRole) {
    return res.status(404).json({ message: 'Role not found' });
  }

  if (existingRole.isSystem) {
    return res.status(400).json({ message: 'Cannot delete system roles' });
  }

  // Check if role has users
  const usersWithRole = await prisma.adminUser.count({
    where: { roleId: req.params.id }
  });

  if (usersWithRole > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete role with assigned users. Please reassign users first.' 
    });
  }

  await prisma.adminRole.delete({
    where: { id: req.params.id }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'ADMIN_ROLE',
      resourceId: existingRole.id,
      oldValues: existingRole,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'Role deleted successfully' });
}));

// Get all admin users
router.get('/users', asyncHandler(async (req, res) => {
  const users = await prisma.adminUser.findMany({
    include: {
      role: {
        select: { id: true, name: true, permissions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(users);
}));

// Create admin user
router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('roleId').isUUID()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, name, password, roleId } = req.body;

  // Check if email already exists
  const existingUser = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  // Check if role exists
  const role = await prisma.adminRole.findUnique({
    where: { id: roleId }
  });

  if (!role) {
    return res.status(400).json({ message: 'Role not found' });
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.adminUser.create({
    data: {
      email,
      name,
      password: hashedPassword,
      roleId
    },
    include: {
      role: {
        select: { id: true, name: true, permissions: true }
      }
    }
  });

  // Log creation
  await prisma.auditLog.create({
    data: {
      adminUserId: user.id,
      action: 'CREATE',
      resourceType: 'ADMIN_USER',
      resourceId: user.id,
      newValues: { email, name, roleId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  });
}));

// Update admin user
router.put('/users/:id', [
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().notEmpty().trim(),
  body('roleId').optional().isUUID(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: { id: req.params.id }
  });

  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updateData = {};
  if (req.body.email !== undefined) updateData.email = req.body.email;
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.roleId !== undefined) updateData.roleId = req.body.roleId;
  if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

  // Check email uniqueness if changed
  if (req.body.email && req.body.email !== existingUser.email) {
    const emailExists = await prisma.adminUser.findUnique({
      where: { email: req.body.email }
    });

    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
  }

  // Check role exists if changed
  if (req.body.roleId) {
    const role = await prisma.adminRole.findUnique({
      where: { id: req.body.roleId }
    });

    if (!role) {
      return res.status(400).json({ message: 'Role not found' });
    }
  }

  const updatedUser = await prisma.adminUser.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      role: {
        select: { id: true, name: true, permissions: true }
      }
    }
  });

  // Log update
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'UPDATE',
      resourceType: 'ADMIN_USER',
      resourceId: req.params.id,
      oldValues: existingUser,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json(updatedUser);
}));

// Delete admin user
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const existingUser = await prisma.adminUser.findUnique({
    where: { id: req.params.id }
  });

  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (existingUser.id === req.adminUser?.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  await prisma.adminUser.delete({
    where: { id: req.params.id }
  });

  // Log deletion
  await prisma.auditLog.create({
    data: {
      adminUserId: req.adminUser?.id,
      action: 'DELETE',
      resourceType: 'ADMIN_USER',
      resourceId: existingUser.id,
      oldValues: existingUser,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({ message: 'User deleted successfully' });
}));

// Get available permissions
router.get('/permissions', asyncHandler(async (req, res) => {
  const permissions = {
    dashboard: ['view_dashboard', 'view_analytics'],
    products: ['view_products', 'create_products', 'edit_products', 'delete_products', 'manage_inventory'],
    orders: ['view_orders', 'edit_orders', 'process_refunds', 'manage_shipping'],
    customers: ['view_customers', 'edit_customers', 'manage_customer_accounts'],
    categories: ['view_categories', 'create_categories', 'edit_categories', 'delete_categories'],
    promotions: ['view_promotions', 'create_promotions', 'edit_promotions', 'delete_promotions'],
    payments: ['view_payments', 'process_refunds', 'view_transactions'],
    settings: ['view_settings', 'edit_settings', 'manage_tax', 'manage_shipping'],
    users: ['view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles'],
    system: ['view_audit_logs', 'manage_system_settings', 'super_admin']
  };

  res.json(permissions);
}));

module.exports = router;
