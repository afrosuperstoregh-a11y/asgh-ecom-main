// Simple test to verify Supabase Storage functionality
import { getProductImageUrl, getCategoryImageUrl } from './lib/supabase-storage.js';

// Test the storage functions directly
console.log('Testing Supabase Storage functions...');

// Test product image URL
getProductImageUrl('test-product.jpg')
  .then(url => {
    console.log('✓ Product image URL:', url);
  })
  .catch(error => {
    console.log('✗ Product image error:', error.message);
  });

// Test category image URL  
getCategoryImageUrl('test-category.jpg')
  .then(url => {
    console.log('✓ Category image URL:', url);
  })
  .catch(error => {
    console.log('✗ Category image error:', error.message);
  });

// Test fallback
getProductImageUrl('')
  .then(url => {
    console.log('✓ Fallback URL:', url);
  })
  .catch(error => {
    console.log('✗ Fallback error:', error.message);
  });

export {};
