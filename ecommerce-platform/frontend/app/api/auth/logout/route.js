import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Mock logout - in a real app, you might invalidate the token on the server
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed'
      }
    }, { status: 500 });
  }
}
