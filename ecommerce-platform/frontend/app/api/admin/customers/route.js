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
        createdAt: '2024-01-01',
        totalSpent: 445.75,
        averageOrderValue: 89.15,
        orderCount: 5,
        lastOrderDate: '2024-01-25'
      },
      {
        id: 'CUST-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        createdAt: '2024-01-05',
        totalSpent: 287.50,
        averageOrderValue: 95.83,
        orderCount: 3,
        lastOrderDate: '2024-01-24'
      },
      {
        id: 'CUST-003',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1-555-0125',
        createdAt: '2023-12-15',
        totalSpent: 623.25,
        averageOrderValue: 77.91,
        orderCount: 8,
        lastOrderDate: '2024-01-23'
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

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Customer ID is required'
      }, { status: 400 });
    }

    // Mock customer status update
    const updatedCustomer = {
      id,
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update customer'
    }, { status: 500 });
  }
}
