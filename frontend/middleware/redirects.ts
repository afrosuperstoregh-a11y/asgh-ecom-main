import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle old product ID routes: /product/[id] -> /product/[slug]
  const productMatch = pathname.match(/^\/product\/(\d+)(?:\/.*)?$/)
  if (productMatch) {
    const productId = productMatch[1]
    
    try {
      // Fetch product by ID to get its slug
      const supabase = await getSupabaseServer()
      const { data: product, error } = await supabase
        .from('products')
        .select('slug')
        .eq('id', productId)
        .single()

      if (error || !product?.slug) {
        // If no slug found, redirect to products page
        return NextResponse.redirect(new URL('/products', request.url), 301)
      }

      // Redirect to slug-based URL with 301 permanent redirect
      const newUrl = new URL(`/product/${product.slug}`, request.url)
      return NextResponse.redirect(newUrl, 301)
    } catch (error) {
      // If there's any error, redirect to products page
      return NextResponse.redirect(new URL('/products', request.url), 301)
    }
  }

  // Handle old admin product ID routes: /admin/products/[id] -> /admin/products/[slug]
  const adminProductMatch = pathname.match(/^\/admin\/products\/(\d+)(?:\/.*)?$/)
  if (adminProductMatch) {
    const productId = adminProductMatch[1]
    
    try {
      // Fetch product by ID to get its slug
      const supabase = await getSupabaseServer()
      const { data: product, error } = await supabase
        .from('products')
        .select('slug')
        .eq('id', productId)
        .single()

      if (error || !product?.slug) {
        // If no slug found, redirect to admin products page
        return NextResponse.redirect(new URL('/admin/products', request.url), 301)
      }

      // Redirect to slug-based URL with 301 permanent redirect
      const newUrl = new URL(`/admin/products/${product.slug}`, request.url)
      return NextResponse.redirect(newUrl, 301)
    } catch (error) {
      // If there's any error, redirect to admin products page
      return NextResponse.redirect(new URL('/admin/products', request.url), 301)
    }
  }

  // Handle old category ID routes: /category/[id] -> /category/[slug]
  const categoryMatch = pathname.match(/^\/category\/(\d+)(?:\/.*)?$/)
  if (categoryMatch) {
    const categoryId = categoryMatch[1]
    
    try {
      // Fetch category by ID to get its slug
      const supabase = await getSupabaseServer()
      const { data: category, error } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', categoryId)
        .single()

      if (error || !category?.slug) {
        // If no slug found, redirect to categories page
        return NextResponse.redirect(new URL('/categories', request.url), 301)
      }

      // Redirect to slug-based URL with 301 permanent redirect
      const newUrl = new URL(`/category/${category.slug}`, request.url)
      return NextResponse.redirect(newUrl, 301)
    } catch (error) {
      // If there's any error, redirect to categories page
      return NextResponse.redirect(new URL('/categories', request.url), 301)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/product/:id*',
    '/admin/products/:id*',
    '/category/:id*'
  ]
}
