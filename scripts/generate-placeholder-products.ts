#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to generate product name from filename
function generateProductName(filename: string): string {
  // Remove file extension and convert to title case
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
  return nameWithoutExt
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to generate slug from name with conflict resolution
function generateSlug(name: string, existingSlugs: Set<string> = new Set()): string {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// Helper function to generate random price
function generateRandomPrice(): number {
  return Math.floor(Math.random() * 200) + 10 // $10 - $210
}

// Helper function to generate random stock
function generateRandomStock(): number {
  return Math.floor(Math.random() * 96) + 5 // 5 - 100
}

// Helper function to generate SKU
function generateSKU(name: string): string {
  const prefix = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
  const suffix = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `${prefix}${suffix}`
}

// Recursive function to get all image files from bucket
async function getAllImageFiles(bucket: string, path: string = ''): Promise<{ name: string; path: string }[]> {
  const allFiles: { name: string; path: string }[] = []
  
  try {
    const { data: items, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit: 1000 })
    
    if (error) {
      console.error(`❌ Error listing ${path}:`, error)
      return allFiles
    }
    
    if (!items || items.length === 0) {
      return allFiles
    }
    
    for (const item of items) {
      const itemPath = path ? `${path}/${item.name}` : item.name
      
      if (item.id) {
        // It's a file, add to our list
        allFiles.push({ name: item.name, path: itemPath })
      } else {
        // It's a folder, recurse into it
        const subFiles = await getAllImageFiles(bucket, itemPath)
        allFiles.push(...subFiles)
      }
    }
  } catch (error) {
    console.error(`❌ Error exploring ${path}:`, error)
  }
  
  return allFiles
}

// Main function to generate placeholder products
async function generatePlaceholderProducts() {
  console.log('🚀 Starting placeholder product generation...')
  
  try {
    // Step 1: Get all image files recursively from the product-images bucket
    console.log('📁 Fetching images from Supabase Storage...')
    const allFiles = await getAllImageFiles('product-images')
    
    if (allFiles.length === 0) {
      console.log('📸 No images found in the product-images bucket')
      return
    }
    
    console.log(`📸 Found ${allFiles.length} images in bucket`)
    
    // Step 2: Get existing products to check for duplicates
    console.log('🔍 Checking for existing products...')
    const { data: existingProducts, error: existingError } = await supabase
      .from('products')
      .select('slug, images')
    
    if (existingError) {
      console.error('❌ Error fetching existing products:', existingError)
      return
    }
    
    // Create sets for quick lookup
    const existingImageUrls = new Set<string>()
    const existingSlugs = new Set<string>()
    
    if (existingProducts) {
      existingProducts.forEach((product: any) => {
        // Add slug to existing slugs set
        if (product.slug) {
          existingSlugs.add(product.slug)
        }
        
        // Add image URLs to existing image URLs set
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img: any) => {
            if (typeof img === 'string') {
              existingImageUrls.add(img)
            } else if (img.url) {
              existingImageUrls.add(img.url)
            }
          })
        }
      })
    }
    
    console.log(`📊 Found ${existingImageUrls.size} existing products with images and ${existingSlugs.size} existing slugs`)
    
    // Step 3: Get categories for random assignment
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .eq('is_active', true)
      .limit(10)
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError)
      return
    }
    
    const categoryIds = categories?.map((cat: any) => cat.id) || []
    console.log(`📂 Found ${categoryIds.length} active categories`)
    
    // Step 4: Process each image and create product data
    const productsToInsert = []
    let skippedCount = 0
    
    for (const file of allFiles) {
      // Generate public URL for the image
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${file.path}`
      
      // Check if product already exists with this image
      if (existingImageUrls.has(imageUrl)) {
        skippedCount++
        continue
      }
      
      // Generate product data
      const productName = generateProductName(file.name)
      const slug = generateSlug(productName, existingSlugs)
      
      // Add the new slug to existing slugs to avoid conflicts within this batch
      existingSlugs.add(slug)
      
      const productData = {
        name: productName,
        slug: slug,
        description: `High quality ${productName.toLowerCase()} - perfect for everyday use. Made with premium materials and attention to detail.`,
        short_description: `Premium ${productName.toLowerCase()} with excellent quality.`,
        sku: generateSKU(productName),
        price: generateRandomPrice(),
        compare_price: generateRandomPrice() + 20,
        cost_price: generateRandomPrice() - 5,
        weight: Math.floor(Math.random() * 1000) + 100, // 100g - 1100g
        dimensions: `${Math.floor(Math.random() * 30) + 10}x${Math.floor(Math.random() * 30) + 10}x${Math.floor(Math.random() * 20) + 5}cm`,
        category_id: categoryIds.length > 0 ? categoryIds[Math.floor(Math.random() * categoryIds.length)] : null,
        vendor_id: null,
        images: JSON.stringify([{ url: imageUrl, alt: productName }]),
        videos: JSON.stringify([]),
        tags: JSON.stringify([productName.toLowerCase().replace(' ', '-'), 'premium', 'quality']),
        inventory_quantity: generateRandomStock(),
        track_inventory: true,
        allow_backorder: false,
        requires_shipping: true,
        is_digital: false,
        status: 'active',
        featured: Math.random() > 0.8, // 20% chance of being featured
        seo_title: `${productName} - Afro Superstore`,
        seo_description: `Shop ${productName} at Afro Superstore. Premium quality products at great prices.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      productsToInsert.push(productData)
    }
    
    console.log(`📝 Generated ${productsToInsert.length} new products`)
    console.log(`⏭️  Skipped ${skippedCount} duplicates`)
    
    // Step 5: Insert products in batches
    if (productsToInsert.length === 0) {
      console.log('✅ No new products to insert')
      return
    }
    
    console.log('💾 Inserting products into database...')
    
    const batchSize = 10
    let insertedCount = 0
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize)
      
      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(batch)
        .select('id, name')
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
        continue
      }
      
      insertedCount += batch.length
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productsToInsert.length / batchSize)} inserted (${batch.length} products)`)
    }
    
    console.log('\n🎉 Placeholder product generation completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Total images found: ${allFiles.length}`)
    console.log(`   - Products created: ${insertedCount}`)
    console.log(`   - Duplicates skipped: ${skippedCount}`)
    console.log(`   - Total products in database: ${existingImageUrls.size + insertedCount}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
generatePlaceholderProducts()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

export { generatePlaceholderProducts }
