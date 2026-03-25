import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify environment variables
export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      NEXT_PUBLIC_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ? '***SET***' : 'NOT_SET',
      NEXT_PUBLIC_ADMIN_STAFF_EMAIL: process.env.NEXT_PUBLIC_ADMIN_STAFF_EMAIL,
      NEXT_PUBLIC_ADMIN_STAFF_PASSWORD: process.env.NEXT_PUBLIC_ADMIN_STAFF_PASSWORD ? '***SET***' : 'NOT_SET',
    };

    return NextResponse.json({
      success: true,
      message: 'Environment variables check (UPDATED)',
      data: envVars
    });

  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
