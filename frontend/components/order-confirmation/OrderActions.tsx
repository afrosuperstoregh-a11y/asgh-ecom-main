'use client';

import { ArrowLeft, Home, Package, Phone } from 'lucide-react';
import Link from 'next/link';

interface OrderActionsProps {
  orderNumber: string;
}

const OrderActions: React.FC<OrderActionsProps> = ({ orderNumber }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">What's Next?</h3>
      
      <div className="space-y-4">
        <Link 
          href="/"
          className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Home className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Continue Shopping</p>
              <p className="text-sm text-gray-600">Browse more products</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        
        <Link 
          href="/account/orders"
          className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Track Order</p>
              <p className="text-sm text-gray-600">View order status</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
        </Link>
        
        <a 
          href="mailto:support@afrosuperstore.ca"
          className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Contact Support</p>
              <p className="text-sm text-gray-600">Get help with your order</p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
        </a>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-1">Need Help?</p>
        <p className="text-sm text-blue-600">
          Contact us at <a href="mailto:support@afrosuperstore.ca" className="underline">support@afrosuperstore.ca</a> or call 1-800-AFRO-STORE
        </p>
      </div>
    </div>
  );
};

export default OrderActions;
