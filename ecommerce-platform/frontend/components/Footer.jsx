export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Afro Superstore</h3>
            <p className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
              Your trusted destination for premium products with exceptional quality and service.
            </p>
            
            {/* Payment Methods */}
            <div className="space-y-3">
              <div className="text-sm text-gray-400">Accepted Payment Methods:</div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">VISA</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">MC</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">AMEX</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">PP</span>
                <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">STR</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">About Us</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Contact</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">FAQs</a></li>
              <li><a href="/categories" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Categories</a></li>
              <li><a href="/deals" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Deals</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li><a href="/account" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">My Account</a></li>
              <li><a href="/cart" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Shopping Cart</a></li>
              <li><a href="/checkout" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Checkout</a></li>
              <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Privacy Policy</a></li>
              <li><a href="/track" className="text-gray-300 hover:text-white transition-colors text-sm sm:text-base">Order Tracking</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm sm:text-base text-center sm:text-left">
              &copy; 2025 Afro Superstore. All rights reserved.
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Privacy</a>
              <a href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Shipping</a>
              <a href="/returns" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">Returns</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
