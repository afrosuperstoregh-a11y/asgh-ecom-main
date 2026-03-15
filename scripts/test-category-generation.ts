#!/usr/bin/env ts-node

// Test script to verify the category generation logic without Supabase
import { v4 as uuidv4 } from 'uuid'

// Helper functions from the main script
function generateCategoryName(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
  return nameWithoutExt
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Mock data for testing
const mockFiles = [
  { name: 'electronics.jpg', path: 'electronics.jpg' },
  { name: 'home-appliances.png', path: 'home-appliances.png' },
  { name: 'mens-fashion.webp', path: 'mens-fashion.webp' },
  { name: 'womens_clothing.jpeg', path: 'womens_clothing.jpeg' },
  { name: 'sports-outdoor.png', path: 'sports-outdoor.png' }
]

const existingSlugs = new Set(['electronics', 'home-appliances'])

// Test the transformation logic
function testCategoryGeneration() {
  console.log('🧪 Testing category generation logic...')
  console.log('')
  
  const categoriesToInsert = []
  let skippedCount = 0
  
  for (const file of mockFiles) {
    const categoryName = generateCategoryName(file.name)
    const slug = generateSlug(categoryName)
    
    console.log(`📁 File: ${file.name}`)
    console.log(`   Name: ${categoryName}`)
    console.log(`   Slug: ${slug}`)
    
    if (existingSlugs.has(slug)) {
      console.log(`   ⏭️  Skipped (duplicate slug)`)
      skippedCount++
      continue
    }
    
    // Mock the category data generation
    const categoryData = {
      id: uuidv4(),
      name: categoryName,
      slug: slug,
      description: `Browse our collection of ${categoryName.toLowerCase()} products.`,
      image_url: `http://127.0.0.1:54321/storage/v1/object/public/category-images/${file.path}`,
      created_at: new Date().toISOString()
    }
    
    categoriesToInsert.push(categoryData)
    console.log(`   ✅ Generated category`)
    console.log(`   📝 Description: ${categoryData.description}`)
    console.log('')
  }
  
  console.log(`📊 Test Results:`)
  console.log(`   - Total mock files: ${mockFiles.length}`)
  console.log(`   - Categories generated: ${categoriesToInsert.length}`)
  console.log(`   - Duplicates skipped: ${skippedCount}`)
  console.log('')
  
  console.log('📋 Generated Categories:')
  categoriesToInsert.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (${cat.slug})`)
  })
  
  console.log('')
  console.log('✅ Category generation logic test completed successfully!')
}

// Run the test
testCategoryGeneration()
