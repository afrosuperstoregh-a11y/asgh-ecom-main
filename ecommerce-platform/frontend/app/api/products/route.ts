import { NextRequest, NextResponse } from 'next/server';
import { products } from '../../../data/products';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
  const color = searchParams.get('color');
  const size = searchParams.get('size');
  const rating = parseFloat(searchParams.get('rating') || '0');
  const inStock = searchParams.get('inStock');
  const discount = searchParams.get('discount');
  const sort = searchParams.get('sort') || 'featured';
  const search = searchParams.get('search')?.toLowerCase();

  // Filter products
  let filteredProducts = products.filter(product => {
    // Category filter
    if (category && category !== 'all-products' && product.category !== category) {
      return false;
    }

    // Brand filter
    if (brand && product.brand !== brand) {
      return false;
    }

    // Price range filter
    const effectivePrice = product.discountPrice || product.price;
    if (effectivePrice < minPrice || effectivePrice > maxPrice) {
      return false;
    }

    // Color filter
    if (color && !product.colors.includes(color)) {
      return false;
    }

    // Size filter
    if (size && !product.sizes.includes(size)) {
      return false;
    }

    // Rating filter
    if (rating > 0 && product.rating < rating) {
      return false;
    }

    // Stock filter
    if (inStock === 'true' && !product.inStock) {
      return false;
    }

    // Discount filter
    if (discount === 'true' && !product.discountPrice) {
      return false;
    }

    // Search filter
    if (search) {
      const searchableText = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
      if (!searchableText.includes(search)) {
        return false;
      }
    }

    return true;
  });

  // Sort products
  switch (sort) {
    case 'price-low':
      filteredProducts.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      break;
    case 'rating':
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'new':
      filteredProducts.sort((a, b) => {
        const aNew = a.tags.includes('new');
        const bNew = b.tags.includes('new');
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        return 0;
      });
      break;
    case 'name-asc':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default: // featured
      filteredProducts.sort((a, b) => {
        const aSale = a.tags.includes('sale');
        const bSale = b.tags.includes('sale');
        if (aSale && !bSale) return -1;
        if (!aSale && bSale) return 1;
        return b.reviewCount - a.reviewCount;
      });
  }

  // Pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Response
  return NextResponse.json({
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      totalProducts,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    filters: {
      category,
      brand,
      minPrice,
      maxPrice,
      color,
      size,
      rating,
      inStock,
      discount,
      search
    }
  });
}
