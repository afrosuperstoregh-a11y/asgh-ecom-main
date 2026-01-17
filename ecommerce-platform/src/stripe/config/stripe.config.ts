import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Type definitions for Stripe configuration
type StripePaymentMethod = 'card' | 'alipay' | 'ideal' | 'sepa_debit' | 'sofort' | 'bancontact' | 'giropay' | 'p24' | 'eps' | 'grabpay' | 'fpx' | 'au_becs_debit' | 'bacs_debit' | 'afterpay_clearpay' | 'klarna' | 'affirm' | 'us_bank_account';
type StripeCurrency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | 'chf' | 'nzd' | 'sgd' | 'hkd' | 'nok' | 'dkk' | 'sek';
type CountryCode = 'US' | 'CA' | 'GB' | 'AU' | 'DE' | 'FR' | 'JP' | 'SG' | 'HK' | 'NO' | 'DK' | 'SE' | 'NL' | 'BE' | 'AT' | 'CH' | 'IE' | 'IT' | 'NZ' | 'ES' | 'PT';

/**
 * Stripe configuration interface
 */
interface IStripeConfig {
  isLive: boolean;
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
  currency: StripeCurrency;
  paymentMethods: StripePaymentMethod[];
  shippingCountries: CountryCode[];
  successUrl: string;
  cancelUrl: string;
  webhookTolerance: number;
  testClockId?: string; // For testing time-dependent functionality
}

// Export the interface as StripeConfig for external use
export type StripeConfig = IStripeConfig;

/**
 * Stripe configuration schema for environment variables validation
 */
const stripeEnvSchema = z.object({
  // Required settings
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  
  // Optional settings with defaults
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STRIPE_API_VERSION: z.string().default('2023-10-16'),
  STRIPE_CURRENCY: z.enum([
    'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'chf', 'nzd', 'sgd', 'hkd', 'nok', 'dkk', 'sek'
  ]).default('usd'),
  
  STRIPE_PAYMENT_METHODS: z
    .string()
    .transform((str: string): StripePaymentMethod[] => 
      str.split(',').map(s => s.trim().toLowerCase() as StripePaymentMethod)
    )
    .refine(
      (methods) => methods.every(method => 
        [
          'card', 'alipay', 'ideal', 'sepa_debit', 'sofort', 'bancontact', 
          'giropay', 'p24', 'eps', 'grabpay', 'fpx', 'au_becs_debit', 
          'bacs_debit', 'afterpay_clearpay', 'klarna', 'affirm', 'us_bank_account'
        ].includes(method)
      ),
      { message: 'Invalid payment method specified' }
    )
    .default('card'),
    
  STRIPE_SHIPPING_COUNTRIES: z
    .string()
    .transform((str: string): CountryCode[] => 
      str.split(',').map(s => s.trim().toUpperCase() as CountryCode)
    )
    .refine(
      (countries) => countries.every(country => 
        [
          'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'SG', 'HK', 'NO', 
          'DK', 'SE', 'NL', 'BE', 'AT', 'CH', 'IE', 'IT', 'NZ', 'ES', 'PT'
        ].includes(country)
      ),
      { message: 'Invalid country code specified' }
    )
    .default('US,CA'),
    
  STRIPE_SUCCESS_URL: z
    .string()
    .url('Success URL must be a valid URL')
    .default('http://localhost:3000/checkout/success'),
    
  STRIPE_CANCEL_URL: z
    .string()
    .url('Cancel URL must be a valid URL')
    .default('http://localhost:3000/checkout/cancel'),
  
  // Webhook configuration
  STRIPE_WEBHOOK_TOLERANCE: z
    .coerce
    .number()
    .int()
    .min(0, 'Webhook tolerance must be a positive number')
    .max(900, 'Webhook tolerance cannot exceed 15 minutes (900 seconds)')
    .default(300),
});

/**
 * Stripe configuration factory
 */
const stripeConfig = registerAs<IStripeConfig>('stripe', () => {
  // Validate environment variables
  const env = stripeEnvSchema.parse(process.env);
  
  // Build the configuration object
  const config: IStripeConfig = {
    isLive: env.NODE_ENV === 'production',
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    apiVersion: env.STRIPE_API_VERSION,
    currency: env.STRIPE_CURRENCY,
    paymentMethods: env.STRIPE_PAYMENT_METHODS,
    shippingCountries: env.STRIPE_SHIPPING_COUNTRIES,
    successUrl: env.STRIPE_SUCCESS_URL,
    cancelUrl: env.STRIPE_CANCEL_URL,
    webhookTolerance: env.STRIPE_WEBHOOK_TOLERANCE,
  };
  
  // Validate the configuration
  validateStripeConfig(config);
  
  return config;
});

/**
 * Validates the Stripe configuration at runtime
 * @param config The Stripe configuration to validate
 * @throws {Error} If the configuration is invalid
 */
function validateStripeConfig(config: IStripeConfig): void {
  // Validate secret key format (starts with sk_test_ or sk_live_)
  const secretKeyPattern = /^sk_(test|live)_[a-zA-Z0-9]+$/;
  if (!secretKeyPattern.test(config.secretKey)) {
    throw new Error('Invalid Stripe secret key format. Must start with sk_test_ or sk_live_');
  }
  
  // Validate webhook secret format (starts with whsec_)
  if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
    throw new Error('Invalid Stripe webhook secret format. Must start with whsec_');
  }
  
  // Validate API version format (YYYY-MM-DD)
  const apiVersionPattern = /^\d{4}-\d{2}-\d{2}(-\w+)?$/;
  if (!apiVersionPattern.test(config.apiVersion)) {
    throw new Error('Invalid Stripe API version format. Must be in YYYY-MM-DD format');
  }
  
  // Ensure at least one payment method is provided
  if (!config.paymentMethods || config.paymentMethods.length === 0) {
    throw new Error('At least one payment method must be specified');
  }
  
  // Ensure at least one shipping country is provided
  if (!config.shippingCountries || config.shippingCountries.length === 0) {
    throw new Error('At least one shipping country must be specified');
  }
  
  // Validate URLs
  try {
    new URL(config.successUrl);
    new URL(config.cancelUrl);
  } catch (error) {
    throw new Error('Invalid URL in success or cancel URL');
  }
}

export { stripeConfig as default };
// Export the interface for type checking
export type { IStripeConfig as StripeConfig };
