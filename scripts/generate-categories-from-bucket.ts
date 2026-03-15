import { supabase } from '../backend/dist/lib/supabase/server.js'
import categoryService from '../backend/dist/services/categoryService.js'

// Helper function to convert filename to readable category name
function filenameToCategoryName(filename: string): string {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '')
  
  // Convert hyphens and underscores to spaces and capitalize each word
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

// Helper function to convert filename to slug
function filenameToSlug(filename: string): string {
  // Remove file extension and convert to lowercase with hyphens
  return filename
    .replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Main function to generate categories from bucket images
export async function generateCategoriesFromBucket(): Promise<{
  success: boolean
  message: string
  created: number
  skipped: number
  errors: string[]
}> {
  const errors: string[] = []
  let created = 0
  let skipped = 0

  try {
    console.log('🖼️  Starting category generation from bucket...')
    
    // Step 1: List all files in category-images bucket
    const { data: files, error: listError } = await supabase()
      .storage
      .from('category-images')
      .list('', {
        limit: 1000, // Adjust based on expected number of images
        search: undefined // Get all files
      })

    if (listError) {
      console.error('❌ Error listing bucket files:', listError)
      errors.push(`Failed to list bucket files: ${listError.message}`)
      return {
        success: false,
        message: 'Failed to access bucket',
        created,
        skipped,
        errors
      }
    }

    if (!files || files.length === 0) {
      console.log('📸 No images found in category-images bucket')
      return {
        success: true,
        message: 'No images found in bucket',
        created,
        skipped,
        errors
      }
    }

    console.log(`📸 Found ${files.length} images in bucket`)

    // Step 2: Get existing categories to check for duplicates
    console.log('🔍 Checking for existing categories...')
    const { data: existingCategories, error: existingError } = await supabase()
      .from('categories')
      .select('slug')

    if (existingError) {
      console.error('❌ Error fetching existing categories:', existingError)
      errors.push(`Failed to fetch existing categories: ${existingError.message}`)
      return {
        success: false,
        message: 'Failed to check existing categories',
        created,
        skipped,
        errors
      }
    }

    // Create set for quick lookup
    const existingSlugs = new Set(
      (existingCategories as any[])?.map(cat => cat.slug) || []
    )

    // Step 3: Process each image file
    console.log('🔄 Processing images...')
    for (const file of files) {
      try {
        if (!file.name) {
          console.warn('⚠️  Skipping file without name')
          continue
        }

        // Skip if not an image file
        if (!/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)) {
          console.log(`⏭️  Skipping non-image file: ${file.name}`)
          continue
        }

        const slug = filenameToSlug(file.name)
        
        // Check if category already exists
        if (existingSlugs.has(slug)) {
          console.log(`⏭️  Category already exists, skipping: ${slug}`)
          skipped++
          continue
        }

        // Generate category data
        const categoryName = filenameToCategoryName(file.name)
        const imageUrl = file.name // Store just the filename, service will transform to full URL

        console.log(`📝 Creating category: ${categoryName} (${slug})`)

        // Create category using existing service
        const result = await categoryService.createCategory({
          name: categoryName,
          image_url: imageUrl,
          description: `Products in ${categoryName} category`,
          sort_order: created + 1, // Auto-increment sort order
          is_active: true
        }, 'system') // Use 'system' as created_by for auto-generated categories

        if (result.success) {
          console.log(`✅ Created category: ${categoryName}`)
          created++
          existingSlugs.add(slug) // Add to set to prevent duplicates in this run
        } else {
          console.error(`❌ Failed to create category ${categoryName}:`, result)
          errors.push(`Failed to create ${categoryName}: ${JSON.stringify(result)}`)
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Error processing file ${file.name}:`, errorMessage)
        errors.push(`Error processing ${file.name}: ${errorMessage}`)
      }
    }

    console.log(`🎉 Category generation complete! Created: ${created}, Skipped: ${skipped}`)

    return {
      success: true,
      message: `Category generation completed. Created ${created} new categories, skipped ${skipped} existing ones.`,
      created,
      skipped,
      errors
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Unexpected error in generateCategoriesFromBucket:', errorMessage)
    errors.push(`Unexpected error: ${errorMessage}`)
    
    return {
      success: false,
      message: 'Unexpected error during category generation',
      created,
      skipped,
      errors
    }
  }
}

// CLI function for direct execution
export async function runCategoryGeneration() {
  console.log('🚀 Starting automatic category generation from Supabase bucket...')
  
  const result = await generateCategoriesFromBucket()
  
  console.log('\n📊 RESULTS:')
  console.log(`✅ Success: ${result.success}`)
  console.log(`📝 Message: ${result.message}`)
  console.log(`🆕 Created: ${result.created}`)
  console.log(`⏭️  Skipped: ${result.skipped}`)
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  return result
}

// Run if executed directly
if (require.main === module) {
  runCategoryGeneration()
    .then(() => {
      console.log('\n🎉 Category generation script completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}
