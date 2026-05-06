'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Smartphone } from 'lucide-react';
import PayPalPayment from './PayPalPayment';
import StripePayment from './StripePayment';
import PaystackPayment from './PaystackPayment';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface PaymentMethodSelectorProps {
  amount: number;
  onPaymentMethodChange: (method: string) => void;
  onPaymentSuccess: (details: any) => void;
  onPaymentError: (error: any) => void;
  disabled?: boolean;
  email?: string;
  orderId?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  onPaymentMethodChange,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  email = '',
  orderId = ''
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Pay with Visa, Mastercard, American Express, or Discover'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Wallet className="h-6 w-6" />,
      description: 'Pay safely with your PayPal account'
    },
    {
      id: 'paystack',
      name: 'Paystack (Mobile Money)',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Pay with MTN, Vodafone, AirtelTigo Mobile Money'
    }
  ];

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    onPaymentMethodChange(methodId);
  };

  const handlePayPalSuccess = (details: any) => {
    // Convert PayPal details to match expected format
    const paymentDetails = {
      paymentMethod: 'paypal',
      transactionId: details.id,
      status: details.status,
      amount: details.purchase_units[0].amount.value,
      currency: details.purchase_units[0].amount.currency_code,
      payer: {
        email: details.payer.email_address,
        name: `${details.payer.name.given_name} ${details.payer.name.surname}`
      },
      createTime: details.create_time,
      updateTime: details.update_time
    };
    
    onPaymentSuccess(paymentDetails);
  };

  const handlePayPalError = (error: any) => {
    const paymentError = {
      paymentMethod: 'paypal',
      error: error.message || 'PayPal payment failed',
      details: error
    };
    
    onPaymentError(paymentError);
  };

  const handleStripeSuccess = (details: any) => {
    // Stripe details are already in the correct format
    onPaymentSuccess(details);
  };

  const handleStripeError = (error: any) => {
    // Stripe error is already in the correct format
    onPaymentError(error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        
        {/* Payment Method Selection */}
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodChange(method.id)}
              disabled={disabled}
              className={`w-full p-4 border rounded-lg flex items-center space-x-4 transition-colors ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`p-2 rounded-lg ${
                selectedMethod === method.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {method.icon}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Content */}
      <div>
        {selectedMethod === 'card' && (
          <StripePayment
            amount={amount}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
            disabled={disabled}
          />
        )}

        {selectedMethod === 'paypal' && (
          <PayPalPayment
            amount={amount}
            onSuccess={handlePayPalSuccess}
            onError={handlePayPalError}
            onCancel={() => console.log('PayPal payment cancelled')}
            disabled={disabled}
          />
        )}

        {selectedMethod === 'paystack' && (
          <PaystackPayment
            amount={amount}
            email={email}
            orderId={orderId}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
            onCancel={() => console.log('Paystack payment cancelled')}
            disabled={disabled}
          />
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-800">
            <strong>Secure Payment:</strong> Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
