const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStationeryCategory() {
  try {
    console.log('🔍 Creating Stationery category...');
    
    // Check if stationery category already exists
    const { data: existingCat, error: checkError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', 'stationery')
      .single();
    
    if (existingCat) {
      console.log('✅ Stationery category already exists:', existingCat.name);
      return existingCat;
    }
    
    // Create stationery category
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        name: 'Stationery',
        slug: 'stationery',
        description: 'Office supplies, notebooks, pens, and other stationery items',
        image_url: 'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/category-images/stationery.jpg',
        is_active: true,
        sort_order: 11
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating stationery category:', createError.message);
      throw createError;
    }
    
    console.log('✅ Stationery category created:', newCategory.name);
    console.log('   ID:', newCategory.id);
    console.log('   Slug:', newCategory.slug);
    
    return newCategory;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function addStationeryProducts(categoryId) {
  try {
    console.log('\n🔍 Adding stationery products...');
    
    const stationeryProducts = [
      {
        name: 'Premium Notebook Set',
        slug: 'premium-notebook-set',
        description: 'Set of 3 premium notebooks with lined pages',
        short_description: 'Set of 3 premium notebooks',
        price: 45.00,
        category_id: categoryId,
        inventory_quantity: 50,
        images: ['stationery/notebook-set.jpg'],
        status: 'active',
        sku: 'STAT-001',
        track_inventory: true,
        requires_shipping: true
      },
      {
        name: 'Gel Pen Collection',
        slug: 'gel-pen-collection',
        description: 'Set of 12 colorful gel pens',
        short_description: 'Set of 12 colorful gel pens',
        price: 25.00,
        category_id: categoryId,
        inventory_quantity: 100,
        images: ['stationery/gel-pens.jpg'],
        status: 'active',
        sku: 'STAT-002',
        track_inventory: true,
        requires_shipping: true
      },
      {
        name: 'Desk Organizer',
        slug: 'desk-organizer',
        description: 'Wooden desk organizer for office supplies',
        short_description: 'Wooden desk organizer',
        price: 65.00,
        category_id: categoryId,
        inventory_quantity: 30,
        images: ['stationery/desk-organizer.jpg'],
        status: 'active',
        sku: 'STAT-003',
        track_inventory: true,
        requires_shipping: true
      },
      {
        name: 'Sticky Notes Pack',
        slug: 'sticky-notes-pack',
        description: 'Pack of 6 colorful sticky note pads',
        short_description: 'Pack of 6 sticky note pads',
        price: 15.00,
        category_id: categoryId,
        inventory_quantity: 80,
        images: ['stationery/sticky-notes.jpg'],
        status: 'active',
        sku: 'STAT-004',
        track_inventory: true,
        requires_shipping: true
      },
      {
        name: 'Professional Calculator',
        slug: 'professional-calculator',
        description: 'Scientific calculator for students and professionals',
        short_description: 'Scientific calculator',
        price: 85.00,
        category_id: categoryId,
        inventory_quantity: 40,
        images: ['stationery/calculator.jpg'],
        status: 'active',
        sku: 'STAT-005',
        track_inventory: true,
        requires_shipping: true
      }
    ];
    
    for (const product of stationeryProducts) {
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error adding product:', product.name, insertError.message);
      } else {
        console.log(`✅ Added: ${newProduct.name} (GHS ${newProduct.price})`);
      }
    }
    
    console.log('\n✅ Stationery products added successfully');
    
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const category = await createStationeryCategory();
    await addStationeryProducts(category.id);
    console.log('\n🎉 Stationery category and products created successfully!');
  } catch (error) {
    console.error('\n❌ Failed to create stationery category:', error.message);
    process.exit(1);
  }
}

main();
