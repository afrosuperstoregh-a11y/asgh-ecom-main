import { Stripe } from 'stripe';

export enum PaymentMethodType {
  // Card payments
  Card = 'card',
  CardPresent = 'card_present',
  
  // Digital/mobile wallets
  Alipay = 'alipay',
  ApplePay = 'apple_pay',
  GooglePay = 'google_pay',
  
  // Bank redirects & local payment methods
  Ideal = 'ideal',
  SepaDebit = 'sepa_debit',
  Sofort = 'sofort',
  Bancontact = 'bancontact',
  Giropay = 'giropay',
  P24 = 'p24',
  Eps = 'eps',
  Multibanco = 'multibanco',
  WeChatPay = 'wechat_pay',
  AfterpayClearpay = 'afterpay_clearpay',
  Boleto = 'boleto',
  Oxxo = 'oxxo',
  Klarna = 'klarna',
  Affirm = 'affirm',
  Paypal = 'paypal',
  AmazonPay = 'amazon_pay',
  Link = 'link',
  Grabpay = 'grabpay',
  Fpx = 'fpx',
  
  // Bank debits
  AcssDebit = 'acss_debit',
  AuBecsDebit = 'au_becs_debit',
  BacsDebit = 'bacs_debit',
  
  // Other
  UsBankAccount = 'us_bank_account',
  CustomerBalance = 'customer_balance',
}

export enum WebhookEventType {
  // Payment events
  PaymentIntentSucceeded = 'payment_intent.succeeded',
  PaymentIntentPaymentFailed = 'payment_intent.payment_failed',
  PaymentIntentCanceled = 'payment_intent.canceled',
  PaymentIntentProcessing = 'payment_intent.processing',
  PaymentIntentRequiresAction = 'payment_intent.requires_action',
  
  // Checkout session events
  CheckoutSessionCompleted = 'checkout.session.completed',
  CheckoutSessionAsyncPaymentSucceeded = 'checkout.session.async_payment_succeeded',
  CheckoutSessionAsyncPaymentFailed = 'checkout.session.async_payment_failed',
  
  // Charge events
  ChargeSucceeded = 'charge.succeeded',
  ChargeFailed = 'charge.failed',
  ChargeRefunded = 'charge.refunded',
  ChargeDisputeCreated = 'charge.dispute.created',
  
  // Customer events
  CustomerCreated = 'customer.created',
  CustomerUpdated = 'customer.updated',
  CustomerDeleted = 'customer.deleted',
  
  // Subscription events
  CustomerSubscriptionCreated = 'customer.subscription.created',
  CustomerSubscriptionUpdated = 'customer.subscription.updated',
  CustomerSubscriptionDeleted = 'customer.subscription.deleted',
  
  // Invoice events
  InvoicePaid = 'invoice.paid',
  InvoicePaymentFailed = 'invoice.payment_failed',
  InvoicePaymentSucceeded = 'invoice.payment_succeeded',
  
  // Payout events
  PayoutCreated = 'payout.created',
  PayoutPaid = 'payout.paid',
  PayoutFailed = 'payout.failed',
  
  // Refund events
  ChargeRefundUpdated = 'charge.refund.updated',
  RefundUpdated = 'refund.updated',
  
  // Dispute events
  ChargeDisputeClosed = 'charge.dispute.closed',
  ChargeDisputeFundsReinstated = 'charge.dispute.funds_reinstated',
  ChargeDisputeFundsWithdrawn = 'charge.dispute.funds_withdrawn',
  ChargeDisputeUpdated = 'charge.dispute.updated',
}

export type CheckoutSessionMetadata = {
  orderId: string;
  userId: string;
  [key: string]: string | number | null;
};

export type PaymentIntentMetadata = {
  orderId: string;
  userId: string;
  [key: string]: string | number | null;
};

export type CheckoutSessionParams = Stripe.Checkout.SessionCreateParams & {
  metadata: CheckoutSessionMetadata;
  payment_intent_data?: {
    metadata: PaymentIntentMetadata;
    description?: string;
    statement_descriptor?: string;
    statement_descriptor_suffix?: string;
    receipt_email?: string;
    setup_future_usage?: 'on_session' | 'off_session';
  };
  subscription_data?: {
    metadata: Record<string, string>;
    trial_period_days?: number;
    default_payment_method?: string;
  };
  tax_id_collection?: {
    enabled: boolean;
  };
  shipping_address_collection?: {
    allowed_countries: string[];
  };
  shipping_options?: Array<{
    shipping_rate_data: {
      type?: 'fixed_amount';
      fixed_amount: {
        amount: number;
        currency: string;
      };
      display_name: string;
      delivery_estimate?: {
        minimum?: {
          unit: string;
          value: number;
        };
        maximum?: {
          unit: string;
          value: number;
        };
      };
    };
  }>;
};

export type WebhookEvent = Stripe.Event & {
  data: {
    object: {
      metadata?: {
        orderId?: string;
        userId?: string;
        [key: string]: string | number | null | undefined;
      };
      id?: string;
      [key: string]: any;
    };
  };
};

export type ProcessedWebhookEvent = {
  id: string;
  type: string;
  processed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCheckoutSessionOptions = {
  orderId: string;
  userId: string;
  customerEmail?: string;
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        metadata?: Record<string, string>;
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  metadata?: Record<string, string | number | null>;
  successUrl: string;
  cancelUrl: string;
  shippingRates?: string[];
  allowPromotionCodes?: boolean;
};
