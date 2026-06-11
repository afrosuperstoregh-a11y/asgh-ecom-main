/**
 * URL Encoding Tests
 * 
 * Tests for the shared URL encoding utility to prevent regressions
 */

import {
  encodePathComponent,
  encodePathComponents,
  normalizeImagePath,
  isUrlProperlyEncoded,
  hasDoubleEncoding,
  safeDecodeUrl,
} from '../url-encoding';

describe('URL Encoding', () => {
  describe('encodePathComponent', () => {
    it('should encode ampersands', () => {
      expect(encodePathComponent('food&beverages')).toBe('food%26beverages');
      expect(encodePathComponent('beauty&health')).toBe('beauty%26health');
      expect(encodePathComponent('books&media')).toBe('books%26media');
    });

    it('should preserve path separators', () => {
      expect(encodePathComponent('folder/subfolder')).toBe('folder/subfolder');
    });

    it('should encode spaces', () => {
      expect(encodePathComponent('my image')).toBe('my%20image');
    });

    it('should encode hash characters', () => {
      expect(encodePathComponent('image#1')).toBe('image%231');
    });

    it('should encode question marks', () => {
      expect(encodePathComponent('image?test')).toBe('image%3Ftest');
    });

    it('should NOT decode already-encoded characters', () => {
      expect(encodePathComponent('food%26beverages')).toBe('food%26beverages');
    });
  });

  describe('encodePathComponents', () => {
    it('should encode all path components', () => {
      expect(encodePathComponents('food&beverages/banku-mix.png')).toBe('food%26beverages/banku-mix.png');
      expect(encodePathComponents('beauty&health/product.jpg')).toBe('beauty%26health/product.jpg');
    });

    it('should handle multiple special characters', () => {
      expect(encodePathComponents('food&beverages/my image.jpg')).toBe('food%26beverages/my%20image.jpg');
    });
  });

  describe('normalizeImagePath', () => {
    it('should remove leading slash', () => {
      expect(normalizeImagePath('/path/to/image.jpg')).toBe('path/to/image.jpg');
    });

    it('should remove bucket prefixes', () => {
      expect(normalizeImagePath('product-images/image.jpg')).toBe('image.jpg');
      expect(normalizeImagePath('category-images/image.jpg')).toBe('image.jpg');
    });

    it('should remove storage path prefix', () => {
      expect(normalizeImagePath('storage/v1/object/public/product-images/image.jpg')).toBe('image.jpg');
    });

    it('should handle full URLs', () => {
      expect(normalizeImagePath('https://example.com/storage/v1/object/public/product-images/image.jpg')).toBe('image.jpg');
    });
  });

  describe('isUrlProperlyEncoded', () => {
    it('should return true for properly encoded URLs', () => {
      expect(isUrlProperlyEncoded('https://example.com/food%26beverages/image.jpg')).toBe(true);
    });

    it('should return false for URLs with unencoded ampersands', () => {
      expect(isUrlProperlyEncoded('https://example.com/food&beverages/image.jpg')).toBe(false);
    });

    it('should return false for URLs with unencoded spaces', () => {
      expect(isUrlProperlyEncoded('https://example.com/my image.jpg')).toBe(false);
    });

    it('should handle query parameters correctly', () => {
      expect(isUrlProperlyEncoded('https://example.com/image.jpg?param=value')).toBe(true);
    });
  });

  describe('hasDoubleEncoding', () => {
    it('should detect double-encoded URLs', () => {
      expect(hasDoubleEncoding('food%2526beverages')).toBe(true);
      expect(hasDoubleEncoding('image%2520test')).toBe(true);
    });

    it('should return false for single-encoded URLs', () => {
      expect(hasDoubleEncoding('food%26beverages')).toBe(false);
      expect(hasDoubleEncoding('image%20test')).toBe(false);
    });
  });

  describe('safeDecodeUrl', () => {
    it('should decode single-encoded URLs', () => {
      expect(safeDecodeUrl('food%26beverages')).toBe('food&beverages');
    });

    it('should handle double-encoded URLs', () => {
      expect(safeDecodeUrl('food%2526beverages')).toBe('food&beverages');
    });

    it('should handle triple-encoded URLs', () => {
      expect(safeDecodeUrl('food%252526beverages')).toBe('food&beverages');
    });

    it('should return as-is for invalid encoding', () => {
      expect(safeDecodeUrl('invalid%')).toBe('invalid%');
    });
  });
});

/**
 * Regression Test: Prevent .replace(/%26/g, '&') from reappearing
 */
describe('Regression Prevention', () => {
  it('should NOT decode %26 back to & in encodePathComponent', () => {
    const result = encodePathComponent('food&beverages');
    expect(result).not.toContain('&');
    expect(result).toContain('%26');
  });

  it('should NOT decode %26 back to & in encodePathComponents', () => {
    const result = encodePathComponents('food&beverages/image.jpg');
    expect(result).not.toContain('&');
    expect(result).toContain('%26');
  });
});
