-- +migrate Up
-- SQL in this section is executed when the migration is applied
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  carrier VARCHAR(50) NOT NULL DEFAULT 'CANADA_POST',
  service_name VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100) NOT NULL,
  label_url TEXT,
  cost DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order
    FOREIGN KEY (order_id) 
    REFERENCES orders(id)
    ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +migrate Down
-- SQL in this section is executed when the migration is rolled back
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS shipments;
