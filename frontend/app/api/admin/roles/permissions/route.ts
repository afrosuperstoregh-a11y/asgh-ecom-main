import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../../lib/auth';

const isDevelopment = process.env.NODE_ENV === 'development';
const logger = {
  log: (message: string, data?: any) => {
    if (isDevelopment) console.log(`[API] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) console.error(`[API] ${message}`, error || '');
  }
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !validateTokenFormat(token)) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const permissionsData = {
      success: true,
      message: 'Permissions retrieved successfully',
      data: [
        {
          id: 1,
          name: 'User Management',
          slug: 'users',
          description: 'Manage admin users',
          permissions: [
            { id: 1, name: 'Create Users', slug: 'users.create', description: 'Create new admin users' },
            { id: 2, name: 'View Users', slug: 'users.read', description: 'View admin user list' },
            { id: 3, name: 'Update Users', slug: 'users.update', description: 'Update user information' },
            { id: 4, name: 'Delete Users', slug: 'users.delete', description: 'Delete admin users' }
          ]
        },
        {
          id: 2,
          name: 'Product Management',
          slug: 'products',
          description: 'Manage products and inventory',
          permissions: [
            { id: 5, name: 'Create Products', slug: 'products.create', description: 'Add new products' },
            { id: 6, name: 'View Products', slug: 'products.read', description: 'View product list' },
            { id: 7, name: 'Update Products', slug: 'products.update', description: 'Edit products' },
            { id: 8, name: 'Delete Products', slug: 'products.delete', description: 'Remove products' }
          ]
        },
        {
          id: 3,
          name: 'Category Management',
          slug: 'categories',
          description: 'Manage product categories',
          permissions: [
            { id: 9, name: 'Create Categories', slug: 'categories.create', description: 'Add new categories' },
            { id: 10, name: 'View Categories', slug: 'categories.read', description: 'View category list' },
            { id: 11, name: 'Update Categories', slug: 'categories.update', description: 'Edit categories' },
            { id: 12, name: 'Delete Categories', slug: 'categories.delete', description: 'Remove categories' }
          ]
        },
        {
          id: 4,
          name: 'Order Management',
          slug: 'orders',
          description: 'Manage customer orders',
          permissions: [
            { id: 13, name: 'Create Orders', slug: 'orders.create', description: 'Create manual orders' },
            { id: 14, name: 'View Orders', slug: 'orders.read', description: 'View order list' },
            { id: 15, name: 'Update Orders', slug: 'orders.update', description: 'Update order status' },
            { id: 16, name: 'Delete Orders', slug: 'orders.delete', description: 'Cancel/delete orders' }
          ]
        },
        {
          id: 5,
          name: 'Customer Management',
          slug: 'customers',
          description: 'Manage customer accounts',
          permissions: [
            { id: 17, name: 'Create Customers', slug: 'customers.create', description: 'Create customer accounts' },
            { id: 18, name: 'View Customers', slug: 'customers.read', description: 'View customer list' },
            { id: 19, name: 'Update Customers', slug: 'customers.update', description: 'Update customer information' },
            { id: 20, name: 'Delete Customers', slug: 'customers.delete', description: 'Delete customer accounts' }
          ]
        },
        {
          id: 6,
          name: 'Settings Management',
          slug: 'settings',
          description: 'Manage store settings',
          permissions: [
            { id: 21, name: 'Create Settings', slug: 'settings.create', description: 'Create new settings' },
            { id: 22, name: 'View Settings', slug: 'settings.read', description: 'View store settings' },
            { id: 23, name: 'Update Settings', slug: 'settings.update', description: 'Update store settings' },
            { id: 24, name: 'Delete Settings', slug: 'settings.delete', description: 'Delete settings' }
          ]
        },
        {
          id: 7,
          name: 'Analytics & Reports',
          slug: 'analytics',
          description: 'View analytics and reports',
          permissions: [
            { id: 25, name: 'View Analytics', slug: 'analytics.read', description: 'View store analytics' },
            { id: 26, name: 'Create Reports', slug: 'reports.create', description: 'Generate reports' },
            { id: 27, name: 'View Reports', slug: 'reports.read', description: 'View existing reports' },
            { id: 28, name: 'Update Reports', slug: 'reports.update', description: 'Update reports' },
            { id: 29, name: 'Delete Reports', slug: 'reports.delete', description: 'Delete reports' }
          ]
        },
        {
          id: 8,
          name: 'Role Management',
          slug: 'roles',
          description: 'Manage admin roles',
          permissions: [
            { id: 30, name: 'Create Roles', slug: 'roles.create', description: 'Create new roles' },
            { id: 31, name: 'View Roles', slug: 'roles.read', description: 'View role list' },
            { id: 32, name: 'Update Roles', slug: 'roles.update', description: 'Update roles' },
            { id: 33, name: 'Delete Roles', slug: 'roles.delete', description: 'Delete roles' }
          ]
        },
        {
          id: 9,
          name: 'Permission Management',
          slug: 'permissions',
          description: 'Manage system permissions',
          permissions: [
            { id: 34, name: 'Create Permissions', slug: 'permissions.create', description: 'Create new permissions' },
            { id: 35, name: 'View Permissions', slug: 'permissions.read', description: 'View permission list' },
            { id: 36, name: 'Update Permissions', slug: 'permissions.update', description: 'Update permissions' },
            { id: 37, name: 'Delete Permissions', slug: 'permissions.delete', description: 'Delete permissions' }
          ]
        }
      ]
    };

    return NextResponse.json(permissionsData);
  } catch (error) {
    logger.error('Permissions API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch permissions: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
