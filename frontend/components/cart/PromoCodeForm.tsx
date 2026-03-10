'use client';

import { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';

interface PromoCodeFormProps {
  onApply: (code: string) => { success: boolean; message: string };
  currentDiscount: number;
}

export default function PromoCodeForm({ onApply, currentDiscount }: PromoCodeFormProps) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    setIsApplying(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const result = onApply(code.trim());
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      setIsApplying(false);
      
      if (result.success) {
        setCode('');
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Promo Code</h3>
      
      {currentDiscount > 0 ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Promo code applied!</p>
            <p className="text-sm text-green-600">You saved ${currentDiscount.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter promo code"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isApplying}
              />
            </div>
            <button
              onClick={handleApply}
              disabled={isApplying || !code.trim()}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Promo Code Hints */}
          <div className="text-sm text-gray-500">
            <p>Try these codes:</p>
            <ul className="mt-1 space-y-1">
              <li>• <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">SAVE10</code> - 10% off</li>
              <li>• <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">SAVE20</code> - 20% off</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
