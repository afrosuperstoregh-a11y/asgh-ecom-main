'use client';

import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '../context/CartContext';
import ErrorBoundary from './ErrorBoundary';

interface ProductGridProps {
  products?: Product[];
  loading?: boolean;
}

function ProductGridComponent({ products: propProducts, loading: propLoading }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Use props if provided, otherwise fetch data
  useEffect(() => {
    if (propProducts !== undefined) {
      setProducts(propProducts);
      setLoading(propLoading || false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
        const data = await response.json();
        if (data.success) {
          setProducts(data.data?.products || data.data || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [propProducts, propLoading]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/placeholder-product.jpg'
    });
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Best Sellers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Best Sellers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className="relative aspect-square">
                <Image
                  src={product.images?.[0] || product.image || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded-full">
                  Best Seller
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center mb-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">({product.reviews || 0})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    aria-label="Add product to cart"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(ProductGridComponent);
export { ProductGridComponent };
