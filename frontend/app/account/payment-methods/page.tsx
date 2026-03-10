'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { CreditCard, Plus, Trash2, Edit2, Shield } from 'lucide-react';

interface PaymentMethod {
  id: number;
  type: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock payment methods data
    const mockMethods = [
      {
        id: 1,
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: 2,
        type: 'credit_card',
        last4: '5555',
        brand: 'Mastercard',
        expiryMonth: 8,
        expiryYear: 2024,
        isDefault: false
      }
    ];
    
    setTimeout(() => {
      setPaymentMethods(mockMethods);
      setLoading(false);
    }, 1000);
  }, []);

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  const setDefaultMethod = (id: number) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, isDefault: true } : { ...method, isDefault: false }
      )
    );
  };

  const deleteMethod = (id: number) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Methods</h1>
            <p className="text-gray-600">Manage your payment options</p>
          </div>
          <button className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Payment Method
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Secure Payment Processing</h3>
              <p className="text-blue-700 text-sm">
                Your payment information is encrypted and securely stored. We never share your financial details.
              </p>
            </div>
          </div>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getCardIcon(method.brand)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ending in {method.last4}
                        </h3>
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => setDefaultMethod(method.id)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Set as Default
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:text-primary-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteMethod(method.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No payment methods</h2>
            <p className="text-gray-600 mb-6">Add a payment method to make checkout faster</p>
            <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
              Add Payment Method
            </button>
          </div>
        )}

        <div className="mt-12 bg-gray-100 rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Accepted Payment Methods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">💳</div>
              <p className="text-sm font-medium text-gray-900">Credit Cards</p>
              <p className="text-xs text-gray-600">Visa, Mastercard, Amex</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm font-medium text-gray-900">Digital Wallets</p>
              <p className="text-xs text-gray-600">PayPal, Apple Pay</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🏦</div>
              <p className="text-sm font-medium text-gray-900">Bank Transfer</p>
              <p className="text-xs text-gray-600">ACH transfers</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium text-gray-900">Buy Now Pay Later</p>
              <p className="text-xs text-gray-600">Affirm, Klarna</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
