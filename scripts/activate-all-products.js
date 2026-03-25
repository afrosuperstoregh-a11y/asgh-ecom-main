import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function activateAllProducts() {
  try {
    console.log('Starting to activate all products...');
    
    // First, get all products to see current statuses
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      process.exit(1);
    }

    console.log(`Found ${products.length} products`);
    
    // Count products by status
    const statusCounts = {};
    products.forEach(product => {
      const status = product.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Current status breakdown:', statusCounts);
    
    // Update all products to have status = 'active'
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'active' })
      .neq('status', 'active'); // Only update products that don't already have 'active' status

    if (updateError) {
      console.error('Error updating products:', updateError);
      process.exit(1);
    }

    console.log('✅ Successfully activated all products!');
    
    // Verify the update
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('status')
      .eq('status', 'active');

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      process.exit(1);
    }

    console.log(`✅ Verification: ${updatedProducts.length} products now have active status`);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

activateAllProducts();
