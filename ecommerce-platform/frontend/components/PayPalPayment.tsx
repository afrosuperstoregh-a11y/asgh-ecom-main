'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  disabled?: boolean;
}

// PayPal button wrapper component
const PayPalButtonWrapper = ({ 
  amount, 
  currency = 'USD', 
  onSuccess, 
  onError, 
  onCancel,
  disabled 
}: PayPalPaymentProps) => {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="p-8 border border-red-200 rounded-lg bg-red-50 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">Unable to connect to PayPal. Please try again.</p>
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        height: 48
      }}
      disabled={disabled}
      fundingSource={undefined}
      createOrder={(data, actions) => {
        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                value: amount.toFixed(2),
                currency_code: currency
              }
            }
          ]
        });
      }}
      onApprove={async (data, actions) => {
        if (actions.order) {
          const details = await actions.order.capture();
          onSuccess(details);
        }
      }}
      onError={(err) => {
        onError(err);
      }}
      onCancel={() => {
        onCancel();
      }}
    />
  );
};

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  amount,
  currency = 'USD',
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleSuccess = (details: any) => {
    console.log('PayPal payment successful:', details);
    setPaymentStatus('success');
    setIsProcessing(false);
    onSuccess(details);
  };

  const handleError = (error: any) => {
    console.error('PayPal payment error:', error);
    setPaymentStatus('error');
    setIsProcessing(false);
    onError(error);
  };

  const handleCancel = () => {
    console.log('PayPal payment cancelled');
    setPaymentStatus('idle');
    setIsProcessing(false);
    onCancel();
  };

  // PayPal configuration - use sandbox for development
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
    currency: currency,
    intent: 'capture',
    disableFunding: 'credit,card' // Disable credit card buttons to show only PayPal
  };

  return (
    <div className="space-y-4">
      {/* PayPal Header */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.419c.103-.564.615-.979 1.207-.979h3.865c2.434 0 4.056 1.013 4.056 3.342 0 2.849-2.434 3.945-4.628 3.945H7.076v12.61zM7.9 5.75h1.68c1.345 0 2.434-.496 2.434-1.841 0-1.345-1.089-1.68-2.434-1.68H7.9v3.521z"/>
            <path d="M14.84 21.337h-4.606l2.107-11.425h4.606c2.434 0 4.628 1.096 4.628 3.756 0 3.585-2.677 7.669-6.735 7.669zm.824-8.795h-1.68l-.824 4.452h1.68c1.345 0 2.434-.824 2.434-2.434 0-1.345-1.089-2.018-2.434-2.018z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">PayPal</h3>
          <p className="text-sm text-gray-600">Pay safely with your PayPal account</p>
        </div>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === 'processing' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-700">Processing PayPal payment...</p>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-700">Payment completed successfully!</p>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">Payment failed. Please try again.</p>
        </div>
      )}

      {/* PayPal Buttons */}
      <div className={`border rounded-lg p-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtonWrapper
            amount={amount}
            currency={currency}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={handleCancel}
            disabled={disabled || isProcessing}
          />
        </PayPalScriptProvider>
      </div>

      {/* PayPal Benefits */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Buyer Protection</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Fast Checkout</span>
        </div>
      </div>

      {/* PayPal Legal Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>By continuing, you agree to PayPal's</p>
        <p>
          <a href="https://www.paypal.com/us/webapps/mpp/ua/useragreement-full" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="https://www.paypal.com/us/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default PayPalPayment;
