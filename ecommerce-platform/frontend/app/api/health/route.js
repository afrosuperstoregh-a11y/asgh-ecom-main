import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Afro Superstore API',
    version: '1.0.0',
    message: 'API endpoints are working'
  });
}
