'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Package, RotateCcw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  const [formData, setFormData] = useState({
    orderNumber: '',
    email: '',
    reason: '',
    items: '',
    refundMethod: 'original'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Return request submitted:', formData);
    // Handle return request submission
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-gray-600">Easy returns and hassle-free refunds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">30-Day Returns</h2>
            </div>
            <p className="text-gray-600">
              Return items within 30 days of delivery for a full refund.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Free Return Shipping</h2>
            </div>
            <p className="text-gray-600">
              We provide prepaid return labels for all eligible returns.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Quick Refunds</h2>
            </div>
            <p className="text-gray-600">
              Refunds processed within 5-7 business days after item receipt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Policy Details</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Eligibility</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Items must be unused and in original condition</li>
                  <li>• Original tags and packaging must be intact</li>
                  <li>• Proof of purchase required</li>
                  <li>• Some items may have specific return requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Non-Returnable Items</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Personal care items (opened)</li>
                  <li>• Final sale items</li>
                  <li>• Custom or personalized products</li>
                  <li>• Perishable goods</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Refund Options</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Original payment method</li>
                  <li>• Store credit (bonus 10% extra)</li>
                  <li>• Exchange for different item</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Important Note</h4>
                    <p className="text-yellow-700 text-sm">
                      Return shipping is free for defective items. For other returns, 
                      a $5.99 restocking fee may apply.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start a Return</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number *
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., ORD-12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Return Reason *
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a reason</option>
                  <option value="defective">Defective or damaged</option>
                  <option value="wrong-item">Wrong item received</option>
                  <option value="size">Size doesn't fit</option>
                  <option value="quality">Quality not as expected</option>
                  <option value="changed-mind">Changed my mind</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label htmlFor="items" className="block text-sm font-medium text-gray-700 mb-1">
                  Items to Return *
                </label>
                <textarea
                  id="items"
                  name="items"
                  value={formData.items}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="List the items you want to return"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="refundMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Refund Method *
                </label>
                <select
                  id="refundMethod"
                  name="refundMethod"
                  value={formData.refundMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="original">Original payment method</option>
                  <option value="store-credit">Store credit (10% bonus)</option>
                  <option value="exchange">Exchange for different item</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Submit Return Request
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 bg-gray-100 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Return Your Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit Request</h3>
              <p className="text-sm text-gray-600">Fill out the return form above</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Label</h3>
              <p className="text-sm text-gray-600">Receive prepaid return label via email</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ship Item</h3>
              <p className="text-sm text-gray-600">Package and ship with provided label</p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Refund</h3>
              <p className="text-sm text-gray-600">Refund processed within 5-7 days</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
