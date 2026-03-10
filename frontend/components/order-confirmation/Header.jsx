import { HelpCircle, User, Package } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Store Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">ShopHub</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            <a 
              href="#" 
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HelpCircle size={18} />
              <span className="hidden sm:inline text-sm font-medium">Help & Support</span>
            </a>
            <a 
              href="#" 
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User size={18} />
              <span className="hidden sm:inline text-sm font-medium">Account</span>
            </a>
            <a 
              href="#" 
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Package size={18} />
              <span className="hidden sm:inline text-sm font-medium">My Orders</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
