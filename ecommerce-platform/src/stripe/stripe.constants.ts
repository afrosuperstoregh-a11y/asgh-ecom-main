export const STRIPE_CONFIG = 'STRIPE_CONFIG';
export const STRIPE_OPTIONS = 'STRIPE_OPTIONS';

export const STRIPE_WEBHOOK = 'stripe_webhook';
export const STRIPE_CHECKOUT = 'stripe_checkout';

export const STRIPE_API_VERSION = '2023-10-16' as const;

export const STRIPE_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  CHARGE_REFUNDED: 'charge.refunded',
  CHARGE_FAILED: 'charge.failed',
} as const;


export const STRIPE_PAYMENT_METHODS = ['card'] as const;

export const STRIPE_SHIPPING_COUNTRIES = ['US', 'CA'] as const;

