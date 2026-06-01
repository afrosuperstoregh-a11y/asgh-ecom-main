'use client';

import { useState } from 'react';

export interface ShippingRate {
  service_id: string;
  service_name: string;
  price: number;
  estimated_delivery: string;
  description: string;
}

export interface ShippingAddress {
  postalCode: string;
  province: string;
  city: string;
  addressLine: string;
  country: string;
}

export interface ShippingQuote {
  rates: ShippingRate[];
  origin: string;
  destination: string;
  total_weight: number;
}

// Internal delivery rates for different regions
const INTERNAL_DELIVERY_RATES: { [key: string]: ShippingRate[] } = {
  'ON': [
    {
      service_id: 'STD',
      service_name: 'Standard Delivery',
      price: 10.00,
      estimated_delivery: '3-5 business days',
      description: 'Standard delivery within Ontario'
    },
    {
      service_id: 'EXP',
      service_name: 'Express Delivery',
      price: 15.00,
      estimated_delivery: '1-2 business days',
      description: 'Express delivery within Ontario'
    },
    {
      service_id: 'SAMEDAY',
      service_name: 'Same Day Delivery',
      price: 25.00,
      estimated_delivery: 'Same day (order before 2PM)',
      description: 'Same day delivery in GTA area'
    }
  ],
  'BC': [
    {
      service_id: 'STD',
      service_name: 'Standard Delivery',
      price: 15.00,
      estimated_delivery: '5-7 business days',
      description: 'Standard delivery to British Columbia'
    },
    {
      service_id: 'EXP',
      service_name: 'Express Delivery',
      price: 25.00,
      estimated_delivery: '2-3 business days',
      description: 'Express delivery to British Columbia'
    }
  ],
  'QC': [
    {
      service_id: 'STD',
      service_name: 'Standard Delivery',
      price: 12.00,
      estimated_delivery: '3-5 business days',
      description: 'Standard delivery within Quebec'
    },
    {
      service_id: 'EXP',
      service_name: 'Express Delivery',
      price: 18.00,
      estimated_delivery: '1-2 business days',
      description: 'Express delivery within Quebec'
    }
  ]
};

// Default rates for other provinces
const DEFAULT_RATES: ShippingRate[] = [
  {
    service_id: 'STD',
    service_name: 'Standard Delivery',
    price: 15.00,
    estimated_delivery: '5-10 business days',
    description: 'Standard delivery across Canada'
  },
  {
    service_id: 'EXP',
    service_name: 'Express Delivery',
    price: 25.00,
    estimated_delivery: '2-4 business days',
    description: 'Express delivery across Canada'
  }
];

export function useInternalDelivery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  const validatePostalCode = (postalCode: string): boolean => {
    const canadianPostalCodeRegex = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
    return canadianPostalCodeRegex.test(postalCode.replace(/\s/g, ''));
  };

  const getShippingRates = async (address: ShippingAddress, weight: number = 1): Promise<ShippingQuote | null> => {
    setLoading(true);
    setError(null);

    try {
      // Validate postal code
      if (!validatePostalCode(address.postalCode)) {
        throw new Error('Invalid Canadian postal code format');
      }

      // Use internal delivery rates based on province
      const provinceRates = INTERNAL_DELIVERY_RATES[address.province] || DEFAULT_RATES;
      
      // Adjust prices based on weight (simplified calculation)
      const adjustedRates = provinceRates.map(rate => ({
        ...rate,
        price: rate.price + (weight > 1 ? (weight - 1) * 2 : 0)
      }));

      setRates(adjustedRates);
      
      // Auto-select the first (usually cheapest) rate
      if (adjustedRates.length > 0) {
        setSelectedRate(adjustedRates[0]);
      }

      return {
        rates: adjustedRates,
        origin: 'V3M5T6', // AfroSuperstore postal code
        destination: address.postalCode,
        total_weight: weight
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shipping rates';
      setError(errorMessage);
      console.error('Internal delivery error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectRate = (rate: ShippingRate) => {
    setSelectedRate(rate);
  };

  return {
    loading,
    error,
    rates,
    selectedRate,
    getShippingRates,
    selectRate,
    validatePostalCode
  };
}
