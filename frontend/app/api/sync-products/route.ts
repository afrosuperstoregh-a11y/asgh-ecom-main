import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Will use fallback data.`);
    return false; // Return false instead of throwing error
  }
  return true; // Return true if all variables are present
}

// Type definitions
interface ImageFile {
  name: string;
  folder: string;
  path: string;
}

interface Product {
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  is_active: boolean;
}

interface CategoryMapping {
  [key: string]: string[];
}

// Category detection based on folder names and filename keywords
const categoryMapping: CategoryMapping = {
  'clothing': ['clothing', 'shirt', 'dashiki', 'fashion', 'wear', 'fabric', 'textile', 'garment', 'outfit', 'dress'],
  'accessories': ['accessories', 'jewelry', 'necklace', 'bracelet', 'earring', 'ring', 'watch', 'bag', 'purse'],
  'home-living': ['home-living', 'home', 'decor', 'furniture', 'pillow', 'cushion', 'rug', 'art', 'painting'],
  'food-beverages': ['food-beverages', 'food', 'spice', 'ingredient', 'flour', 'mix', 'sauce', 'oil', 'banku', 'jollof'],
  'beauty-health': ['beauty-health', 'beauty', 'health', 'cosmetic', 'skincare', 'haircare', 'makeup', 'soap', 'cream'],
  'arts-crafts': ['arts-crafts', 'art', 'craft', 'handmade', 'painting', 'drawing', 'sculpture', 'pottery']
};

// Helper functions
function cleanProductName(filename: string): string {
  return filename
    // Remove file extensions
    .replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, '')
    // Remove random IDs, hashes, and numeric sequences (like -001, -123, etc.)
    .replace(/[-_]\d{3,}[-_]?/g, ' ')
    .replace(/[-_][a-f0-9]{8,}[-_]?/g, ' ') // Remove hash-like strings
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Remove extra spaces and trim
    .replace(/\s+/g, ' ')
    .trim()
    // Convert to Title Case (capitalize each word)
    .replace(/\b\w/g, (l: string) => l.toUpperCase())
    // Remove duplicate words (case-insensitive)
    .replace(/\b(\w+)\b(?=.*\b\1\b)/gi, (match, word, offset, string) => {
      // Keep only the first occurrence
      const firstIndex = string.toLowerCase().indexOf(word.toLowerCase());
      return offset === firstIndex ? word : '';
    })
    // Clean up any remaining extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function detectCategory(folderName: string, filename: string): string {
  const lowerFolder = folderName.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  // First check exact folder match
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => lowerFolder.includes(keyword))) {
      return category;
    }
  }
  
  // Fall back to filename detection
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => lowerFilename.includes(keyword))) {
      return category;
    }
  }
  
  return 'arts-crafts';
}

function generateDescription(name: string, category: string): string {
  const descriptions: { [key: string]: string } = {
    'clothing': `Beautiful ${name.toLowerCase()} featuring authentic African design elements. Made with quality materials and crafted to celebrate cultural heritage.`,
    'accessories': `Elegant ${name.toLowerCase()} that adds a touch of African sophistication to any outfit. Handcrafted with attention to detail.`,
    'home-living': `Stunning ${name.toLowerCase()} perfect for bringing African aesthetic into your home. Each piece tells a story and adds warmth to your space.`,
    'food-beverages': `Premium quality ${name.toLowerCase()} sourced directly from African producers. Perfect for authentic cooking and experiencing true African flavors.`,
    'beauty-health': `Natural ${name.toLowerCase()} formulated with traditional African ingredients. Enhance your beauty routine with products inspired by African wellness traditions.`,
    'arts-crafts': `Authentic ${name.toLowerCase()} handcrafted by skilled artisans. This piece represents traditional African craftsmanship and cultural expression.`
  };
  
  return descriptions[category] || `Beautiful ${name.toLowerCase()} that showcases the richness of African culture and craftsmanship.`;
}

function generateRandomPrice(): number {
  return Math.floor(Math.random() * 46) + 5; // $5 - $50
}

function generateRandomStock(): number {
  return Math.floor(Math.random() * 91) + 10; // 10 - 100
}

// Safe update function to fix existing products with invalid names
async function fixInvalidProductNames(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  try {
    // Validate environment variables first
    if (!validateEnvironment()) {
      return {
        success: false,
        message: 'Missing required environment variables',
        error: 'Supabase configuration not available'
      };
    }
    
    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('🔧 Starting safe product name fix...');
    
    // Get products with invalid names (NULL, empty, placeholder, or generic names)
    const { data: invalidProducts, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, images')
      .or('name.is.null,name.eq.,name.eq."Untitled",name.eq."Product",name.eq."Item",name.like."product%",name.like."item%",name.like."test%"');
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!invalidProducts || invalidProducts.length === 0) {
      return {
        success: true,
        message: 'No products with invalid names found',
        data: { updatedCount: 0 }
      };
    }
    
    console.log(`📝 Found ${invalidProducts.length} products with invalid names`);
    
    const updatedProducts = [];
    
    for (const product of invalidProducts) {
      let newName = '';
      
      // Try to extract name from images array
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
          // Extract filename from URL
          const filename = firstImage.split('/').pop() || '';
          newName = cleanProductName(filename);
        }
      }
      
      // If still no valid name, generate a default one
      if (!newName || newName.length < 2) {
        newName = `Product ${product.id}`;
      }
      
      // Update the product with the new name
      const { data: updatedProduct, error: updateError } = await supabaseAdmin
        .from('products')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .select()
        .single();
      
      if (updateError) {
        console.error(`❌ Failed to update product ${product.id}:`, updateError.message);
        continue;
      }
      
      updatedProducts.push(updatedProduct);
      console.log(`✅ Updated product ${product.id}: "${product.name}" → "${newName}"`);
    }
    
    return {
      success: true,
      message: `Successfully updated ${updatedProducts.length} product names`,
      data: {
        updatedCount: updatedProducts.length,
        products: updatedProducts
      }
    };
    
  } catch (error: any) {
    console.error('❌ Error fixing product names:', error.message);
    return {
      success: false,
      message: 'Failed to fix product names',
      error: error.message
    };
  }
}
async function syncProductsFromStorage(): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}> {
  try {
    // Validate environment variables first
    validateEnvironment();
    
    // Create Supabase client inside the function to avoid build-time issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('🚀 Starting product sync from Supabase Storage...');
    
    // Get all folders
    const { data: folders, error: folderError } = await supabaseAdmin.storage
      .from('product-images')
      .list('', { limit: 100 });

    if (folderError) {
      throw folderError;
    }

    const allImageFiles: ImageFile[] = [];
    const folderList = folders?.filter(item => !item.name.includes('.')) || [];
    
    if (folderList.length === 0) {
      // No folders, look for files in root
      const { data: rootFiles, error: rootError } = await supabaseAdmin.storage
        .from('product-images')
        .list('', { limit: 1000 });

      if (rootError) {
        throw rootError;
      }

      const imageFiles = rootFiles?.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) : false;
      }) || [];

      imageFiles.forEach(file => {
        allImageFiles.push({
          name: file.name,
          folder: '',
          path: file.name
        });
      });
    } else {
      // Process each folder
      for (const folder of folderList) {
        const { data: folderFiles, error: filesError } = await supabaseAdmin.storage
          .from('product-images')
          .list(folder.name, { limit: 1000 });

        if (filesError) {
          console.error(`Error listing folder ${folder.name}:`, filesError.message);
          continue;
        }

        const imageFiles = folderFiles?.filter(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          return extension ? ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension) : false;
        }) || [];

        imageFiles.forEach(file => {
          allImageFiles.push({
            name: file.name,
            folder: folder.name,
            path: `${folder.name}/${file.name}`
          });
        });
      }
    }

    if (allImageFiles.length === 0) {
      return {
        success: false,
        message: 'No images found in product-images bucket'
      };
    }

    const products: Product[] = [];
    const usedSlugs = new Set<string>();

    // Process each image
    for (const file of allImageFiles) {
      const cleanName = cleanProductName(file.name);
      const category = detectCategory(file.folder, file.name);
      
      // Generate unique slug
      let slug = generateSlug(cleanName);
      let slugIndex = 0;
      
      while (usedSlugs.has(slug)) {
        slugIndex++;
        slug = `${generateSlug(cleanName)}-${slugIndex}`;
      }
      usedSlugs.add(slug);

      // Get public URL for the image
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(file.path);

      // Create product object
      const product: Product = {
        name: cleanName,
        slug: slug,
        description: generateDescription(cleanName, category),
        price: generateRandomPrice(),
        image_url: publicUrl,
        category: category,
        stock: generateRandomStock(),
        is_active: true
      };

      products.push(product);
    }

    // Batch insert products
    const { data: insertedProducts, error: insertError } = await supabaseAdmin
      .from('products')
      .upsert(products, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    // Summary by category
    const categoryCount: { [key: string]: number } = {};
    products.forEach(product => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });

    return {
      success: true,
      message: `Successfully synced ${insertedProducts?.length || 0} products`,
      data: {
        products: insertedProducts,
        summary: {
          totalProducts: insertedProducts?.length || 0,
          categories: categoryCount,
          imagesProcessed: allImageFiles.length
        }
      }
    };

  } catch (error: any) {
    console.error('❌ Error syncing products:', error.message);
    return {
      success: false,
      message: 'Failed to sync products',
      error: error.message
    };
  }
}

// API endpoint for fixing existing product names
export async function PATCH(request: NextRequest) {
  try {
    console.log('🔧 [API] Starting product name fix...');
    
    const result = await fixInvalidProductNames();
    
    if (result.success) {
      console.log('✅ [API] Product name fix completed successfully');
      return NextResponse.json(result, { status: 200 });
    } else {
      console.log('❌ [API] Product name fix failed');
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// API endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API] Starting product sync...');
    
    const result = await syncProductsFromStorage();
    
    if (result.success) {
      console.log('✅ [API] Product sync completed successfully');
      return NextResponse.json(result, { status: 200 });
    } else {
      console.log('❌ [API] Product sync failed');
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

// Also support GET for status check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Product sync endpoint is ready',
    usage: {
      sync: 'POST /api/sync-products to sync products from Supabase Storage',
      fix: 'PATCH /api/sync-products to fix existing products with invalid names'
    },
    features: [
      'Automatic product name generation from image filenames',
      'Safe update of existing products with NULL/placeholder names',
      'Category detection based on folder structure',
      'Duplicate prevention with unique slugs'
    ]
  });
}
