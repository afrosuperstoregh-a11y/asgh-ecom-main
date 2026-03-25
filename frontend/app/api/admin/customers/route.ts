import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../lib/auth';

// Initialize server-side logging
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

// Admin customers endpoint
export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG] === CUSTOMERS API ROUTE CALLED ===');
  
  try {
    console.log('🔍 [DEBUG] Customers API request received');
    
    // Validate admin token using shared validation
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !validateTokenFormat(token)) {
      logger.log('Unauthorized customers access attempt - invalid token');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Invalid or expired admin token'
      }, { status: 401 });
    }

    logger.log('Admin authenticated for customers API');
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    // Mock customer data for now - replace with real database queries
    const mockCustomers = [
      {
        id: 'cust-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalSpent: 1254.50,
        averageOrderValue: 125.45,
        orderCount: 10,
        lastOrderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        role: 'customer'
      },
      {
        id: 'cust-002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        totalSpent: 890.00,
        averageOrderValue: 89.00,
        orderCount: 10,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        role: 'customer'
      }
    ];

    // Apply filters to mock data
    let filteredCustomers = mockCustomers;
    
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredCustomers = filteredCustomers.filter(customer => 
        status === 'active' ? customer.role === 'customer' : customer.role === status
      );
    }

    // Sort results
    filteredCustomers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a] as any;
      const bValue = b[sortBy as keyof typeof b] as any;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = filteredCustomers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    const customersData = {
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      }
    };

    logger.log('Customers data served successfully', { 
      customerCount: paginatedCustomers.length,
      totalCount: total 
    });
    return NextResponse.json(customersData);
  } catch (error) {
    logger.error('Customers API error', error);
    return NextResponse.json({
      success: false,
      message: 'API Error: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

