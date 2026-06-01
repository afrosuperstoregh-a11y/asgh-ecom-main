'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, Clock, Mail } from 'lucide-react';
import { getSafeImageUrl } from '../../lib/images';

interface AbandonedCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartData?: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }>;
    totalValue: number;
  };
  email?: string;
  onEmailSubmit?: (email: string) => void;
  onCartRecovery?: () => void;
}

export default function AbandonedCartModal({
  isOpen,
  onClose,
  cartData,
  email,
  onEmailSubmit,
  onCartRecovery
}: AbandonedCartModalProps) {
  const [userEmail, setUserEmail] = useState(email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(!email);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Track modal view for analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'abandoned_cart_modal_view', {
          event_category: 'ecommerce',
          event_label: 'abandoned_cart_recovery'
        });
      }
    }
  }, [isOpen]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onEmailSubmit?.(userEmail);
      setSubmitted(true);
      setShowEmailForm(false);
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoverCart = () => {
    // Track recovery for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'abandoned_cart_recovered', {
        event_category: 'ecommerce',
        event_label: 'abandoned_cart_recovery',
        value: cartData?.totalValue
      });
    }

    onCartRecovery?.();
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Wait! Don't leave yet
              </h2>
              <p className="text-gray-600">
                You left items in your cart. Complete your purchase before they sell out!
              </p>
            </div>

            {/* Cart Items */}
            {cartData && cartData.items.length > 0 && (
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Your Cart</h3>
                  <div className="space-y-2 mb-3">
                    {cartData.items.slice(0, 3).map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={getSafeImageUrl(item.image, '/placeholder-product.svg')}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('/placeholder-product.svg')) {
                                target.src = '/placeholder-product.svg';
                              }
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                    {cartData.items.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{cartData.items.length - 3} more items
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-lg text-gray-900">
                        {formatPrice(cartData.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Form */}
            {showEmailForm ? (
              <form onSubmit={handleEmailSubmit} className="mb-6">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your email to save your cart
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6">
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Cart saved!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      We'll send you a recovery link via email.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Cart saved to {userEmail}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Urgency Message */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-800">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Limited time offer!</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Items in your cart may sell out soon. Complete your order now to secure them.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRecoverCart}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Complete Your Order
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                I'll decide later
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>30-day returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
