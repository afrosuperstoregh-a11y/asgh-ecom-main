import { CheckCircle, Mail } from 'lucide-react';

const OrderSuccessBanner = () => {
  const orderData = {
    orderNumber: 'ORD-2026-000123',
    customerEmail: 'customer@example.com'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 rounded-full p-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Thank you for your purchase!
      </h2>
      
      {/* Order Number */}
      <div className="mb-4">
        <p className="text-lg text-gray-600">
          Order Number:{' '}
          <span className="font-semibold text-gray-900">{orderData.orderNumber}</span>
        </p>
      </div>

      {/* Email Notice */}
      <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-center justify-center space-x-2 text-blue-800">
          <Mail size={20} />
          <p className="text-sm">
            A confirmation email has been sent to{' '}
            <span className="font-medium">{orderData.customerEmail}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessBanner;
