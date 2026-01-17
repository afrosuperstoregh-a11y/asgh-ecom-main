'use client';

import React, { useState } from 'react';

interface TrackingUpdate {
  date: string;
  location: string;
  status: string;
  description: string;
}

interface TrackingItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface TrackingData {
  orderNumber: string;
  orderDate: string;
  status: string;
  estimatedDelivery: string;
  trackingNumber: string;
  carrier: string;
  currentLocation: string;
  updates: TrackingUpdate[];
  items: TrackingItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

const TrackPage = () => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    email: ''
  });
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      if (formData.orderNumber === '12345' && formData.email === 'john@example.com') {
        setTrackingData({
          orderNumber: '12345',
          orderDate: '2024-01-10',
          status: 'shipped',
          estimatedDelivery: '2024-01-17',
          trackingNumber: '1Z999AA1234567890',
          carrier: 'UPS',
          currentLocation: 'Chicago, IL',
          updates: [
            {
              date: '2024-01-12 14:30',
              location: 'Chicago, IL',
              status: 'In Transit',
              description: 'Package arrived at sorting facility'
            },
            {
              date: '2024-01-11 09:15',
              location: 'Indianapolis, IN',
              status: 'In Transit',
              description: 'Package departed sorting facility'
            },
            {
              date: '2024-01-10 16:45',
              location: 'Indianapolis, IN',
              status: 'Package Picked Up',
              description: 'Package picked up by carrier'
            },
            {
              date: '2024-01-10 14:20',
              location: 'New York, NY',
              status: 'Order Processed',
              description: 'Order processed and ready for shipment'
            }
          ],
          items: [
            {
              name: 'Wireless Bluetooth Headphones',
              quantity: 1,
              price: 79.99,
              image: '/placeholder-product.svg',
            },
            {
              name: 'Phone Case - Clear',
              quantity: 2,
              price: 15.99,
              image: '/placeholder-product.svg',
            }
          ],
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States'
          }
        });
      } else {
        setError('Order not found. Please check your order number and email address.');
      }
      setIsLoading(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
      case 'in transit':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const sampleOrders = [
    { orderNumber: '12345', email: 'john@example.com' },
    { orderNumber: '12346', email: 'jane@example.com' },
    { orderNumber: '12347', email: 'mike@example.com' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-gray-600 mt-2">Enter your order number and email to track your package</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
            <p className="text-gray-600">
              Please provide your order details to track your shipment
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number
                </label>
                <input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  placeholder="#12345"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>

          {/* Sample Orders */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 font-medium mb-2">Sample Orders for Testing:</p>
            <div className="text-sm text-blue-700 space-y-1">
              {sampleOrders.map((order, index) => (
                <div key={index}>
                  Order: {order.orderNumber}, Email: {order.email}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{trackingData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{trackingData.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trackingData.status)}`}>
                    {getStatusText(trackingData.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="font-medium">{trackingData.estimatedDelivery}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tracking Information</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{trackingData.trackingNumber}</p>
                    <p className="text-sm text-gray-600">{trackingData.carrier}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Location</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{trackingData.currentLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tracking Timeline</h2>
              <div className="space-y-4">
                {trackingData.updates.map((update, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                      }`}></div>
                      {index < trackingData.updates.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-300 ml-1"></div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{update.status}</p>
                        <p className="text-sm text-gray-500">{update.date}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{update.location}</p>
                      <p className="text-sm text-gray-500">{update.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-3">
                {trackingData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">
                    ${trackingData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium">{trackingData.shippingAddress.name}</p>
                <p className="text-gray-600">
                  {trackingData.shippingAddress.street}<br />
                  {trackingData.shippingAddress.city}, {trackingData.shippingAddress.state} {trackingData.shippingAddress.zip}<br />
                  {trackingData.shippingAddress.country}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow-lg rounded-lg p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
                  Contact Support
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
                  Modify Address
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
