import { NextRequest, NextResponse } from 'next/server';
import { validateTokenFormat } from '../../../../lib/auth';

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

// Admin settings endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Settings API request received');
    
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      logger.log('Unauthorized settings access attempt - no token');
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation) {
      logger.log('Unauthorized settings access attempt - invalid token');
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    logger.log('Admin settings request authenticated');
    
    // Store settings data
    const settingsData = {
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        store: {
          name: 'Afro Superstore',
          description: 'Your premier destination for African products and culture',
          email: 'info@afrosuperstore.ca',
          phone: '+1 (555) 123-4567',
          address: {
            street: '123 Main Street',
            city: 'Toronto',
            province: 'Ontario',
            postalCode: 'M5V 2T6',
            country: 'Canada'
          }
        },
        currency: {
          code: 'CAD',
          symbol: '$',
          position: 'before'
        },
        tax: {
          enabled: true,
          defaultRate: 13,
          includedInPrice: false
        },
        shipping: {
          freeShippingThreshold: 100,
          defaultShippingCost: 15.99
        },
        payment: {
          methods: ['stripe', 'paypal', 'cash_on_delivery'],
          stripe: {
            enabled: true,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
          }
        },
        inventory: {
          trackStock: true,
          lowStockThreshold: 10,
          outOfStockAction: 'hide'
        },
        notifications: {
          email: {
            newOrder: true,
            lowStock: true,
            customerRegistration: true
          },
          sms: {
            newOrder: false,
            lowStock: false
          }
        },
        seo: {
          metaTitle: 'Afro Superstore - African Products & Culture',
          metaDescription: 'Shop authentic African products, clothing, food, and more at Afro Superstore.',
          keywords: 'african products, african clothing, african food, cultural items'
        }
      }
    };

    logger.log('Admin settings data served successfully');
    return NextResponse.json(settingsData);
  } catch (error) {
    console.error('🔍 [DEBUG] Settings API error:', error);
    logger.error('Settings API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch settings: ' + (error as Error)?.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    logger.log('Admin settings update request', body);

    // In a real implementation, you would update the database here
    // For now, we'll just return success with the updated data
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: body
    });
  } catch (error) {
    logger.error('Settings update error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update settings: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
