'use client';

import { useState, useEffect } from 'react';
import { fetchAllProducts } from '@/lib/supabase-api';

export default function ProductDebug() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const checkProductCount = async () => {
      try {
        setLoading(true);
        const products = await fetchAllProducts();
        setCount(products.length);
        
        // Count products by status
        const statuses: {[key: string]: number} = {};
        products.forEach(product => {
          const status = product.status || 'unknown';
          statuses[status] = (statuses[status] || 0) + 1;
        });
        setStatusBreakdown(statuses);
        
        console.log('DEBUG: Total products in database:', products.length);
        console.log('DEBUG: Product IDs:', products.map(p => p.id).slice(0, 10));
        console.log('DEBUG: Status breakdown:', statuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('DEBUG: Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    checkProductCount();
  }, []);

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Checking product count...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 text-blue-800">
      <div className="mb-2">
        <strong>Debug Info:</strong> Found {count} products in database
        {count !== null && count !== 173 && (
          <span className="ml-2 text-red-600">
            (Expected: 173, Missing: {173 - count})
          </span>
        )}
      </div>
      <div className="text-sm">
        <strong>Status Breakdown:</strong>
        <ul className="ml-4 mt-1">
          {Object.entries(statusBreakdown).map((
            [status, count]) => (
            <li key={status}>
              {status}: {count} products
              {status === 'active' && ' (shown by backend API)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
