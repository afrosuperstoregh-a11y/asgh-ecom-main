'use client';

import { useState, useEffect } from 'react';

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

// Mock shipping rates for development (replace with real Canada Post API)
const MOCK_SHIPPING_RATES: { [key: string]: ShippingRate[] } = {
  'ON': [
    {
      service_id: 'DOM.EP',
      service_name: 'Expedited Parcel',
      price: 12.99,
      estimated_delivery: '2-3 business days',
      description: 'Fast and reliable delivery within Canada'
    },
    {
      service_id: 'DOM.RP',
      service_name: 'Regular Parcel',
      price: 9.99,
      estimated_delivery: '4-7 business days',
      description: 'Economical ground delivery'
    },
    {
      service_id: 'DOM.XP',
      service_name: 'XpressPost',
      price: 18.99,
      estimated_delivery: '1-2 business days',
      description: 'Next day delivery to major centers'
    }
  ],
  'BC': [
    {
      service_id: 'DOM.EP',
      service_name: 'Expedited Parcel',
      price: 15.99,
      estimated_delivery: '3-4 business days',
      description: 'Fast and reliable delivery within Canada'
    },
    {
      service_id: 'DOM.RP',
      service_name: 'Regular Parcel',
      price: 12.99,
      estimated_delivery: '5-9 business days',
      description: 'Economical ground delivery'
    },
    {
      service_id: 'DOM.XP',
      service_name: 'XpressPost',
      price: 22.99,
      estimated_delivery: '2-3 business days',
      description: 'Fast delivery to western provinces'
    }
  ],
  'QC': [
    {
      service_id: 'DOM.EP',
      service_name: 'Expedited Parcel',
      price: 11.99,
      estimated_delivery: '2-3 business days',
      description: 'Fast and reliable delivery within Canada'
    },
    {
      service_id: 'DOM.RP',
      service_name: 'Regular Parcel',
      price: 8.99,
      estimated_delivery: '4-6 business days',
      description: 'Economical ground delivery'
    },
    {
      service_id: 'DOM.XP',
      service_name: 'XpressPost',
      price: 16.99,
      estimated_delivery: '1-2 business days',
      description: 'Next day delivery to major centers'
    }
  ]
};

// Default rates for other provinces
const DEFAULT_RATES: ShippingRate[] = [
  {
    service_id: 'DOM.EP',
    service_name: 'Expedited Parcel',
    price: 14.99,
    estimated_delivery: '3-5 business days',
    description: 'Fast and reliable delivery within Canada'
  },
  {
    service_id: 'DOM.RP',
    service_name: 'Regular Parcel',
    price: 11.99,
    estimated_delivery: '5-10 business days',
    description: 'Economical ground delivery'
  },
  {
    service_id: 'DOM.XP',
    service_name: 'XpressPost',
    price: 20.99,
    estimated_delivery: '2-4 business days',
    description: 'Fast delivery across Canada'
  }
];

export function useCanadaPostShipping() {
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

      // For development, use mock rates based on province
      // In production, replace with actual Canada Post API call
      const provinceRates = MOCK_SHIPPING_RATES[address.province] || DEFAULT_RATES;
      
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
      console.error('Canada Post shipping error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Real Canada Post API integration (for production)
  const getCanadaPostRates = async (address: ShippingAddress, weight: number = 1): Promise<ShippingQuote | null> => {
    setLoading(true);
    setError(null);

    try {
      // This would be the actual Canada Post API call
      const CANADA_POST_API_BASE = 'https://soa-gw.canadapost-postescanada.ca';
      const API_KEY = process.env.NEXT_PUBLIC_CANADA_POST_API_KEY || 'your-api-key';
      
      const response = await fetch(`${CANADA_POST_API_BASE}/rs/ship/rate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.cpc.ship.rate-v4+xml',
          'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
          'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`
        },
        body: buildCanadaPostRequest(address, weight)
      });

      if (!response.ok) {
        throw new Error(`Canada Post API error: ${response.status}`);
      }

      const xmlData = await response.text();
      const parsedRates = parseCanadaPostResponse(xmlData);
      
      setRates(parsedRates);
      if (parsedRates.length > 0) {
        setSelectedRate(parsedRates[0]);
      }

      return {
        rates: parsedRates,
        origin: 'V3M5T6',
        destination: address.postalCode,
        total_weight: weight
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Canada Post rates';
      setError(errorMessage);
      console.error('Canada Post API error:', err);
      
      // Fallback to mock rates
      return getShippingRates(address, weight);
    } finally {
      setLoading(false);
    }
  };

  const buildCanadaPostRequest = (address: ShippingAddress, weight: number): string => {
    // Build XML request for Canada Post API
    return `
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <origin-postal-code>V3M5T6</origin-postal-code>
        <parcel>
          <weight>${weight}</weight>
          <dimensions>
            <length>30</length>
            <width>20</width>
            <height>10</height>
          </dimensions>
        </parcel>
        <destination>
          <domestic>
            <postal-code>${address.postalCode}</postal-code>
            <province>${address.province}</province>
          </domestic>
        </destination>
        <quote-type>counter</quote-type>
      </mailing-scenario>
    `;
  };

  const parseCanadaPostResponse = (xmlData: string): ShippingRate[] => {
    // Parse XML response from Canada Post
    // This is a simplified parser - in production, use a proper XML parser
    const rates: ShippingRate[] = [];
    
    // Mock parsing - replace with actual XML parsing
    rates.push(
      {
        service_id: 'DOM.EP',
        service_name: 'Expedited Parcel',
        price: 12.99,
        estimated_delivery: '2-3 business days',
        description: 'Canada Post Expedited Parcel'
      }
    );
    
    return rates;
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
    getCanadaPostRates,
    selectRate,
    validatePostalCode
  };
}
