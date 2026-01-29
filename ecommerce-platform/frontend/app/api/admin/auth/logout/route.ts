import { NextResponse } from 'next/server';

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

    console.log('✅ Production admin logout successful');
    return response;
  } catch (error) {
    console.error('❌ Production logout proxy error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
