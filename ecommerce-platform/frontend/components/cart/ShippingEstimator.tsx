'use client';

import { useState } from 'react';
import { Truck, MapPin } from 'lucide-react';

interface ShippingEstimatorProps {
  onCalculate: (country: string, postalCode: string) => void;
  currentCountry: string;
  currentPostalCode: string;
  onCountryChange: (country: string) => void;
  onPostalCodeChange: (postalCode: string) => void;
}

export default function ShippingEstimator({
  onCalculate,
  currentCountry,
  currentPostalCode,
  onCountryChange,
  onPostalCodeChange
}: ShippingEstimatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!currentPostalCode.trim()) {
      return;
    }

    setIsCalculating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onCalculate(currentCountry, currentPostalCode.trim());
      setIsCalculating(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Estimate Shipping
      </h3>
      
      <div className="space-y-4">
        {/* Country Selection */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            id="country"
            value={currentCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
            Postal / Zip Code
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="postalCode"
              type="text"
              value={currentPostalCode}
              onChange={(e) => onPostalCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter postal code"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isCalculating}
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={isCalculating || !currentPostalCode.trim()}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Shipping'}
        </button>

        {/* Shipping Info */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Standard shipping: 5-7 business days</p>
          <p>• Express shipping: 2-3 business days</p>
          <p>• Free shipping on orders over $100</p>
        </div>
      </div>
    </div>
  );
}
