const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');
const ws = require('ws');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    ws: ws
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
  }
});

// Upload product image
async function uploadProductImage(file, productId, isMain = false) {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `products/${productId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: publicUrl,
      path: filePath,
      isMain
    };
    
  } catch (error) {
    console.error('❌ Error uploading product image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Upload category image
async function uploadCategoryImage(file, categoryId) {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `categories/${categoryId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('category-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error('❌ Error uploading category image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Delete product image
async function deleteProductImage(filePath) {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);
    
    if (error) throw error;
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error deleting product image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test Supabase Storage setup
async function testStorageSetup() {
  try {
    console.log('🗄️  Testing Supabase Storage setup...');
    
    // Test bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error accessing buckets:', bucketError);
      return false;
    }
    
    console.log('✅ Buckets accessible:', buckets.map(b => b.name));
    
    // Check if required buckets exist
    const requiredBuckets = ['product-images', 'category-images', 'user-avatars'];
    const existingBuckets = buckets.map(b => b.name);
    const missingBuckets = requiredBuckets.filter(bucket => !existingBuckets.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.log('⚠️  Missing buckets:', missingBuckets);
      console.log('💡 Run setup_supabase_storage.sql in Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ All required buckets exist');
    
    // Test file upload (small test)
    const testBuffer = Buffer.from('test image data');
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload('test/test-file.txt', testBuffer, {
        contentType: 'text/plain'
      });
    
    if (error) {
      console.error('❌ Upload test failed:', error);
      return false;
    }
    
    // Clean up test file
    await supabase.storage.from('product-images').remove(['test/test-file.txt']);
    
    console.log('✅ Storage upload test successful');
    return true;
    
  } catch (error) {
    console.error('❌ Storage setup test failed:', error);
    return false;
  }
}

// Express middleware for file uploads
const uploadProductImagesMiddleware = upload.array('images', 5); // Max 5 images
const uploadCategoryImageMiddleware = upload.single('image');

module.exports = {
  uploadProductImage,
  uploadCategoryImage,
  deleteProductImage,
  testStorageSetup,
  uploadProductImages: uploadProductImagesMiddleware,
  uploadCategoryImage: uploadCategoryImageMiddleware,
  supabase
};
