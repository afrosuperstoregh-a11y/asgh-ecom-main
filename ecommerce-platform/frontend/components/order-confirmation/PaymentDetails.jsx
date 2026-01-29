import { CreditCard, Receipt, Shield } from 'lucide-react';

const PaymentDetails = () => {
  const paymentData = {
    paymentMethod: 'Credit Card',
    cardType: 'Visa',
    maskedCardNumber: '**** **** **** 4242',
    transactionId: 'TXN-2026-0012345678',
    paymentStatus: 'Completed',
    paymentDate: 'January 10, 2026 at 5:45 PM'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
      </div>

      <div className="space-y-4">
        {/* Payment Method */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {paymentData.cardType} {paymentData.paymentMethod}
                  </p>
                  <p className="text-xs text-gray-500">{paymentData.maskedCardNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h4>
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {paymentData.paymentStatus}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="text-sm font-mono text-gray-900">{paymentData.transactionId}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-green-200">
              <p className="text-xs text-gray-600">
                Payment processed on {paymentData.paymentDate}
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-800">
              Your payment information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
