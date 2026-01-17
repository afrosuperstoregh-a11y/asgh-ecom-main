import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { width: string; height: string } }
) {
  const { width, height } = context.params;
  const widthNum = parseInt(width) || 100;
  const heightNum = parseInt(height) || 100;
  
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
      'Cache-Control': 'public, max-age=31536000, immutable'
    },
  });
}
