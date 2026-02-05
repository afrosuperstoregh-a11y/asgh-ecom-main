-- Add videos column to products table
-- This migration adds support for product videos

ALTER TABLE products 
ADD COLUMN videos JSONB DEFAULT '[]';

-- Add index for better performance on videos queries
CREATE INDEX IF NOT EXISTS idx_products_videos ON products USING GIN (videos);

-- Add comment
COMMENT ON COLUMN products.videos IS 'Array of video URLs for product demonstrations';
