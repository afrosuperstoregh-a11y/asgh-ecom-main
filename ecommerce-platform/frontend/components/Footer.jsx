export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Afro Superstore</h3>
            <p className="text-gray-300 mb-4">
              Your trusted destination for premium products with exceptional quality and service.
            </p>
            <div className="flex space-x-4">
              {/* Payment Method Icons */}
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Payment Methods:</span>
                <div className="flex space-x-1">
                  <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">VISA</span>
                  <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">MC</span>
                  <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">AMEX</span>
                  <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">PP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</a></li>
              <li><a href="/categories" className="text-gray-300 hover:text-white transition-colors">Categories</a></li>
              <li><a href="/deals" className="text-gray-300 hover:text-white transition-colors">Deals</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><a href="/account" className="text-gray-300 hover:text-white transition-colors">My Account</a></li>
              <li><a href="/cart" className="text-gray-300 hover:text-white transition-colors">Shopping Cart</a></li>
              <li><a href="/checkout" className="text-gray-300 hover:text-white transition-colors">Checkout</a></li>
              <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/track" className="text-gray-300 hover:text-white transition-colors">Order Tracking</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Afro Suprstore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
