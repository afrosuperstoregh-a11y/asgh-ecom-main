'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderConfirmationPage from '@/components/OrderConfirmationPage';

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment: {
    cardNumber: string;
    cardName: string;
  };
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get order data from URL params or localStorage
    const orderId = searchParams?.get('orderId');
    const savedOrderData = localStorage.getItem('lastOrder');
    
    if (savedOrderData) {
      try {
        const parsedData = JSON.parse(savedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    } else if (orderId) {
      // In a real app, you'd fetch order data from API
      // For now, create mock data with the order ID
      const mockOrderData: OrderData = {
        orderNumber: `ORD-2026-${orderId.padStart(6, '0')}`,
        customerEmail: 'customer@example.com',
        items: [
          {
            id: 1,
            name: 'Premium Afro Print Dress',
            quantity: 1,
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1572804013652-2f5e0c2de9fc?w=100&h=100&fit=crop&crop=center'
          },
          {
            id: 2,
            name: 'Kente Cloth Scarf',
            quantity: 2,
            price: 34.99,
            image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&h=100&fit=crop&crop=center'
          }
        ],
        shipping: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Fashion Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        payment: {
          cardNumber: '**** **** **** 1234',
          cardName: 'Jane Smith'
        },
        totals: {
          subtotal: 159.97,
          tax: 12.80,
          shipping: 9.99,
          total: 182.76
        }
      };
      setOrderData(mockOrderData);
    }
    
    setLoading(false);
    
    // Clear the order data from localStorage after displaying
    if (savedOrderData) {
      localStorage.removeItem('lastOrder');
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your order confirmation...</p>
        </div>
      </div>
    );
  }

  return <OrderConfirmationPage orderData={orderData} />;
}
