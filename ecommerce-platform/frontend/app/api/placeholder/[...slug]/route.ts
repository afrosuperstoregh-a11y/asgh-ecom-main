import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface RouteParams {
  slug: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // Get the dimensions from the slug
    const [width, height] = params.slug[0].split('x');
    
    // Validate and parse dimensions
    const widthNum = Math.min(Number(width) || 100, 4096);
    const heightNum = Math.min(Number(height) || 100, 4096);
    
    if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
      return new NextResponse('Invalid dimensions', { status: 400 });
    }
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${widthNum}" height="${heightNum}" viewBox="0 0 ${widthNum} ${heightNum}" 
          xmlns="http://www.w3.org/2000/svg" version="1.1">
        <rect width="${widthNum}" height="${heightNum}" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#888" font-family="sans-serif" font-size="12">
          ${widthNum}x${heightNum}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding'
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Add HEAD handler for better SEO and performance
export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
