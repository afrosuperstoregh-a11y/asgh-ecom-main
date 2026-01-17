import React from 'react';
import { CheckCircle, Package, Truck, Mail, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const Confirmation = ({ orderNumber, estimatedDelivery }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Order Number</h3>
              <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h3>
              <p className="text-lg font-semibold text-gray-900">{estimatedDelivery}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Order Confirmation Email</p>
                <p className="mt-1">
                  We've sent a confirmation email with your order details and tracking information. 
                  You'll receive another email when your order ships.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Truck className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status</span>
              <span className="font-medium text-green-600">Processing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Time</span>
              <span className="font-medium">1-2 business days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping Method</span>
              <span className="font-medium">Standard Shipping</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tracking</span>
              <span className="font-medium text-gray-500">Available once shipped</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order Processing</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We're preparing your order for shipment. This usually takes 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Shipment</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Once shipped, you'll receive a tracking number to monitor your delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delivery</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your order will be delivered within the estimated timeframe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/"
            className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
          
          <button
            onClick={() => window.print()}
            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Customer Service */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Questions about your order?
          </p>
          <Link 
            href="/contact" 
            className="text-sm text-black font-medium hover:text-gray-700 transition-colors"
          >
            Contact Customer Service
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
