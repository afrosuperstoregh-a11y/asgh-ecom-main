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

// Tax zones endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Tax zones API request received');
    
    // Validate authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      logger.log('Unauthorized tax zones access attempt - no token');
      return NextResponse.json({
        success: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation) {
      logger.log('Unauthorized tax zones access attempt - invalid token');
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired authentication token'
      }, { status: 401 });
    }

    logger.log('Admin tax zones request authenticated');
    
    // Tax zones data
    const taxZonesData = {
      success: true,
      message: 'Tax zones retrieved successfully',
      data: [
        {
          id: 1,
          name: 'Canada',
          code: 'CA',
          type: 'country',
          taxRates: [
            {
              id: 1,
              name: 'GST',
              rate: 5.00,
              type: 'federal',
              appliesTo: 'all'
            },
            {
              id: 2,
              name: 'PST',
              rate: 8.00,
              type: 'provincial',
              appliesTo: 'all',
              province: 'Ontario'
            },
            {
              id: 3,
              name: 'HST',
              rate: 13.00,
              type: 'harmonized',
              appliesTo: 'all',
              province: 'Ontario'
            }
          ],
          totalRate: 13.00,
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'United States',
          code: 'US',
          type: 'country',
          taxRates: [
            {
              id: 4,
              name: 'Sales Tax',
              rate: 8.25,
              type: 'state',
              appliesTo: 'all',
              state: 'California'
            }
          ],
          totalRate: 8.25,
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'United Kingdom',
          code: 'UK',
          type: 'country',
          taxRates: [
            {
              id: 5,
              name: 'VAT',
              rate: 20.00,
              type: 'national',
              appliesTo: 'all'
            }
          ],
          totalRate: 20.00,
          enabled: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 4,
          name: 'Nigeria',
          code: 'NG',
          type: 'country',
          taxRates: [
            {
              id: 6,
              name: 'VAT',
              rate: 7.50,
              type: 'national',
              appliesTo: 'all'
            }
          ],
          totalRate: 7.50,
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 5,
          name: 'Ghana',
          code: 'GH',
          type: 'country',
          taxRates: [
            {
              id: 7,
              name: 'VAT',
              rate: 12.50,
              type: 'national',
              appliesTo: 'all'
            }
          ],
          totalRate: 12.50,
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };

    logger.log('Admin tax zones data served successfully');
    return NextResponse.json(taxZonesData);
  } catch (error) {
    console.error('🔍 [DEBUG] Tax zones API error:', error);
    logger.error('Tax zones API error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch tax zones: ' + (error as Error)?.message
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
    logger.log('Admin tax zone creation request', body);

    // In a real implementation, you would create the tax zone in the database here
    const newTaxZone = {
      id: Date.now(),
      ...body,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      message: 'Tax zone created successfully',
      data: newTaxZone
    });
  } catch (error) {
    logger.error('Tax zone creation error', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create tax zone: ' + (error as Error)?.message
    }, { status: 500 });
  }
}
