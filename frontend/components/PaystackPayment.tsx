'use client';

import { useState } from 'react';
import { Smartphone, CreditCard, Banknote, AlertCircle, CheckCircle } from 'lucide-react';

interface PaystackPaymentProps {
  amount: number;
  email: string;
  orderId: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  amount,
  email,
  orderId,
  onSuccess,
  onError,
  onCancel,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('mobile_money');

  const paymentChannels = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'MTN, Vodafone, AirtelTigo',
      icon: <Smartphone className="h-5 w-5" />,
      popular: true
    },
    {
      id: 'card',
      name: 'Card Payment',
      description: 'Visa, Mastercard, etc.',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank payment',
      icon: <Banknote className="h-5 w-5" />
    }
  ];

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Initialize Paystack transaction
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount,
          orderId,
          metadata: {
            payment_channel: selectedChannel,
            currency: 'GHS'
          }
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to initialize payment');
      }

      // Redirect to Paystack payment page
      if (result.data?.authorization_url) {
        // Store payment reference for verification after redirect
        localStorage.setItem('paystack_reference', result.data.reference);
        localStorage.setItem('paystack_order_id', orderId);
        
        // Open Paystack in new window for better UX
        const popup = window.open(
          result.data.authorization_url,
          'paystack-payment',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          // Fallback to redirect if popup is blocked
          window.location.href = result.data.authorization_url;
        } else {
          // Monitor popup for closure
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              // Verify payment after popup closes
              verifyPayment(result.data.reference);
            }
          }, 1000);
        }
      } else {
        throw new Error('No payment URL received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(errorMessage);
      onError({
        paymentMethod: 'paystack',
        error: errorMessage,
        details: err
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/paystack/verify/${reference}`);
      const result = await response.json();

      if (result.success && result.data.status === 'success') {
        // Clear stored payment data
        localStorage.removeItem('paystack_reference');
        localStorage.removeItem('paystack_order_id');

        onSuccess({
          paymentMethod: 'paystack',
          transactionId: reference,
          status: 'success',
          amount: result.data.amount,
          currency: result.data.currency,
          customer: result.data.customer,
          paidAt: result.data.paid_at
        });
      } else {
        setError('Payment verification failed');
        onError({
          paymentMethod: 'paystack',
          error: 'Payment verification failed',
          details: result
        });
      }
    } catch (err) {
      setError('Failed to verify payment');
      onError({
        paymentMethod: 'paystack',
        error: 'Failed to verify payment',
        details: err
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Channels */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h4>
        <div className="space-y-3">
          {paymentChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              disabled={disabled || isProcessing}
              className={`w-full p-4 border rounded-lg flex items-center space-x-4 transition-colors ${
                selectedChannel === channel.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`p-2 rounded-lg ${
                selectedChannel === channel.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {channel.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-gray-900">{channel.name}</h5>
                  {channel.popular && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{channel.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedChannel === channel.id
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              }`}>
                {selectedChannel === channel.id && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Payment Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₵{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium capitalize">
              {paymentChannels.find(c => c.id === selectedChannel)?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{email}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={disabled || isProcessing || !email}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Pay with Paystack</span>
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm text-green-800 font-medium">Secure Mobile Money Payment</p>
            <p className="text-xs text-green-700 mt-1">
              Your payment is processed securely through Paystack. We support MTN Mobile Money, Vodafone Cash, and AirtelTigo Money.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-600">
        <p>After payment, you'll be redirected back to complete your order.</p>
        <p className="mt-1">
          Need help?{' '}
          <a href="#" className="text-green-600 hover:text-green-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaystackPayment;
