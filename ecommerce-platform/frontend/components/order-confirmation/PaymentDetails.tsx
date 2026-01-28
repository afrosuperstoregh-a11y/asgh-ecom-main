'use client';

import { CreditCard, Shield } from 'lucide-react';

interface PaymentInfo {
  cardNumber: string;
  cardName: string;
}

interface Totals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface PaymentDetailsProps {
  payment: PaymentInfo;
  totals: Totals;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ payment, totals }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{payment.cardName}</p>
            <p className="text-gray-600">{payment.cardNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-600">Payment Securely Processed</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800 font-medium mb-2">Payment Summary</p>
        <div className="space-y-1 text-sm text-green-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-semibold pt-1 border-t border-green-200">
            <span>Total Paid:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
