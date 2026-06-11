/**
 * Product Image Data Repair Script
 * 
 * Automatically repairs invalid product image records:
 * - Converts image strings into arrays
 * - Encodes invalid storage paths
 * - Removes empty image entries
 * - Preserves existing valid URLs
 * 
 * Usage:
 *   npx tsx scripts/fix-product-image-data.ts --dry-run
 *   npx tsx scripts/fix-product-image-data.ts --execute
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

interface RepairResult {
  productId: number;
  productName: string;
  before: any;
  after: any;
  action: string;
}

const results: RepairResult[] = [];

/**
 * Encodes a storage path properly
 */
function encodeStoragePath(path: string): string {
  const parts = path.split('/');
  const encodedParts = parts.map(part => encodeURIComponent(part));
  return encodedParts.join('/');
}

/**
 * Checks if a URL has unencoded special characters in the path
 */
function hasUnencodedChars(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathOnly = urlObj.pathname.split(/[?#]/)[0];
    
    // Check for unencoded special characters that should be encoded
    return /[&]/.test(pathOnly);
  } catch {
    return false;
  }
}

/**
 * Fixes unencoded special characters in a URL
 * Only fixes if the URL has unencoded characters, otherwise returns as-is
 */
function fixUrlEncoding(url: string): string {
  // Only fix if URL has unencoded characters
  if (!hasUnencodedChars(url)) {
    return url; // Already properly encoded
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find the bucket index
    const bucketIndex = pathParts.indexOf('product-images');
    if (bucketIndex === -1) return url;
    
    // Keep everything up to and including the bucket name
    const prefix = pathParts.slice(0, bucketIndex + 1).join('/');
    // Encode the remaining path parts
    const suffix = pathParts.slice(bucketIndex + 1).map(encodeURIComponent).join('/');
    
    // Reconstruct the URL
    urlObj.pathname = `${prefix}/${suffix}`;
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Repairs a product's images field
 */
function repairProductImages(product: any): { repaired: any; action: string } {
  const originalImages = product.images;
  let repairedImages = originalImages;
  let action = 'no_change';

  // Case 1: images is a string instead of array
  if (typeof originalImages === 'string') {
    repairedImages = [originalImages];
    action = 'converted_string_to_array';
  }
  // Case 2: images is not an array and not null
  else if (originalImages !== null && !Array.isArray(originalImages)) {
    repairedImages = [];
    action = 'removed_invalid_type';
  }
  // Case 3: images is an array
  else if (Array.isArray(originalImages)) {
    // Remove empty/invalid entries
    const cleanedImages = originalImages.filter((img: any) => {
      if (!img || typeof img !== 'string') return false;
      if (img.trim() === '' || img === 'undefined' || img === 'null') return false;
      return true;
    });

    // Fix URL encoding for each image
    const encodedImages = cleanedImages.map((img: string) => fixUrlEncoding(img));

    if (cleanedImages.length !== originalImages.length) {
      action = 'removed_invalid_entries';
    }
    
    // Check if any URLs were re-encoded
    const urlsChanged = cleanedImages.some((img: string, idx: number) => img !== encodedImages[idx]);
    if (urlsChanged) {
      action = action === 'removed_invalid_entries' ? 'cleaned_and_reencoded' : 'reencoded_urls';
    }

    repairedImages = encodedImages;
  }

  return { repaired: repairedImages, action };
}

async function fixProductImageData() {
  console.log('🔧 Fixing Product Image Data');
  console.log(`📋 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');

    if (error) throw error;

    console.log(`📊 Total products: ${products.length}\n`);

    for (const product of products) {
      const { repaired, action } = repairProductImages(product);

      // Only record if changes were made
      if (action !== 'no_change') {
        results.push({
          productId: product.id,
          productName: product.name,
          before: product.images,
          after: repaired,
          action,
        });

        console.log(`📝 [${product.name}] (ID: ${product.id})`);
        console.log(`   Action: ${action}`);
        console.log(`   Before: ${JSON.stringify(product.images)}`);
        console.log(`   After:  ${JSON.stringify(repaired)}`);
        console.log('');

        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: repaired })
            .eq('id', product.id);

          if (updateError) {
            console.error(`   ❌ Update failed: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated successfully`);
          }
          console.log('');
        }
      }
    }

    // Generate report
    console.log('='.repeat(80));
    console.log('📊 REPAIR REPORT');
    console.log('='.repeat(80));
    console.log(`Total products processed: ${products.length}`);
    console.log(`Products repaired: ${results.length}`);
    console.log(`Actions taken:`);

    const actionCounts = results.reduce((acc, r) => {
      acc[r.action] = (acc[r.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`  - ${action}: ${count}`);
    });

    console.log('');

    if (DRY_RUN) {
      console.log('⚠️  This was a DRY RUN. No changes were made to the database.');
      console.log('   Run with --execute flag to apply changes:');
      console.log('   npx tsx scripts/fix-product-image-data.ts --execute');
    } else {
      console.log('✅ All repairs applied successfully.');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Repair error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

fixProductImageData();
