/**
 * Supabase Storage Verification Script
 * 
 * Verifies that all product image URLs reference existing files in Supabase Storage
 * 
 * Usage:
 *   npx tsx scripts/verify-storage-images.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VerificationResult {
  found: number;
  missing: number;
  orphaned: number;
  invalid: number;
  details: Array<{
    productId: number;
    productName: string;
    imageUrl: string;
    status: 'found' | 'missing' | 'invalid';
  }>;
}

const result: VerificationResult = {
  found: 0,
  missing: 0,
  orphaned: 0,
  invalid: 0,
  details: [],
};

/**
 * Extracts storage path from a Supabase Storage URL
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /storage/v1/object/public/{bucket}/{path}
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
      return null;
    }
    
    const path = pathParts.slice(publicIndex + 2).join('/');
    return path;
  } catch {
    return null;
  }
}

/**
 * Checks if a file exists in Supabase Storage
 */
async function fileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        limit: 100,
        search: path.split('/').pop()
      });
    
    if (error) return false;
    
    // Check if the specific file exists in the results
    const fileName = path.split('/').pop();
    return data?.some(file => file.name === fileName) || false;
  } catch {
    return false;
  }
}

async function verifyStorageImages() {
  console.log('🔍 Verifying Supabase Storage Images\n');
  
  try {
    // Get all products with images
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .not('images', 'is', null);
    
    if (error) throw error;
    
    console.log(`📊 Products with images: ${products.length}\n`);
    
    for (const product of products) {
      if (!product.images || !Array.isArray(product.images)) continue;
      
      for (const imageUrl of product.images) {
        if (!imageUrl || typeof imageUrl !== 'string') continue;
        
        const storagePath = extractStoragePath(imageUrl);
        
        if (!storagePath) {
          result.invalid++;
          result.details.push({
            productId: product.id,
            productName: product.name,
            imageUrl,
            status: 'invalid',
          });
          continue;
        }
        
        // Check if file exists (sample check - not all files for performance)
        // For a full check, you would need to implement proper pagination
        const exists = await fileExists('product-images', storagePath);
        
        if (exists) {
          result.found++;
          result.details.push({
            productId: product.id,
            productName: product.name,
            imageUrl,
            status: 'found',
          });
        } else {
          result.missing++;
          result.details.push({
            productId: product.id,
            productName: product.name,
            imageUrl,
            status: 'missing',
          });
        }
      }
    }
    
    // Generate report
    console.log('='.repeat(80));
    console.log('📊 STORAGE VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log(`Found: ${result.found}`);
    console.log(`Missing: ${result.missing}`);
    console.log(`Invalid: ${result.invalid}`);
    console.log(`Total checked: ${result.details.length}\n`);
    
    if (result.missing > 0) {
      console.log('🚨 MISSING FILES:\n');
      const missing = result.details.filter(d => d.status === 'missing');
      missing.slice(0, 10).forEach((item, idx) => {
        console.log(`  ${idx + 1}. [${item.productName}] (ID: ${item.productId})`);
        console.log(`     ${item.imageUrl}`);
      });
      
      if (missing.length > 10) {
        console.log(`  ... and ${missing.length - 10} more`);
      }
      console.log('');
    }
    
    if (result.invalid > 0) {
      console.log('⚠️  INVALID URLs:\n');
      const invalid = result.details.filter(d => d.status === 'invalid');
      invalid.forEach((item, idx) => {
        console.log(`  ${idx + 1}. [${item.productName}] (ID: ${item.productId})`);
        console.log(`     ${item.imageUrl}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Verification error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

verifyStorageImages();
