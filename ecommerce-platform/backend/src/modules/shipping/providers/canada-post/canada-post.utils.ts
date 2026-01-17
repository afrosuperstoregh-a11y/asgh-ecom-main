import { Logger } from '@nestjs/common';
import { CanadaPostErrorResponse } from './canada-post.types';

export class CanadaPostError extends Error {
  constructor(
    public readonly code: number,
    public readonly details?: any,
    message?: string,
  ) {
    super(message);
    this.name = 'CanadaPostError';
  }
}

export function handleCanadaPostError(error: any, logger: Logger, context?: string): never {
  if (error.response) {
    const { status, data } = error.response;
    const errorData = data as CanadaPostErrorResponse;
    
    logger.error(
      `Canada Post API Error${context ? ` (${context})` : ''}: ${status} - ${errorData?.message || 'Unknown error'}`,
      errorData?.details || error.stack,
    );
    
    throw new CanadaPostError(
      status,
      errorData,
      errorData?.message || `Canada Post API Error: ${status}`,
    );
  }
  
  logger.error(
    `Canada Post Request Failed${context ? ` (${context})` : ''}: ${error.message}`,
    error.stack,
  );
  
  throw new CanadaPostError(
    error.code || 500,
    error,
    `Canada Post Request Failed: ${error.message}`,
  );
}

export function calculatePackageDimensions(items: Array<{ dimensions: { length: number; width: number; height: number } }>) {
  if (items.length === 0) {
    throw new Error('At least one item is required to calculate package dimensions');
  }

  // For single item, return its dimensions
  if (items.length === 1) {
    return { ...items[0].dimensions };
  }

  // For multiple items, calculate the bounding box
  let maxLength = 0;
  let maxWidth = 0;
  let totalHeight = 0;
  let totalVolume = 0;
  let maxVolume = 0;

  items.forEach(item => {
    const { length, width, height } = item.dimensions;
    const volume = length * width * height;
    
    maxLength = Math.max(maxLength, length, width, height);
    maxWidth = Math.max(maxWidth, Math.min(Math.max(length, width), Math.max(width, height)));
    totalHeight += Math.min(length, width, height);
    totalVolume += volume;
    maxVolume = Math.max(maxVolume, volume);
  });

  // If one item dominates the volume, use its dimensions
  if (maxVolume / totalVolume > 0.7) {
    const largestItem = items.reduce((prev, current) => {
      const prevVolume = prev.dimensions.length * prev.dimensions.width * prev.dimensions.height;
      const currentVolume = current.dimensions.length * current.dimensions.width * current.dimensions.height;
      return (prevVolume > currentVolume) ? prev : current;
    });
    
    return { ...largestItem.dimensions };
  }

  // Otherwise, calculate dimensions based on total volume and aspect ratio
  const cubeRoot = Math.cbrt(totalVolume);
  const length = Math.ceil(cubeRoot);
  const width = Math.ceil(cubeRoot);
  const height = Math.ceil(totalVolume / (length * width));

  return {
    length: Math.max(length, maxLength),
    width: Math.max(width, maxWidth),
    height: Math.max(height, totalHeight / items.length),
  };
}

export function calculateTotalWeight(items: Array<{ weight: number }>): number {
  return items.reduce((total, item) => total + item.weight, 0);
}

export function formatAddress(address: {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}): {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
} {
  // Format postal code (remove spaces and convert to uppercase)
  const formattedPostalCode = address.postalCode.replace(/\s+/g, '').toUpperCase();
  
  // Format province/state (convert to 2-letter code if needed)
  const provinceCode = address.province.length > 2 
    ? getProvinceCode(address.province, address.country)
    : address.province.toUpperCase();
  
  return {
    ...address,
    postalCode: formattedPostalCode,
    province: provinceCode,
    // Ensure country is in ISO 3166-1 alpha-2 format
    country: address.country.length > 2 ? getCountryCode(address.country) : address.country.toUpperCase(),
  };
}

function getProvinceCode(provinceName: string, countryCode: string): string {
  // This is a simplified version - you might want to expand this with more mappings
  const canadianProvinces: Record<string, string> = {
    'alberta': 'AB',
    'british columbia': 'BC',
    'manitoba': 'MB',
    'new brunswick': 'NB',
    'newfoundland and labrador': 'NL',
    'northwest territories': 'NT',
    'nova scotia': 'NS',
    'nunavut': 'NU',
    'ontario': 'ON',
    'prince edward island': 'PE',
    'quebec': 'QC',
    'saskatchewan': 'SK',
    'yukon': 'YT',
  };

  const usStates: Record<string, string> = {
    'alabama': 'AL',
    'alaska': 'AK',
    // Add more US states as needed
  };

  const normalizedProvince = provinceName.toLowerCase().trim();
  
  if (countryCode.toUpperCase() === 'CA') {
    return canadianProvinces[normalizedProvince] || provinceName;
  } else if (countryCode.toUpperCase() === 'US') {
    return usStates[normalizedProvince] || provinceName;
  }
  
  return provinceName;
}

function getCountryCode(countryName: string): string {
  // This is a simplified version - you might want to expand this with more mappings
  const countryMap: Record<string, string> = {
    'canada': 'CA',
    'united states': 'US',
    'united states of america': 'US',
    'mexico': 'MX',
    'united kingdom': 'GB',
    'great britain': 'GB',
    'france': 'FR',
    'germany': 'DE',
    'japan': 'JP',
    'australia': 'AU',
    // Add more countries as needed
  };

  return countryMap[countryName.toLowerCase()] || countryName;
}
