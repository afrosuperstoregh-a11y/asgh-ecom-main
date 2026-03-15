import { supabase } from './lib/supabase-client'

// Diagnostic script to check Supabase data and images
async function diagnoseSupabaseData() {
  console.log('🔍 Diagnosing Supabase data...')
  
  try {
    // Check products
    console.log('\n📦 Checking Products:')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        status,
        featured,
        image,
        image_path,
        images,
        category_id,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('status', 'active')
      .limit(5)
    
    if (productsError) {
      console.error('❌ Products error:', productsError)
    } else {
      console.log(`✅ Found ${products?.length || 0} products`)
      products?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`)
        console.log(`     - Image: ${product.image || 'None'}`)
        console.log(`     - Image Path: ${product.image_path || 'None'}`)
        console.log(`     - Images Array: ${product.images?.length || 0} items`)
        console.log(`     - Category: ${product.categories?.name || 'None'}`)
      })
    }
    
    // Check categories
    console.log('\n📂 Checking Categories:')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        image,
        image_path,
        image_url,
        is_active
      `)
      .limit(5)
    
    if (categoriesError) {
      console.error('❌ Categories error:', categoriesError)
    } else {
      console.log(`✅ Found ${categories?.length || 0} categories`)
      categories?.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name}`)
        console.log(`     - Image: ${category.image || 'None'}`)
        console.log(`     - Image Path: ${category.image_path || 'None'}`)
        console.log(`     - Image URL: ${category.image_url || 'None'}`)
      })
    }
    
    // Test image URL generation
    console.log('\n🖼️ Testing Image URL Generation:')
    if (products && products.length > 0) {
      const { getProductImageUrl } = await import('./lib/supabase-storage')
      const firstProduct = products[0]
      
      if (firstProduct.image) {
        const imageUrl = await getProductImageUrl(firstProduct.image)
        console.log(`  Product Image URL: ${imageUrl}`)
      }
      
      if (firstProduct.images && firstProduct.images.length > 0) {
        console.log(`  First image from array: ${firstProduct.images[0]}`)
        const arrayImageUrl = await getProductImageUrl(firstProduct.images[0])
        console.log(`  Array Image URL: ${arrayImageUrl}`)
      }
    }
    
    // Check storage buckets
    console.log('\n📦 Checking Storage Buckets:')
    const { data: buckets } = await supabase.storage.listBuckets()
    console.log('Available buckets:', buckets?.map(b => b.name).join(', ') || 'None')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

// Run the diagnostic
diagnoseSupabaseData()
