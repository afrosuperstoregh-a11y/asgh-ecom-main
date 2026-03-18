import React from 'react';
import { Star, ShoppingCart, Heart, Clock, TrendingDown, ExternalLink } from 'lucide-react';

interface DealProductCardProps {
  product: {
    id: number;
    name: string;
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    image: string;
    category: string;
    brand: string;
    rating: number;
    reviews: number;
    stock: number;
    dealEnds: string;
    badge: string;
  };
  viewMode?: 'grid' | 'list';
}

const DealProductCard: React.FC<DealProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const savings = product.originalPrice - product.discountedPrice;
  const isLowStock = product.stock <= 10;
  const daysUntilEnd = Math.ceil((new Date(product.dealEnds).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isEndingSoon = daysUntilEnd <= 3;

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    // This should navigate to checkout with the product pre-added
    console.log(`Buy Now: ${product.name}`);
  };

  const handleAddToCart = () => {
    console.log(`Add to Cart: ${product.name}`);
  };

  const handleAddToWishlist = () => {
    console.log(`Add to Wishlist: ${product.name}`);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-4">
        <div className="flex gap-4">
          <div className="relative w-32 h-32 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{product.discount}%
            </div>
            {isEndingSoon && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysUntilEnd}d
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-red-600 cursor-pointer">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600">{product.brand} • {product.category}</p>
              </div>
              <button
                onClick={handleAddToWishlist}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium ml-1">{product.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({product.reviews})</span>
              </div>
              {isLowStock && (
                <span className="text-red-600 text-sm font-medium">Only {product.stock} left!</span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">${product.discountedPrice}</span>
                <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
              </div>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Save ${savings.toFixed(2)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Ends {product.dealEnds}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group w-[275px] h-[350px] flex flex-col">
      <div className="relative overflow-hidden rounded-t-xl flex-shrink-0" style={{ height: '200px' }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-xl"
          sizes="275px"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount}%
          </div>
          {product.badge && (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {product.badge}
            </div>
          )}
        </div>

        {isEndingSoon && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysUntilEnd}d left
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              title="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddToWishlist}
              className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              title="Add to Wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              title="Quick View"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 hover:text-red-600 cursor-pointer line-clamp-2 mb-2 overflow-hidden">
            {product.name}
          </h3>
          <p className="text-xs text-gray-600 truncate mb-3">{product.brand} • {product.category}</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium ml-1">{product.rating}</span>
            <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
          </div>
          {isLowStock && (
            <span className="text-red-600 text-xs font-medium bg-red-50 px-1 py-0.5 rounded">
              Only {product.stock} left!
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-sm font-bold text-red-600">${product.discountedPrice}</span>
          <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>
          <div className="bg-green-100 text-green-800 px-1 py-0.5 rounded-full text-xs font-medium">
            Save ${savings.toFixed(2)}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
            <Clock className="w-3 h-3" />
            <span>Ends {product.dealEnds}</span>
          </div>
          {product.discount >= 50 && (
            <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
              <TrendingDown className="w-3 h-3" />
              <span>Hot Deal</span>
            </div>
          )}
        </div>

        <button
          onClick={handleBuyNow}
          className="mt-auto w-full bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-1 text-xs"
        >
          <ShoppingCart className="w-3 h-3" />
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default DealProductCard;
