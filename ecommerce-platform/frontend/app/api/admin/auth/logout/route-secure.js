import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    
    // Clear authentication cookies
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
    cookieStore.delete('csrf-token');

    // Call backend logout to log the action
    try {
      await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
          'User-Agent': request.headers.get('user-agent') || 'admin-panel'
        },
      });
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with frontend logout even if backend fails
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Logout failed'
    }, { status: 500 });
  }
}
