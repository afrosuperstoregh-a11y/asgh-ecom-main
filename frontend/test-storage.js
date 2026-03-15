// Test script to verify Supabase Storage image functionality
import { getProductImageUrl, getCategoryImageUrl } from '../lib/supabase-storage.js';

async function testImageUrls() {
  console.log('Testing Supabase Storage image URLs...\n');

  // Test product image URL
  try {
    const productImageUrl = await getProductImageUrl('test-product-image.jpg');
    console.log('✓ Product Image URL:', productImageUrl);
  } catch (error) {
    console.log('✗ Product Image URL Error:', error.message);
  }

  // Test category image URL
  try {
    const categoryImageUrl = await getCategoryImageUrl('test-category-image.jpg');
    console.log('✓ Category Image URL:', categoryImageUrl);
  } catch (error) {
    console.log('✗ Category Image URL Error:', error.message);
  }

  // Test empty path fallback
  try {
    const fallbackUrl = await getProductImageUrl('');
    console.log('✓ Fallback URL:', fallbackUrl);
  } catch (error) {
    console.log('✗ Fallback URL Error:', error.message);
  }

  console.log('\nTest completed!');
}

// Run the test
testImageUrls().catch(console.error);
