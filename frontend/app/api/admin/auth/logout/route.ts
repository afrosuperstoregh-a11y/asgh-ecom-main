import { NextResponse } from 'next/server';

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

// Production admin logout proxy
export async function POST() {
  try {
    // Clear authentication cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 0,
      path: '/'
    });

    logger.log('Production admin logout successful');
    return response;
  } catch (error) {
    logger.error('Production logout proxy error', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
