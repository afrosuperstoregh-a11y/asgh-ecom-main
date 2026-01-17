import React, { useState } from 'react';
import { MapPin, Home } from 'lucide-react';

const ShippingAddressForm = ({ data, onChange, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!data.firstName) newErrors.firstName = 'First name is required';
    if (!data.lastName) newErrors.lastName = 'Last name is required';
    if (!data.addressLine1) newErrors.addressLine1 = 'Address is required';
    if (!data.city) newErrors.city = 'City is required';
    if (!data.province) newErrors.province = 'Province is required';
    if (!data.postalCode) {
      newErrors.postalCode = 'Postal code is required';
    } else if (!/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(data.postalCode)) {
      newErrors.postalCode = 'Please enter a valid Canadian postal code (e.g., V5K 0A1)';
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

  const formatPostalCode = (value) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  const provinces = [
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Address</h2>
        <p className="text-gray-600">Enter the address where you want your order delivered</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={data.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.firstName ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={data.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.lastName ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Home className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="addressLine1"
              value={data.addressLine1}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.addressLine1 ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="123 Main Street"
            />
          </div>
          {errors.addressLine1 && (
            <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
          )}
        </div>

        <div>
          <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 2 (Optional)
          </label>
          <input
            type="text"
            id="addressLine2"
            value={data.addressLine2}
            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Apartment, suite, etc."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              value={data.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.city ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="Vancouver"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              value={data.province}
              onChange={(e) => handleInputChange('province', e.target.value)}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.province ? 'border-red-500' : 'border-gray-300'}
              `}
            >
              <option value="">Select Province</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
            {errors.province && (
              <p className="mt-1 text-sm text-red-600">{errors.province}</p>
            )}
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="postalCode"
              value={data.postalCode}
              onChange={(e) => handleInputChange('postalCode', formatPostalCode(e.target.value))}
              maxLength={7}
              className={`
                block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="V5K 0A1"
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            id="country"
            value={data.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            readOnly
          />
        </div>
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
          Continue to Shipping Method
        </button>
      </div>
    </form>
  );
};

export default ShippingAddressForm;
