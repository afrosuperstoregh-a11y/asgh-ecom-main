'use client';

import { useState, useEffect } from 'react';
import { Tag, CheckCircle, AlertCircle, X } from 'lucide-react';

interface DiscountInputProps {
  className?: string;
  onDiscountApplied?: (discount: any) => void;
  onDiscountRemoved?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showAppliedDiscount?: boolean;
}

interface AppliedDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  description: string;
  minimumAmount?: number;
}

export default function DiscountInput({
  className = '',
  onDiscountApplied,
  onDiscountRemoved,
  disabled = false,
  placeholder = 'Enter discount code',
  showAppliedDiscount = true
}: DiscountInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for pre-applied discount code from localStorage or URL params
  useEffect(() => {
    const checkPreAppliedDiscount = async () => {
      // Check localStorage first
      const storedCode = localStorage.getItem('appliedPromoCode');
      if (storedCode) {
        await validateAndApplyDiscount(storedCode);
        return;
      }

      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('discount') || urlParams.get('promo');
      if (urlCode) {
        await validateAndApplyDiscount(urlCode);
      }
    };

    checkPreAppliedDiscount();
  }, []);

  // Listen for promo code applied events
  useEffect(() => {
    const handlePromoApplied = (event: CustomEvent) => {
      const { code } = event.detail;
      validateAndApplyDiscount(code);
    };

    window.addEventListener('promoCodeApplied', handlePromoApplied as EventListener);
    return () => window.removeEventListener('promoCodeApplied', handlePromoApplied as EventListener);
  }, []);

  const validateAndApplyDiscount = async (discountCode: string) => {
    if (!discountCode.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/marketing/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: discountCode }),
      });

      const data = await response.json();

      if (data.success) {
        const discount: AppliedDiscount = {
          code: data.coupon.code,
          type: data.coupon.type,
          value: parseFloat(data.coupon.value),
          description: data.coupon.description || '',
          minimumAmount: data.coupon.minimumAmount ? parseFloat(data.coupon.minimumAmount) : undefined
        };

        setAppliedDiscount(discount);
        setSuccess('Discount code applied successfully!');
        setCode('');
        
        // Save to localStorage
        localStorage.setItem('appliedPromoCode', discountCode);
        
        // Notify parent component
        onDiscountApplied?.(discount);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Invalid discount code');
        onDiscountRemoved?.();
      }
    } catch (error) {
      setError('Failed to validate discount code');
      onDiscountRemoved?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndApplyDiscount(code);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setError('');
    setSuccess('');
    localStorage.removeItem('appliedPromoCode');
    onDiscountRemoved?.();
  };

  const formatDiscountText = (discount: AppliedDiscount) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% OFF`;
      case 'fixed':
        return `$${discount.value} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'DISCOUNT APPLIED';
    }
  };

  if (appliedDiscount && showAppliedDiscount) {
    return (
      <div className={`discount-applied ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">
                  {appliedDiscount.code} - {formatDiscountText(appliedDiscount)}
                </div>
                {appliedDiscount.description && (
                  <div className="text-sm text-green-700">{appliedDiscount.description}</div>
                )}
                {appliedDiscount.minimumAmount && (
                  <div className="text-xs text-green-600">
                    Minimum order: ${appliedDiscount.minimumAmount}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleRemoveDiscount}
              className="p-1 text-green-600 hover:bg-green-100 rounded-md transition-colors"
              title="Remove discount"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`discount-input ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || isLoading || !code.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
      </form>

      {/* Popular discount codes */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">Popular codes:</p>
        <div className="flex flex-wrap gap-2">
          {['WELCOME10', 'FREESHIP', 'SAVE20'].map((popularCode) => (
            <button
              key={popularCode}
              onClick={() => setCode(popularCode)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {popularCode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
