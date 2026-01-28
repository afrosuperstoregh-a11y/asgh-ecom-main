import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin customers API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Customers auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Customers auth successful, returning data');
    
    // Mock customers data
    const customers = [
      {
        id: 'CUST-001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-0123',
        createdAt: '2024-01-15T10:30:00Z',
        totalSpent: 1250.75,
        averageOrderValue: 125.08,
        orderCount: 10,
        lastOrderDate: '2024-01-20T14:22:00Z',
        status: 'active'
      },
      {
        id: 'CUST-002',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '+1-555-0124',
        createdAt: '2024-01-10T09:15:00Z',
        totalSpent: 890.50,
        averageOrderValue: 89.05,
        orderCount: 10,
        lastOrderDate: '2024-01-18T16:45:00Z',
        status: 'active'
      },
      {
        id: 'CUST-003',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        phone: '+1-555-0125',
        createdAt: '2024-01-08T11:20:00Z',
        totalSpent: 2340.00,
        averageOrderValue: 234.00,
        orderCount: 10,
        lastOrderDate: '2024-01-19T10:30:00Z',
        status: 'active'
      },
      {
        id: 'CUST-004',
        name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '+1-555-0126',
        createdAt: '2024-01-05T14:10:00Z',
        totalSpent: 450.25,
        averageOrderValue: 90.05,
        orderCount: 5,
        lastOrderDate: '2024-01-12T13:15:00Z',
        status: 'blocked'
      }
    ];

    // Mock pagination
    const pagination = {
      page: 1,
      limit: 20,
      total: customers.length,
      pages: Math.ceil(customers.length / 20)
    };

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination
      }
    });

  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch customers'
    }, { status: 500 });
  }
}
