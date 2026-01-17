import React from 'react';
import { Truck, Zap, Package } from 'lucide-react';

const ShippingMethod = ({ selectedMethod, onChange, onNext, onBack }) => {
  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      cost: 5.99,
      estimatedDays: '3-5 days',
      icon: Truck,
      description: 'Reliable delivery with tracking'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      cost: 12.99,
      estimatedDays: '1-2 days',
      icon: Zap,
      description: 'Fast delivery with priority handling'
    },
    {
      id: 'free',
      name: 'Free Shipping',
      cost: 0,
      estimatedDays: '5-7 days',
      icon: Package,
      description: 'Economy shipping, no rush'
    }
  ];

  const handleMethodChange = (method) => {
    const selectedOption = shippingOptions.find(option => option.id === method);
    onChange({
      type: method,
      cost: selectedOption.cost,
      estimatedDays: selectedOption.estimatedDays
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Method</h2>
        <p className="text-gray-600">Choose how you want your order delivered</p>
      </div>

      <div className="space-y-4">
        {shippingOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod.type === option.id;
          
          return (
            <label
              key={option.id}
              className={`
                relative flex cursor-pointer rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                ${isSelected 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="shipping-method"
                value={option.id}
                checked={isSelected}
                onChange={() => handleMethodChange(option.id)}
                className="sr-only"
              />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`
                    flex-shrink-0 rounded-full p-2
                    ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {option.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Estimated delivery: {option.estimatedDays}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {option.cost === 0 ? 'FREE' : `$${option.cost.toFixed(2)}`}
                  </p>
                  <div className={`
                    mt-2 h-4 w-4 rounded-full border-2 flex items-center justify-center
                    ${isSelected 
                      ? 'border-black bg-black' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Shipping Information</p>
            <p className="mt-1">
              All orders are processed within 1-2 business days. You'll receive a tracking number once your order ships.
            </p>
          </div>
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
          Continue to Payment
        </button>
      </div>
    </form>
  );
};

export default ShippingMethod;
