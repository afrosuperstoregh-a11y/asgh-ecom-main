import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, Shield, AlertCircle } from 'lucide-react';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripePaymentForm = ({ 
  amount, 
  currency = 'cad', 
  onPaymentSuccess, 
  onPaymentError,
  orderId,
  userId 
}) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        amount={amount}
        currency={currency}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        orderId={orderId}
        userId={userId}
      />
    </Elements>
  );
};

const CheckoutForm = ({ 
  amount, 
  currency, 
  onPaymentSuccess, 
  onPaymentError,
  orderId,
  userId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            metadata: {
              orderId,
              userId
            }
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        setError('Failed to initialize payment');
        console.error('Payment intent creation error:', err);
      }
    };

    if (amount && orderId && userId) {
      createPaymentIntent();
    }
  }, [amount, currency, orderId, userId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (!stripe || !elements || !clientSecret) {
      setError('Payment service not ready');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?session_id=${paymentIntent?.id}`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        setError(paymentError.message);
        onPaymentError?.(paymentError);
      } else if (paymentIntent) {
        // Payment succeeded
        onPaymentSuccess?.(paymentIntent);
      }
    } catch (err) {
      const errorMessage = 'Payment processing failed';
      setError(errorMessage);
      onPaymentError?.(err);
      console.error('Payment processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  if (!clientSecret && !error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <span className="ml-2 text-gray-600">Initializing payment...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Secure Checkout</span>
          <Shield className="h-4 w-4 text-green-600" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Payment Error</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            </div>
            <div className="text-sm text-green-800">
              <p className="font-medium">Secure Payment Processing</p>
              <p className="mt-1">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-green-700">
                <span>256-bit SSL</span>
                <span>•</span>
                <span>PCI Compliant</span>
                <span>•</span>
                <span>Fraud Protection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Order Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {(amount / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements || !clientSecret}
        className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
        )}
      </button>

      <div className="text-center text-xs text-gray-500">
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
};

export default StripePaymentForm;
