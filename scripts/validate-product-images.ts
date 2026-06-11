/**
 * Product Image Data Validation Script
 * 
 * Validates product image data in the database for:
 * - Correct data types (array vs string)
 * - Valid URL formats
 * - Proper URL encoding
 * - Missing or broken URLs
 * 
 * Usage:
 *   npx tsx scripts/validate-product-images.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5ODU2MCwiZXhwIjoyMDg0ODc0NTYwfQ.A-gUiUyjt9XWxwB2mCfWScOGDCbSGmm-zXt2G5Xseh0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationResult {
  valid: number;
  invalid: number;
  requiresMigration: number;
  issues: Array<{
    productId: number;
    productName: string;
    issue: string;
    severity: 'error' | 'warning';
  }>;
}

const result: ValidationResult = {
  valid: 0,
  invalid: 0,
  requiresMigration: 0,
  issues: [],
};

/**
 * Check 1: Validate images field is an array
 */
function checkImagesArrayType(product: any): boolean {
  if (!product.images) return true; // Null is valid (no images)
  return Array.isArray(product.images);
}

/**
 * Check 2: Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check 3: Detect unencoded special characters in storage paths
 */
function hasUnencodedSpecialChars(url: string): boolean {
  // Extract path portion (before query string)
  const pathOnly = url.split(/[?#]/)[0];
  
  // Check for unencoded special characters that should be encoded
  const unencodedPatterns = [
    /[&]/, // Unencoded ampersand
    /[#]/, // Unencoded hash (in path)
    /[?]/, // Unencoded question mark (in path)
    /\s/,  // Unencoded space
  ];
  
  return unencodedPatterns.some(pattern => pattern.test(pathOnly));
}

/**
 * Check 4: Detect empty or invalid URLs
 */
function hasInvalidUrls(images: string[]): boolean {
  if (!images || images.length === 0) return false;
  
  return images.some(img => {
    if (!img || typeof img !== 'string') return true;
    if (img.trim() === '') return true;
    if (img === 'undefined' || img === 'null') return true;
    return false;
  });
}

/**
 * Check 5: Detect double encoding
 */
function hasDoubleEncoding(url: string): boolean {
  // Check for patterns like %2526 (double-encoded %26)
  return /%25[0-9A-F]{2}/.test(url);
}

async function validateProductImages() {
  console.log('🔍 Validating Product Image Data\n');
  
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images');
    
    if (error) throw error;
    
    console.log(`📊 Total products: ${products.length}\n`);
    
    for (const product of products) {
      let productValid = true;
      
      // Check 1: Images field type
      if (!checkImagesArrayType(product)) {
        result.issues.push({
          productId: product.id,
          productName: product.name,
          issue: 'images field is not an array (type: ' + typeof product.images + ')',
          severity: 'error',
        });
        result.requiresMigration++;
        productValid = false;
      }
      
      // Skip further checks if images field is invalid
      if (!productValid || !product.images || !Array.isArray(product.images)) {
        if (!product.images) {
          result.valid++; // No images is valid
        }
        continue;
      }
      
      // Check 2: Invalid URLs
      if (hasInvalidUrls(product.images)) {
        result.issues.push({
          productId: product.id,
          productName: product.name,
          issue: 'images array contains empty or invalid URLs',
          severity: 'error',
        });
        result.requiresMigration++;
        productValid = false;
      }
      
      // Check each image URL
      for (const imageUrl of product.images) {
        if (!imageUrl || typeof imageUrl !== 'string') continue;
        
        // Check 3: URL format
        if (!isValidUrl(imageUrl)) {
          result.issues.push({
            productId: product.id,
            productName: product.name,
            issue: `invalid URL format: ${imageUrl}`,
            severity: 'error',
          });
          result.invalid++;
          productValid = false;
        }
        
        // Check 4: Unencoded special characters
        if (hasUnencodedSpecialChars(imageUrl)) {
          result.issues.push({
            productId: product.id,
            productName: product.name,
            issue: `URL contains unencoded special characters: ${imageUrl}`,
            severity: 'error',
          });
          result.requiresMigration++;
          productValid = false;
        }
        
        // Check 5: Double encoding
        if (hasDoubleEncoding(imageUrl)) {
          result.issues.push({
            productId: product.id,
            productName: product.name,
            issue: `URL has double encoding: ${imageUrl}`,
            severity: 'warning',
          });
          result.requiresMigration++;
        }
      }
      
      if (productValid) {
        result.valid++;
      }
    }
    
    // Generate report
    console.log('='.repeat(80));
    console.log('📊 VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Valid products: ${result.valid}`);
    console.log(`Invalid products: ${result.invalid}`);
    console.log(`Products requiring migration: ${result.requiresMigration}`);
    console.log(`Total issues found: ${result.issues.length}\n`);
    
    if (result.issues.length > 0) {
      console.log('🚨 ISSUES FOUND:\n');
      
      // Group by severity
      const errors = result.issues.filter(i => i.severity === 'error');
      const warnings = result.issues.filter(i => i.severity === 'warning');
      
      if (errors.length > 0) {
        console.log(`❌ Errors (${errors.length}):`);
        errors.forEach((issue, idx) => {
          console.log(`  ${idx + 1}. [${issue.productName}] (ID: ${issue.productId})`);
          console.log(`     ${issue.issue}`);
        });
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log(`⚠️  Warnings (${warnings.length}):`);
        warnings.forEach((issue, idx) => {
          console.log(`  ${idx + 1}. [${issue.productName}] (ID: ${issue.productId})`);
          console.log(`     ${issue.issue}`);
        });
        console.log('');
      }
      
      console.log('💡 RECOMMENDATION:');
      console.log('   Run the repair script to fix these issues:');
      console.log('   npx tsx scripts/fix-product-image-data.ts --dry-run');
    } else {
      console.log('✅ All product image data is valid!\n');
    }
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Validation error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

validateProductImages();
