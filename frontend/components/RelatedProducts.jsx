import { ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';

const getSafeImageUrl = (url, fallback = '/placeholder-product.svg') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed === 'undefined' || trimmed === 'null') return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return fallback;
    }
  }
  if (trimmed.startsWith('/')) return trimmed;
  return trimmed;
};

export default function RelatedProducts({ products }) {
  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    // Add to cart logic here
    console.log('Added to cart:', productId);
  };

  const handleWishlist = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    // Wishlist logic here
    console.log('Added to wishlist:', productId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Related Products</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={getSafeImageUrl(product.image)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target;
                  if (!target.src.includes('/placeholder-product.svg')) {
                    target.src = '/placeholder-product.svg';
                  }
                }}
              />
            </div>
            
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{product.brand}</div>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.name}
              </h4>
              
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">({product.reviews})</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={(e) => handleAddToCart(e, product.id)}
                  className="flex-1 bg-primary-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <ShoppingCart className="h-3 w-3" />
                  <span>Add</span>
                </button>
                <button
                  onClick={(e) => handleWishlist(e, product.id)}
                  className="p-2 border border-gray-300 rounded text-gray-600 hover:text-red-500 hover:border-red-300 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
