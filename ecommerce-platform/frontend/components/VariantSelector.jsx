'use client';

import { Check } from 'lucide-react';

export default function VariantSelector({ variants, selectedOptions, onOptionChange }) {
  return (
    <div className="space-y-6">
      {/* Color Selector */}
      {variants.colors && variants.colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color: <span className="font-normal">{selectedOptions.color?.name || 'Select a color'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.colors.map((color) => (
              <button
                key={color.value}
                onClick={() => onOptionChange('color', color)}
                className={`relative p-1 rounded-lg border-2 transition-all ${
                  selectedOptions.color?.value === color.value
                    ? 'border-primary-600 ring-2 ring-primary-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                aria-label={`Select ${color.name}`}
              >
                <div
                  className="w-10 h-10 rounded-md border border-gray-200"
                  style={{ backgroundColor: color.value }}
                />
                {selectedOptions.color?.value === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <Check className="h-5 w-5 text-primary-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {variants.sizes && variants.sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Size: <span className="font-normal">{selectedOptions.size?.name || 'Select a size'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => onOptionChange('size', size)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  selectedOptions.size?.value === size.value
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
