import { Headphones, RotateCcw, HelpCircle, Mail, Phone } from 'lucide-react';

const SupportSection = () => {
  const supportOptions = [
    {
      id: 1,
      title: 'Customer Support',
      description: 'Get help with your order',
      icon: Headphones,
      contact: 'support@shophub.com',
      action: 'Email Us'
    },
    {
      id: 2,
      title: 'Returns & Refunds',
      description: '30-day return policy',
      icon: RotateCcw,
      contact: 'Easy returns',
      action: 'Learn More'
    },
    {
      id: 3,
      title: 'FAQ',
      description: 'Find quick answers',
      icon: HelpCircle,
      contact: 'Common questions',
      action: 'View FAQ'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Need Help?</h3>
      
      <div className="space-y-4">
        {supportOptions.map((option) => {
          const Icon = option.icon;
          
          return (
            <div key={option.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="bg-gray-100 rounded-lg p-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">{option.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-600">{option.contact}</span>
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    {option.action} →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
          <div className="space-y-2">
            <a href="mailto:support@shophub.com" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600">
              <Mail className="h-4 w-4" />
              <span>support@shophub.com</span>
            </a>
            <a href="tel:1-800-SHOP-HUB" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600">
              <Phone className="h-4 w-4" />
              <span>1-800-SHOP-HUB</span>
            </a>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Available: Mon-Fri 9AM-8PM EST, Sat-Sun 10AM-6PM EST
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 rounded-full p-1">
            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-green-800 font-medium">
            100% Satisfaction Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
