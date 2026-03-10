import React, { useState } from 'react';
import { User, MapPin, Truck, CreditCard, Package } from 'lucide-react';

const ReviewOrder = ({ orderData, products, onBack, onPlaceOrder, onTermsChange }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const calculateSubtotal = () => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12; // 12% tax rate
  };

  const calculateTotal = () => {
    return calculateSubtotal() + orderData.shippingMethod.cost + calculateTax();
  };

  const handleTermsChange = (checked) => {
    setTermsAccepted(checked);
    onTermsChange(checked);
  };

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to place your order.');
      return;
    }

    setIsPlacingOrder(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsPlacingOrder(false);
    onPlaceOrder();
  };

  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '**** **** **** ****';
    const last4 = cardNumber.slice(-4);
    return `**** **** **** ${last4}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Order</h2>
        <p className="text-gray-600">Please review your order details before placing your order</p>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Customer Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{orderData.customerInfo.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="font-medium">{orderData.customerInfo.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Shipping Address</h3>
        </div>
        <div className="text-sm">
          <p className="font-medium">
            {orderData.shippingAddress.firstName} {orderData.shippingAddress.lastName}
          </p>
          <p>{orderData.shippingAddress.addressLine1}</p>
          {orderData.shippingAddress.addressLine2 && (
            <p>{orderData.shippingAddress.addressLine2}</p>
          )}
          <p>
            {orderData.shippingAddress.city}, {orderData.shippingAddress.province} {orderData.shippingAddress.postalCode}
          </p>
          <p>{orderData.shippingAddress.country}</p>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Truck className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Shipping Method</h3>
        </div>
        <div className="text-sm">
          <p className="font-medium capitalize">{orderData.shippingMethod.type} Shipping</p>
          <p className="text-gray-600">Estimated delivery: {orderData.shippingMethod.estimatedDays}</p>
          <p className="font-medium">
            {orderData.shippingMethod.cost === 0 ? 'FREE' : `$${orderData.shippingMethod.cost.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Payment Method</h3>
        </div>
        <div className="text-sm">
          <p className="font-medium">{formatCardNumber(orderData.paymentInfo.cardNumber)}</p>
          <p className="text-gray-600">Expires: {orderData.paymentInfo.expiry || '--/--'}</p>
          {orderData.paymentInfo.billingSameAsShipping && (
            <p className="text-green-600 text-xs mt-1">Billing address same as shipping</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Package className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Order Items</h3>
        </div>
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-gray-600">Qty: {product.quantity}</p>
                </div>
              </div>
              <p className="font-medium">${(product.price * product.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {orderData.shippingMethod.cost === 0 ? 'FREE' : `$${orderData.shippingMethod.cost.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (12%)</span>
            <span className="font-medium">${calculateTax().toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => handleTermsChange(e.target.checked)}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
          />
          <div className="text-sm">
            <label htmlFor="terms" className="font-medium text-gray-900 cursor-pointer">
              Terms and Conditions
            </label>
            <p className="text-gray-600 mt-1">
              I agree to the terms and conditions and understand that this is a demo order. 
              No actual payment will be processed and no products will be shipped.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!termsAccepted || isPlacingOrder}
          className={`
            px-8 py-3 rounded-lg font-medium transition-colors duration-200
            ${termsAccepted && !isPlacingOrder
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isPlacingOrder ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default ReviewOrder;
