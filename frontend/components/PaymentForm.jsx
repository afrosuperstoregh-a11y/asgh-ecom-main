import React, { useState } from 'react';
import { CreditCard, Lock, Shield } from 'lucide-react';

const PaymentForm = ({ data, onChange, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!data.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(data.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!data.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry)) {
      newErrors.expiry = 'Please enter a valid expiry date (MM/YY)';
    }
    
    if (!data.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(data.cvv)) {
      newErrors.cvv = 'Please enter a valid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

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

      <div className="space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Card Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="cardNumber"
              value={data.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              maxLength={19}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="4242 4242 4242 4242"
            />
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="expiry"
              value={data.expiry}
              onChange={(e) => handleInputChange('expiry', formatExpiry(e.target.value))}
              maxLength={5}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.expiry ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="12/28"
            />
            {errors.expiry && (
              <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
            )}
          </div>

          <div>
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
              CVV <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cvv"
              value={data.cvv}
              onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.cvv ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="123"
            />
            {errors.cvv && (
              <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="billingSameAsShipping"
            checked={data.billingSameAsShipping}
            onChange={(e) => handleInputChange('billingSameAsShipping', e.target.checked)}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
          />
          <label htmlFor="billingSameAsShipping" className="ml-2 text-sm text-gray-600">
            Billing address same as shipping address
          </label>
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
        <p className="text-xs text-gray-600 text-center">
          This is a demo checkout. No actual payment will be processed.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
        >
          Continue to Review
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
