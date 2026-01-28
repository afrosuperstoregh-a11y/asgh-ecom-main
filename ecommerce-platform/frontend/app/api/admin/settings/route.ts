import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAuthErrorResponse, createSuccessResponse } from '../lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin settings API called');
    
    // Authenticate the request
    const auth = await authenticateAdmin();
    if (auth.error) {
      console.log('Settings auth failed:', auth.error);
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    console.log('Settings auth successful, returning data');
    
    // Mock settings data
    const settings = {
      general: [
        { key: 'store_name', value: 'AfroSuperStore', type: 'text', label: 'Store Name' },
        { key: 'store_email', value: 'info@afrosuperstore.ca', type: 'email', label: 'Store Email' },
        { key: 'store_phone', value: '+1-555-0123', type: 'tel', label: 'Store Phone' },
        { key: 'store_currency', value: 'USD', type: 'select', label: 'Currency', options: ['USD', 'CAD', 'EUR', 'GBP'] }
      ],
      shipping: [
        { key: 'free_shipping_threshold', value: '50', type: 'number', label: 'Free Shipping Threshold' },
        { key: 'default_shipping_rate', value: '9.99', type: 'number', label: 'Default Shipping Rate' }
      ],
      tax: [
        { key: 'tax_rate', value: '13', type: 'number', label: 'Tax Rate (%)' },
        { key: 'tax_included', value: 'false', type: 'boolean', label: 'Tax Included in Prices' }
      ]
    };

    return NextResponse.json({ success: true, settings });

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateAdmin();
    if (auth.error) {
      return NextResponse.json(createAuthErrorResponse(auth.error, auth.status), { status: auth.status });
    }

    const body = await request.json();
    console.log('Updating settings:', body);

    // Mock settings update
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update settings'
    }, { status: 500 });
  }
}
