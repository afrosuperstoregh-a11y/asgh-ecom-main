'use client';

import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Package, Truck, Clock, Shield } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-gray-600">Everything you need to know about our shipping services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Truck className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Standard Shipping</h2>
            </div>
            <p className="text-gray-600 mb-4">5-7 business days</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">$9.99</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Available nationwide</li>
              <li>• Tracking included</li>
              <li>• Insurance up to $100</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-primary-200">
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Express Shipping</h2>
            </div>
            <p className="text-gray-600 mb-4">2-3 business days</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">$19.99</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Priority processing</li>
              <li>• Real-time tracking</li>
              <li>• Insurance up to $500</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Overnight Shipping</h2>
            </div>
            <p className="text-gray-600 mb-4">Next business day</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">$29.99</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Fastest delivery</li>
              <li>• Premium tracking</li>
              <li>• Full insurance coverage</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Policy</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Processing</h3>
              <p className="text-gray-600">
                All orders are processed within 1-2 business days. You'll receive a confirmation email 
                with tracking information once your order ships.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">International Shipping</h3>
              <p className="text-gray-600">
                We currently ship within the United States. International shipping options will be 
                available soon. Sign up for our newsletter to stay updated.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Free Shipping</h3>
              <p className="text-gray-600">
                Free standard shipping on orders over $50. Automatically applied at checkout.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Issues</h3>
              <p className="text-gray-600">
                If your package is lost or damaged during transit, please contact our customer 
                support team immediately. We'll work with the carrier to resolve the issue.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 rounded-lg p-8 text-center">
          <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">100% Delivery Guarantee</h2>
          <p className="text-gray-600 mb-6">
            We stand behind our shipping service. If your order doesn't arrive as expected, 
            we'll make it right or refund your shipping costs.
          </p>
          <Link
            href="/contact"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
