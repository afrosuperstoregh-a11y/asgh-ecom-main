-- Migration: Add payment provider and currency fields to orders table
-- Description: Update orders table to support multiple payment providers and GHS currency

-- Add payment_provider column
ALTER TABLE orders 
ADD COLUMN payment_provider VARCHAR(50) DEFAULT NULL;

-- Add currency column  
ALTER TABLE orders 
ADD COLUMN currency VARCHAR(3) DEFAULT 'GHS';

-- Add payment_reference column for transaction tracking
ALTER TABLE orders 
ADD COLUMN payment_reference VARCHAR(255) DEFAULT NULL;

-- Add payment_details column for JSON payment metadata
ALTER TABLE orders 
ADD COLUMN payment_details JSONB DEFAULT NULL;

-- Update existing orders to have GHS as default currency
UPDATE orders SET currency = 'GHS' WHERE currency IS NULL;

-- Add indexes for payment-related queries
CREATE INDEX idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX idx_orders_currency ON orders(currency);
CREATE INDEX idx_orders_payment_reference ON orders(payment_reference);

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_provider IS 'Payment provider used (stripe, paypal, paystack, etc.)';
COMMENT ON COLUMN orders.currency IS 'Currency code for the order (GHS, USD, etc.)';
COMMENT ON COLUMN orders.payment_reference IS 'Transaction reference from payment provider';
COMMENT ON COLUMN orders.payment_details IS 'JSON object containing payment metadata and details';

-- Create refund_requests table for Paystack refunds
CREATE TABLE IF NOT EXISTS refund_requests (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    payment_reference VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    processed_by VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for refund_requests
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_payment_reference ON refund_requests(payment_reference);

-- Add comments for refund_requests table
COMMENT ON TABLE refund_requests IS 'Table to track refund requests, especially for manual processing';
COMMENT ON COLUMN refund_requests.status IS 'Status of the refund request';
COMMENT ON COLUMN refund_requests.processed_by IS 'Admin user who processed the refund';
COMMENT ON COLUMN refund_requests.processed_at IS 'Timestamp when refund was processed';

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_requests_updated_at();

-- Set default payment_status for existing orders if not set
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Add constraint for payment_provider values
ALTER TABLE orders 
ADD CONSTRAINT check_payment_provider 
CHECK (payment_provider IS NULL OR payment_provider IN ('stripe', 'paypal', 'paystack', 'bank_transfer', 'cash_on_delivery'));

-- Add constraint for currency codes (ISO 4217)
ALTER TABLE orders 
ADD CONSTRAINT check_currency 
CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$');

-- Add constraint for payment_status values
ALTER TABLE orders 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IS NULL OR payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'));

-- Create a view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    payment_provider,
    currency,
    COUNT(*) as total_orders,
    SUM(total) as total_amount,
    SUM(CASE WHEN payment_status = 'completed' THEN total ELSE 0 END) as successful_amount,
    SUM(CASE WHEN payment_status = 'failed' THEN total ELSE 0 END) as failed_amount,
    AVG(total) as average_order_value
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', created_at), payment_provider, currency
ORDER BY month DESC;

COMMENT ON VIEW payment_analytics IS 'Analytics view for payment data by month, provider, and currency';
