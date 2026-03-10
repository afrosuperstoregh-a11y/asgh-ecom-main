'use client';

import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle, Headphones, HelpCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Server Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          {/* Error Hero Section */}
          <div className="mb-12">
            {/* Status Code */}
            <div className="text-8xl md:text-9xl font-bold text-red-600 mb-4">
              500
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Something Went Wrong
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              We're experiencing a temporary issue. Please try again in a few moments. 
              Our team has been notified and is working to fix this.
            </p>
            
            {/* Illustration Placeholder */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-16 h-16 md:w-24 md:h-24 text-red-600" />
              </div>
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={reset}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center justify-center space-x-2 min-w-[200px]"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
            <Link 
              href="/"
              className="border-2 border-gray-600 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 hover:text-white transition-colors inline-flex items-center justify-center space-x-2 min-w-[200px]"
            >
              <Home className="h-5 w-5" />
              <span>Return to Homepage</span>
            </Link>
          </div>

          {/* Support Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Still having trouble?
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team is available 24/7 to help you with any issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="#"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Headphones className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
              <Link 
                href="#"
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help Center</span>
              </Link>
            </div>
          </div>

          {/* Trust Building Message */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              We apologize for the inconvenience. Your shopping experience is our top priority.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-400">
              <span>• Secure Shopping</span>
              <span>• 24/7 Support</span>
              <span>• Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
