'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { Product } from '../../data/products';
import { useCart } from "../../context/CartContext";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist));
    }
  }, []);

  const removeFromWishlist = (productId: string) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  const addToCart = (product: Product) => {
    const { addToCart: addToCartAction } = useCart();
    addToCartAction({
      id: product.id,
      name: product.name,
      price: product.compare_price || product.price,
      image: product.images?.[0] || '/placeholder-product.jpg',
      category: product.category_name
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Wishlist</h1>
          <p className="text-gray-600">Items you've saved for later</p>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  <Link href={`/product/${item.id}`}>
                    <img
                      src={item.images[0] || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 group"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-current group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor((item as any).rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">({(item as any).reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">${item.price}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding items you love to your wishlist</p>
            <Link
              href="/products"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
            >
              Browse Products
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
