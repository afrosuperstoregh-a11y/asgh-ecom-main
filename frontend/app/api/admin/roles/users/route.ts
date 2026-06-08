import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../../lib/auth';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Environment-safe logging
const isDevelopment = process.env.NODE_ENV === 'development';
const logger = {
  log: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[API] ${message}`, error || '');
    }
  }
};

// Admin users with roles endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Role users API request received');
    
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      logger.log('Unauthorized role users access attempt - no token');
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation) {
      logger.log('Unauthorized role users access attempt - invalid token');
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    logger.log('Admin role users request authenticated');
    
    // Users with roles data
    const roleUsersData = {
      success: true,
      message: 'Role users retrieved successfully',
      data: [
        {
          id: 1,
          email: 'admin@afrosuperstore.ca',
          firstName: 'Super',
          lastName: 'Admin',
          username: 'superadmin',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          roles: [
            {
              id: 1,
              name: 'Super Admin',
              slug: 'super_admin',
              assignedAt: '2024-01-01T00:00:00Z'
            }
          ],
          permissions: [
            'users.create', 'users.read', 'users.update', 'users.delete',
            'products.create', 'products.read', 'products.update', 'products.delete',
            'categories.create', 'categories.read', 'categories.update', 'categories.delete',
            'orders.create', 'orders.read', 'orders.update', 'orders.delete',
            'customers.create', 'customers.read', 'customers.update', 'customers.delete',
            'settings.create', 'settings.read', 'settings.update', 'settings.delete',
            'analytics.read', 'reports.create', 'reports.read', 'reports.update', 'reports.delete',
            'roles.create', 'roles.read', 'roles.update', 'roles.delete',
            'permissions.create', 'permissions.read', 'permissions.update', 'permissions.delete'
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'info@afrosuperstore.ca',
          firstName: 'Store',
          lastName: 'Manager',
          username: 'storemanager',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          roles: [
            {
              id: 2,
              name: 'Admin',
              slug: 'admin',
              assignedAt: '2024-01-15T00:00:00Z'
            }
          ],
          permissions: [
            'products.create', 'products.read', 'products.update',
            'categories.create', 'categories.read', 'categories.update',
            'orders.read', 'orders.update',
            'customers.read', 'customers.update',
            'settings.read', 'settings.update',
            'analytics.read', 'reports.read',
            'roles.read'
          ],
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          email: 'product.manager@afrosuperstore.ca',
          firstName: 'Product',
          lastName: 'Manager',
          username: 'productmgr',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          roles: [
            {
              id: 3,
              name: 'Product Manager',
              slug: 'product_manager',
              assignedAt: '2024-02-01T00:00:00Z'
            }
          ],
          permissions: [
            'products.create', 'products.read', 'products.update',
            'categories.create', 'categories.read', 'categories.update'
          ],
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 4,
          email: 'order.manager@afrosuperstore.ca',
          firstName: 'Order',
          lastName: 'Manager',
          username: 'ordermgr',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          roles: [
            {
              id: 4,
              name: 'Order Manager',
              slug: 'order_manager',
              assignedAt: '2024-02-15T00:00:00Z'
            }
          ],
          permissions: [
            'orders.read', 'orders.update',
            'customers.read', 'customers.update',
            'analytics.read'
          ],
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 5,
          email: 'content.manager@afrosuperstore.ca',
          firstName: 'Content',
          lastName: 'Manager',
          username: 'contentmgr',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
          roles: [
            {
              id: 5,
              name: 'Content Manager',
              slug: 'content_manager',
              assignedAt: '2024-03-01T00:00:00Z'
            }
          ],
          permissions: [
            'products.read', 'products.update',
            'categories.read', 'categories.update',
            'settings.read'
          ],
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 6,
          email: 'support.agent1@afrosuperstore.ca',
          firstName: 'Support',
          lastName: 'Agent One',
          username: 'support1',
          avatar: null,
          status: 'active',
          lastLogin: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
          roles: [
            {
              id: 6,
              name: 'Support Agent',
              slug: 'support_agent',
              assignedAt: '2024-03-15T00:00:00Z'
            }
          ],
          permissions: [
            'orders.read',
            'customers.read',
            'products.read'
          ],
          createdAt: '2024-03-15T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 7,
          email: 'viewer.user@afrosuperstore.ca',
          firstName: 'Viewer',
          lastName: 'User',
          username: 'viewer',
          avatar: null,
          status: 'inactive',
          lastLogin: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
          roles: [
            {
              id: 7,
              name: 'Viewer',
              slug: 'viewer',
              assignedAt: '2024-03-20T00:00:00Z'
            }
          ],
          permissions: [
            'products.read',
            'categories.read',
            'orders.read',
            'customers.read',
            'analytics.read'
          ],
          createdAt: '2024-03-20T00:00:00Z',
          updatedAt: new Date().toISOString()
        }
      ]
    };

    logger.log('Admin role users data served successfully');
    return NextResponse.json(roleUsersData);
  } catch (error) {
    console.error('🔍 [DEBUG] Role users API error:', error);
    logger.error('Role users API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch role users: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    const body = await request.json();
    logger.log('Admin user role assignment request', body);

    // In a real implementation, you would assign the role to the user in the database here
    const assignment = {
      id: Date.now(),
      userId: body.userId,
      roleId: body.roleId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'current_user' // Would come from token
    };
    
    return NextResponse.json({
      success: true,
      message: 'User role assigned successfully',
      data: assignment
    });
  } catch (error) {
    logger.error('User role assignment error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to assign user role: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
