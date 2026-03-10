'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Clock, Gift, Percent } from 'lucide-react';

interface PromoBannerProps {
  className?: string;
  variant?: 'top' | 'inline' | 'modal' | 'floating';
  dismissible?: boolean;
  autoHide?: number; // Auto-hide after X milliseconds
  promo?: {
    id: string;
    title: string;
    description?: string;
    discountCode?: string;
    discountType?: 'percentage' | 'fixed' | 'free_shipping';
    discountValue?: number;
    expiryDate?: string;
    minimumAmount?: number;
    backgroundColor?: string;
    textColor?: string;
    link?: string;
  };
}

export default function PromoBanner({
  className = '',
  variant = 'top',
  dismissible = true,
  autoHide,
  promo
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Default promo data if none provided
  const defaultPromo: PromoBannerProps['promo'] = {
    id: 'default',
    title: 'Limited Time Offer!',
    description: 'Get 20% off your first order',
    discountCode: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    backgroundColor: 'bg-gradient-to-r from-purple-600 to-pink-600',
    textColor: 'text-white',
    link: '/cart',
    minimumAmount: 50
  };

  const currentPromo = promo || defaultPromo;

  useEffect(() => {
    // Check if this promo was previously dismissed
    const dismissedPromos = JSON.parse(localStorage.getItem('dismissedPromos') || '[]');
    if (dismissedPromos.includes(currentPromo.id)) {
      setIsVisible(false);
      return;
    }

    // Auto-hide functionality
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHide);

      return () => clearTimeout(timer);
    }
  }, [autoHide, currentPromo.id, isVisible]);

  const handleDismiss = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsVisible(false);
      
      // Save dismissal to localStorage
      const dismissedPromos = JSON.parse(localStorage.getItem('dismissedPromos') || '[]');
      dismissedPromos.push(currentPromo.id);
      localStorage.setItem('dismissedPromos', JSON.stringify(dismissedPromos));
    }, 300);
  };

  const handleApplyCode = () => {
    if (currentPromo.discountCode) {
      // Apply discount code to cart
      localStorage.setItem('appliedPromoCode', currentPromo.discountCode);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('promoCodeApplied', {
        detail: { code: currentPromo.discountCode, promo: currentPromo }
      }));

      // Navigate to cart if link is provided
      if (currentPromo.link) {
        window.location.href = currentPromo.link;
      }
    }
  };

  const getDiscountIcon = () => {
    switch (currentPromo.discountType) {
      case 'percentage':
        return <Percent className="w-5 h-5" />;
      case 'fixed':
        return <Tag className="w-5 h-5" />;
      case 'free_shipping':
        return <Gift className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const formatDiscountText = () => {
    switch (currentPromo.discountType) {
      case 'percentage':
        return `${currentPromo.discountValue}% OFF`;
      case 'fixed':
        return `$${currentPromo.discountValue} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const getTimeRemaining = () => {
    if (!currentPromo.expiryDate) return null;
    
    const now = new Date().getTime();
    const expiry = new Date(currentPromo.expiryDate).getTime();
    const difference = expiry - now;

    if (difference <= 0) return null;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Ending soon';
  };

  if (!isVisible) return null;

  const timeRemaining = getTimeRemaining();

  if (variant === 'top') {
    return (
      <div className={`promo-banner-top ${isAnimating ? 'animate-pulse' : ''} ${className}`}>
        <div className={`${currentPromo.backgroundColor} ${currentPromo.textColor} relative overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getDiscountIcon()}
                <div>
                  <span className="font-semibold">{currentPromo.title}</span>
                  {currentPromo.description && (
                    <span className="ml-2 opacity-90">{currentPromo.description}</span>
                  )}
                  <span className="ml-3 font-bold">{formatDiscountText()}</span>
                  {timeRemaining && (
                    <span className="ml-3 text-sm opacity-75 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeRemaining}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {currentPromo.discountCode && (
                  <button
                    onClick={handleApplyCode}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
                  >
                    Apply {currentPromo.discountCode}
                  </button>
                )}
                
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`promo-banner-inline ${isAnimating ? 'animate-pulse' : ''} ${className}`}>
        <div className={`${currentPromo.backgroundColor} ${currentPromo.textColor} rounded-lg p-6 relative`}>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {getDiscountIcon()}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{currentPromo.title}</h3>
              {currentPromo.description && (
                <p className="opacity-90 mb-2">{currentPromo.description}</p>
              )}
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl">{formatDiscountText()}</span>
                {timeRemaining && (
                  <span className="text-sm opacity-75 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeRemaining}
                  </span>
                )}
              </div>
              
              {currentPromo.minimumAmount && (
                <p className="text-sm opacity-75 mt-1">
                  Minimum order: ${currentPromo.minimumAmount}
                </p>
              )}
            </div>
            
            {currentPromo.discountCode && (
              <div className="flex-shrink-0">
                <button
                  onClick={handleApplyCode}
                  className="px-4 py-2 bg-white text-gray-900 rounded-md font-semibold hover:bg-gray-100 transition-colors"
                >
                  Apply {currentPromo.discountCode}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`promo-banner-floating fixed bottom-4 right-4 z-50 max-w-sm ${isAnimating ? 'animate-pulse' : ''} ${className}`}>
        <div className={`${currentPromo.backgroundColor} ${currentPromo.textColor} rounded-lg shadow-lg p-4 relative`}>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getDiscountIcon()}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{currentPromo.title}</h4>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatDiscountText()}</span>
                {timeRemaining && (
                  <span className="text-xs opacity-75 flex items-center gap-1">
                    <Clock className="w-2 h-2" />
                    {timeRemaining}
                  </span>
                )}
              </div>
            </div>
            
            {currentPromo.discountCode && (
              <button
                onClick={handleApplyCode}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
