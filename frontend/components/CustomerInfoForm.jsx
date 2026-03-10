import React, { useState } from 'react';
import { Mail, Phone, User } from 'lucide-react';

const CustomerInfoForm = ({ data, onChange, onNext }) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!data.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!data.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Information</h2>
        <p className="text-gray-600">Enter your contact details for order updates</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.email ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="john.doe@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              value={data.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.phone ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="+1 604 555 1234"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="marketingOptIn"
            checked={data.marketingOptIn}
            onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
          />
          <label htmlFor="marketingOptIn" className="ml-2 text-sm text-gray-600">
            Send me updates about new products and promotions
          </label>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-600" />
          <p className="text-sm text-gray-600">
            <strong>Guest Checkout:</strong> No account required. You can create an account later if you wish.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
        >
          Continue to Shipping
        </button>
      </div>
    </form>
  );
};

export default CustomerInfoForm;
