'use client';

import { CheckCircle, Mail, Package, Truck, CreditCard } from 'lucide-react';
import Header from './order-confirmation/Header';
import OrderSuccessBanner from './order-confirmation/OrderSuccessBanner';
import OrderSummary from './order-confirmation/OrderSummary';
import DeliveryDetails from './order-confirmation/DeliveryDetails';
import PaymentDetails from './order-confirmation/PaymentDetails';
import OrderStatusTimeline from './order-confirmation/OrderStatusTimeline';
import OrderActions from './order-confirmation/OrderActions';
import SupportSection from './order-confirmation/SupportSection';
import Footer from './order-confirmation/Footer';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderData {
  orderNumber: string;
  customerEmail: string;
  items: OrderItem[];
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

interface OrderConfirmationPageProps {
  orderData?: OrderData | null;
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderData }) => {
  // Default mock data if no orderData provided
  const defaultOrderData: OrderData = {
    orderNumber: 'ORD-2026-000123',
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

  const currentOrderData = orderData || defaultOrderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Success Banner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Thank you for your purchase!
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Your order has been successfully processed and is now being prepared.
          </p>
          
          {/* Order Number */}
          <div className="mb-6">
            <p className="text-lg text-gray-600">
              Order Number:{' '}
              <span className="font-semibold text-gray-900">{currentOrderData.orderNumber}</span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">{currentOrderData.items.length} Items</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">Free Shipping</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 font-medium">Secure Payment</p>
            </div>
          </div>

          {/* Email Notice */}
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Mail size={20} />
              <p className="text-sm">
                A confirmation email has been sent to{' '}
                <span className="font-medium">{currentOrderData.customerEmail}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <OrderSummary items={currentOrderData.items} totals={currentOrderData.totals} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DeliveryDetails shipping={currentOrderData.shipping} />
              <PaymentDetails payment={currentOrderData.payment} totals={currentOrderData.totals} />
            </div>
            <OrderStatusTimeline />
            <OrderActions orderNumber={currentOrderData.orderNumber} />
          </div>
          <div className="space-y-8">
            <SupportSection />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
