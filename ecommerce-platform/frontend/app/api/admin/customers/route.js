import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Mock customers data
    const customers = [
      {
        id: 'CUST-001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        totalOrders: 5,
        totalSpent: 445.75,
        status: 'active',
        joinedAt: '2024-01-01'
      },
      {
        id: 'CUST-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        totalOrders: 3,
        totalSpent: 287.50,
        status: 'active',
        joinedAt: '2024-01-05'
      },
      {
        id: 'CUST-003',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1-555-0125',
        totalOrders: 8,
        totalSpent: 623.25,
        status: 'active',
        joinedAt: '2023-12-15'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      }
    });

  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch customers'
    }, { status: 500 });
  }
}
