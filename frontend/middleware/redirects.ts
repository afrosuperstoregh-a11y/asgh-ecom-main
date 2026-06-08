import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Middleware temporarily disabled to prevent build-time Supabase calls
  // TODO: Rewrite middleware to use a static mapping or redirect table instead of live Supabase queries
  // The original middleware was querying Supabase during middleware execution which causes build failures
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/product/:id*',
    '/admin/products/:id*',
    '/category/:id*'
  ]
}
