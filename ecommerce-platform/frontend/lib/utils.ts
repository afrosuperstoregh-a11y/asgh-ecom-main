/**
 * Formats a number as a price string with 2 decimal places and a currency symbol
 * @param price - The price to format (in cents or dollars, depending on your application)
 * @returns Formatted price string (e.g., "$19.99")
 */
export function formatPrice(price: number): string {
  // Convert to dollars if your prices are stored in cents
  const amount = price / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param str - The string to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Generates a unique ID (for client-side use only)
 * @returns A unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Utility function to concatenate class names conditionally
 * @param inputs - Class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
