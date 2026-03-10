import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Tag, X } from 'lucide-react';

const OrderSummary = ({ products, shippingCost, termsAccepted, currentStep }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);

  const calculateSubtotal = () => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12; // 12% tax rate
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost + calculateTax();
  };

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    // Promo code functionality is non-functional as per requirements
    alert('Promo codes are not functional in this demo.');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
        {isMobile && (
          <button className="p-1">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {(isExpanded || !isMobile) && (
        <div className="p-4 space-y-4">
          {/* Products */}
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500">Qty: {product.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${(product.price * product.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="border-t border-gray-200 pt-4">
            {!showPromoInput ? (
              <button
                onClick={() => setShowPromoInput(true)}
                className="flex items-center space-x-2 text-sm text-black hover:text-gray-700 transition-colors"
              >
                <Tag className="h-4 w-4" />
                <span>Add Promo Code</span>
              </button>
            ) : (
              <form onSubmit={handlePromoSubmit} className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoInput(false);
                      setPromoCode('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium">
                {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (12%)</span>
              <span className="font-medium">${calculateTax().toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-base font-bold text-gray-900">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Mobile CTA */}
          {isMobile && currentStep < 5 && (
            <div className="border-t border-gray-200 pt-4">
              <button
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                disabled={currentStep === 5 && !termsAccepted}
              >
                {currentStep === 5 ? 'Place Order' : 'Continue'}
              </button>
            </div>
          )}

          {/* Security Badge */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M2.5 6.5L1 5l.5-.5L2.5 5.5 6.5 1.5 7 2z"/>
                </svg>
              </div>
              <span>Secure Checkout</span>
              <span>•</span>
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
