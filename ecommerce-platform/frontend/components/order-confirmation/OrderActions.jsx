import { Package, Eye, Download, ShoppingBag } from 'lucide-react';

const OrderActions = () => {
  const actions = [
    {
      id: 1,
      title: 'Track Order',
      description: 'Follow your order in real-time',
      icon: Package,
      primary: true,
      href: '#'
    },
    {
      id: 2,
      title: 'View My Orders',
      description: 'See all your past and current orders',
      icon: Eye,
      primary: false,
      href: '#'
    },
    {
      id: 3,
      title: 'Download Invoice',
      description: 'Get a PDF copy of your invoice',
      icon: Download,
      primary: false,
      href: '#'
    },
    {
      id: 4,
      title: 'Continue Shopping',
      description: 'Browse more products',
      icon: ShoppingBag,
      primary: false,
      href: '#'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">What would you like to do next?</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <a
              key={action.id}
              href={action.href}
              className={`relative block p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                action.primary
                  ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 rounded-lg p-2 ${
                  action.primary
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${
                    action.primary ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {action.title}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    action.primary ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Need help?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
            Contact Customer Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrderActions;
