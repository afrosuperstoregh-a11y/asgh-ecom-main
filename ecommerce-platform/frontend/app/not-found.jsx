import Link from 'next/link';
import { Home, ShoppingBag, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          {/* Error Hero Section */}
          <div className="mb-12">
            {/* Status Code */}
            <div className="text-8xl md:text-9xl font-bold text-primary-600 mb-4">
              404
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The page you're looking for doesn't exist or may have been moved. 
              Don't worry, let's get you back to shopping!
            </p>
            
            {/* Illustration Placeholder */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 rounded-full flex items-center justify-center">
                <Search className="w-16 h-16 md:w-24 md:h-24 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center justify-center space-x-2 min-w-[200px]"
            >
              <Home className="h-5 w-5" />
              <span>Back to Homepage</span>
            </Link>
            <Link 
              href="/product/1"
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors inline-flex items-center justify-center space-x-2 min-w-[200px]"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What were you looking for?
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Shop
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="#"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Categories
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="#"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Deals
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="#"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>

          {/* Trust Building Message */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Can't find what you need? Our customer service team is here to help 24/7.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
