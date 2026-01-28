'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, AlertCircle, CheckCircle, Lock } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

// Stripe Card Form Component
const CardForm: React.FC<{
  onSuccess: (paymentResult: any) => void;
  onError: (error: any) => void;
  amount: number;
  disabled?: boolean;
}> = ({ onSuccess, onError, amount, disabled }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      if (cardElement) {
        cardElement.on('change', (event) => {
          setError(event.error ? event.error.message : null);
          setComplete(event.complete);
        });
      }
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent on server
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        throw new Error(backendError);
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            // Add billing details if needed
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        const paymentResult = {
          paymentMethod: 'stripe',
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert back to dollars
          currency: paymentIntent.currency,
          created: paymentIntent.created,
        };

        onSuccess(paymentResult);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError({ paymentMethod: 'stripe', error: errorMessage, details: err });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        iconColor: '#666EE8',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Card Information
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 z-10">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div className="pl-10">
            <CardElement
              options={cardElementOptions}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-700 text-sm">Processing payment...</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || !complete || isProcessing || disabled}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            <span>Pay ${amount.toFixed(2)}</span>
          </>
        )}
      </button>

      {/* Security Notice */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-800">
            <strong>Secure Payment:</strong> Your card details are encrypted and secure. We never store your card information.
          </p>
        </div>
      </div>

      {/* Accepted Cards */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">We accept:</p>
        <div className="flex justify-center space-x-2">
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">VISA</div>
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">MC</div>
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">AMEX</div>
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">DISC</div>
        </div>
      </div>
    </form>
  );
};

// Main Stripe Payment Component
const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  currency = 'usd',
  onSuccess,
  onError,
  disabled = false
}) => {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Stripe is configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setLoadError('Stripe is not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.');
      return;
    }

    // Load Stripe
    stripePromise.then(() => {
      setIsReady(true);
    }).catch((error) => {
      setLoadError('Failed to load Stripe payment system.');
      console.error('Stripe load error:', error);
    });
  }, []);

  if (loadError) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-800 font-medium mb-2">Payment System Unavailable</h3>
        <p className="text-red-600 text-sm">{loadError}</p>
        <p className="text-red-500 text-xs mt-2">Please try again later or use PayPal.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-8 border border-gray-200 rounded-lg bg-gray-50 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading secure payment form...</p>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret: undefined, // Will be set when payment is initiated
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Stripe Header */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Credit/Debit Card</h3>
          <p className="text-sm text-gray-600">Pay securely with your card</p>
        </div>
      </div>

      {/* Stripe Elements */}
      <Elements stripe={stripePromise} options={stripeOptions}>
        <CardForm
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
        />
      </Elements>

      {/* Stripe Benefits */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Secure encryption</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>PCI compliant</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>3D Secure support</span>
        </div>
      </div>

      {/* PCI Compliance Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>Powered by Stripe | PCI-DSS Level 1 Compliant</p>
      </div>
    </div>
  );
};

export default StripePayment;
