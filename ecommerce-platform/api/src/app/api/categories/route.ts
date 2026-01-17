import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../../../data/categories';

export async function GET(request: NextRequest) {
  try {
    // Enable CORS
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    }, { headers });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error fetching categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
