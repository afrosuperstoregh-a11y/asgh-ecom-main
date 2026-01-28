import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin roles API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Roles auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Roles auth successful, returning data');
    
    // Mock roles data
    const roles = [
      {
        id: 'ROLE-001',
        name: 'Super Admin',
        description: 'Full system access',
        permissions: ['*'],
        isSystem: true,
        userCount: 1
      },
      {
        id: 'ROLE-002',
        name: 'Admin',
        description: 'Administrative access',
        permissions: ['products.read', 'products.write', 'orders.read', 'orders.write', 'customers.read'],
        isSystem: true,
        userCount: 3
      },
      {
        id: 'ROLE-003',
        name: 'Manager',
        description: 'Store management access',
        permissions: ['products.read', 'products.write', 'orders.read', 'customers.read'],
        isSystem: false,
        userCount: 5
      }
    ];

    return NextResponse.json(createSuccessResponse(roles));

  } catch (error) {
    console.error('Roles API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch roles'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    console.log('Creating role:', body);

    // Mock role creation
    const newRole = {
      id: `ROLE-${Date.now()}`,
      ...body,
      isSystem: false,
      userCount: 0
    };

    return NextResponse.json(createSuccessResponse(newRole));

  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create role'
    }, { status: 500 });
  }
}
