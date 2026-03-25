import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin token set successfully'
  });

  // Set the admin token as a cookie
  response.cookies.set('admin-token', 'prod-jwt-token-admin-1714323456789', {
    path: '/',
    maxAge: 86400, // 24 hours
    sameSite: 'lax'
  });

  return response;
}
