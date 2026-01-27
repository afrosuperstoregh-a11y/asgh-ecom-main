import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    
    // Clear authentication cookies
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
    cookieStore.delete('csrf-token');

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
