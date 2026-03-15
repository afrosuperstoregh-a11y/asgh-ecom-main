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
  console.error('')
  console.error('Please set these environment variables and ensure Supabase is running locally.')
  console.error('Example:')
  console.error('  $env:SUPABASE_URL="http://127.0.0.1:54321"')
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  process.exit(1)
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to generate category name from filename
function generateCategoryName(filename: string): string {
  // Remove file extension and convert to title case
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
  return nameWithoutExt
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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

// Main function to generate placeholder categories
async function generatePlaceholderCategories() {
  console.log('🚀 Starting placeholder category generation...')
  console.log(`📡 Connecting to Supabase at: ${supabaseUrl}`)
  
  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase.from('category').select('count').limit(1)
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError)
      console.error('')
      console.error('Please ensure:')
      console.error('1. Supabase is running locally')
      console.error('2. Environment variables are correct')
      console.error('3. Service role key is valid')
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')
    // Step 1: Get all image files recursively from the category-images bucket
    console.log('📁 Fetching images from Supabase Storage...')
    const allFiles = await getAllImageFiles('category-images')
    
    if (allFiles.length === 0) {
      console.log('📸 No images found in the category-images bucket')
      console.log('')
      console.log('Make sure:')
      console.log('1. The category-images bucket exists')
      console.log('2. Images are uploaded to the bucket')
      console.log('3. Service role key has storage permissions')
      return
    }
    
    console.log(`📸 Found ${allFiles.length} images in bucket`)
    
    // Step 2: Get existing categories to check for duplicates
    console.log('🔍 Checking for existing categories...')
    const { data: existingCategories, error: existingError } = await supabase
      .from('category')
      .select('slug')
    
    if (existingError) {
      console.error('❌ Error fetching existing categories:', existingError)
      return
    }
    
    // Create a set of existing slugs for quick lookup
    const existingSlugs = new Set(existingCategories?.map((cat: any) => cat.slug) || [])
    console.log(`📊 Found ${existingSlugs.size} existing categories`)
    
    // Step 3: Process each image and create category data
    const categoriesToInsert = []
    let skippedCount = 0
    
    for (const file of allFiles) {
      // Generate category data
      const categoryName = generateCategoryName(file.name)
      const slug = generateSlug(categoryName)
      
      // Check if category already exists with this slug
      if (existingSlugs.has(slug)) {
        skippedCount++
        continue
      }
      
      // Generate public URL for the image
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/category-images/${file.path}`
      
      const categoryData = {
        id: uuidv4(),
        name: categoryName,
        slug: slug,
        description: `Browse our collection of ${categoryName.toLowerCase()} products.`,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      }
      
      categoriesToInsert.push(categoryData)
    }
    
    console.log(`📝 Generated ${categoriesToInsert.length} new categories`)
    console.log(`⏭️  Skipped ${skippedCount} duplicates`)
    
    // Step 4: Insert categories in batches
    if (categoriesToInsert.length === 0) {
      console.log('✅ No new categories to insert')
      return
    }
    
    console.log('💾 Inserting categories into database...')
    
    const batchSize = 10
    let insertedCount = 0
    
    for (let i = 0; i < categoriesToInsert.length; i += batchSize) {
      const batch = categoriesToInsert.slice(i, i + batchSize)
      
      const { data: insertedCategories, error: insertError } = await supabase
        .from('category')
        .insert(batch)
        .select('id, name')
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError)
        continue
      }
      
      insertedCount += batch.length
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(categoriesToInsert.length / batchSize)} inserted (${batch.length} categories)`)
    }
    
    console.log('\n🎉 Placeholder category generation completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Total images found: ${allFiles.length}`)
    console.log(`   - Categories created: ${insertedCount}`)
    console.log(`   - Duplicates skipped: ${skippedCount}`)
    console.log(`   - Total categories in database: ${existingSlugs.size + insertedCount}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
generatePlaceholderCategories()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

export { generatePlaceholderCategories }
