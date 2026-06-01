'use client';

import { useState } from 'react';
import { Truck, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useInternalDelivery, ShippingAddress, ShippingRate } from '../hooks/useInternalDelivery';

interface ShippingCalculatorProps {
  onShippingSelected?: (rate: ShippingRate) => void;
  className?: string;
}

export default function ShippingCalculator({ onShippingSelected, className = '' }: ShippingCalculatorProps) {
  const [address, setAddress] = useState<ShippingAddress>({
    postalCode: '',
    province: '',
    city: '',
    addressLine: '',
    country: 'CA'
  });
  
  const [showRates, setShowRates] = useState(false);
  const { 
    loading, 
    error, 
    rates, 
    selectedRate, 
    getShippingRates, 
    selectRate,
    validatePostalCode 
  } = useInternalDelivery();

  const provinces = [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'YT', name: 'Yukon' }
  ];

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleGetRates = async () => {
    if (!address.postalCode || !address.province) {
      alert('Please enter postal code and select province');
      return;
    }

    if (!validatePostalCode(address.postalCode)) {
      alert('Please enter a valid Canadian postal code (e.g., K1A 0B1)');
      return;
    }

    const result = await getShippingRates(address);
    if (result) {
      setShowRates(true);
    }
  };

  const handleRateSelect = (rate: ShippingRate) => {
    selectRate(rate);
    onShippingSelected?.(rate);
  };

  const formatPostalCode = (value: string) => {
    // Format postal code as A1A 1A1
    const cleaned = value.toUpperCase().replace(/\s/g, '');
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <Truck className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Canada Post Shipping</h3>
      </div>

      {/* Address Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code *
          </label>
          <input
            type="text"
            value={address.postalCode}
            onChange={(e) => handleAddressChange('postalCode', formatPostalCode(e.target.value))}
            placeholder="K1A 0B1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={7}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province *
          </label>
          <select
            value={address.province}
            onChange={(e) => handleAddressChange('province', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Province</option>
            {provinces.map(province => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            placeholder="Toronto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line
          </label>
          <input
            type="text"
            value={address.addressLine}
            onChange={(e) => handleAddressChange('addressLine', e.target.value)}
            placeholder="123 Main St"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Get Rates Button */}
      <button
        onClick={handleGetRates}
        disabled={loading || !address.postalCode || !address.province}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Getting Rates...
          </div>
        ) : (
          'Get Shipping Rates'
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Shipping Rates */}
      {showRates && rates.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">Available Shipping Options</h4>
          
          {rates.map((rate) => (
            <div
              key={rate.service_id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedRate?.service_id === rate.service_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRateSelect(rate)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Package className="h-5 w-5 text-gray-600 mr-2" />
                    <h5 className="font-medium text-gray-900">{rate.service_name}</h5>
                    {selectedRate?.service_id === rate.service_id && (
                      <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{rate.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {rate.estimated_delivery}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-gray-900">${rate.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">CAD</p>
                </div>
              </div>
            </div>
          ))}

          {selectedRate && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>Selected:</strong> {selectedRate.service_name} - ${selectedRate.price.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Internal Delivery Branding */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Powered by ASGH Internal Delivery</span>
          <span className="font-semibold text-blue-600">ASGH Delivery</span>
        </div>
      </div>
    </div>
  );
}
