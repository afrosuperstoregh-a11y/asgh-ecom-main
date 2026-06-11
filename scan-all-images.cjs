const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lljxxaejmueoxsaqaowf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsanh4YWVqbXVlb3hzYXFhb3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwODIyMSwiZXhwIjoyMDkzNjg0MjIxfQ.qXvtkAhMYRSOHSQUFVdLGQypZ0_k-Z5Y2TlDDYJBzFQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Folder to category mapping
const folderToCategory = {
  'books&stationeries': 'Books & Stationery',
  'electronics': 'Electronics',
  'car&automobile': 'Car & Automobile',
  'computers&laptops': 'Computers & Laptops',
  'home&living': 'Home & Living',
  'jewelry&accessories': 'Jewelry & Accessories',
  'menfashion': "Men's Fashion",
  'womenfashion': "Women's Fashion",
  'sport&fitness': 'Sports & Fitness',
  'software': 'Software',
  'textbooks': 'Textbooks',
  'food&stationeries': 'Food & Grocery'
};

// Price ranges based on product type keywords
const priceRanges = {
  // Stationery items
  'ruler': { min: 2.99, max: 5.99 },
  'pencil': { min: 1.99, max: 4.99 },
  'pen': { min: 2.99, max: 8.99 },
  'eraser': { min: 1.99, max: 3.99 },
  'sharpener': { min: 1.99, max: 4.99 },
  'calculator': { min: 14.99, max: 49.99 },
  'stapler': { min: 8.99, max: 24.99 },
  'envelope': { min: 4.99, max: 12.99 },
  'notebook': { min: 5.99, max: 19.99 },
  'paper': { min: 8.99, max: 29.99 },
  'binder': { min: 9.99, max: 24.99 },
  'folder': { min: 4.99, max: 15.99 },
  'tape': { min: 3.99, max: 9.99 },
  'glue': { min: 3.99, max: 12.99 },
  'scissors': { min: 5.99, max: 15.99 },
  'marker': { min: 4.99, max: 14.99 },
  'highlighter': { min: 4.99, max: 12.99 },
  'chalk': { min: 2.99, max: 7.99 },
  'board': { min: 19.99, max: 49.99 },
  
  // Books
  'bible': { min: 19.99, max: 39.99 },
  'book': { min: 12.99, max: 49.99 },
  'dictionary': { min: 24.99, max: 59.99 },
  'textbook': { min: 34.99, max: 89.99 },
  
  // Electronics
  'keyboard': { min: 24.99, max: 89.99 },
  'mouse': { min: 14.99, max: 59.99 },
  'headphone': { min: 29.99, max: 149.99 },
  'speaker': { min: 39.99, max: 199.99 },
  'charger': { min: 14.99, max: 49.99 },
  'cable': { min: 9.99, max: 29.99 },
  'adapter': { min: 12.99, max: 39.99 },
  'battery': { min: 9.99, max: 29.99 },
  'flashlight': { min: 14.99, max: 39.99 },
  'fan': { min: 29.99, max: 89.99 },
  
  // Computers
  'laptop': { min: 499, max: 2499 },
  'computer': { min: 599, max: 2999 },
  'monitor': { min: 199, max: 899 },
  'tablet': { min: 299, max: 1299 },
  
  // Fashion
  'shirt': { min: 19.99, max: 79.99 },
  'dress': { min: 29.99, max: 149.99 },
  'pants': { min: 29.99, max: 99.99 },
  'shoes': { min: 39.99, max: 199.99 },
  'bag': { min: 24.99, max: 149.99 },
  'watch': { min: 49.99, max: 299.99 },
  'jewelry': { min: 29.99, max: 499.99 },
  'accessory': { min: 14.99, max: 99.99 },
  
  // Home & Living
  'furniture': { min: 99, max: 999 },
  'decor': { min: 19.99, max: 199.99 },
  'kitchen': { min: 14.99, max: 149.99 },
  'bedding': { min: 29.99, max: 199.99 },
  
  // Sports
  'ball': { min: 14.99, max: 49.99 },
  'equipment': { min: 29.99, max: 199.99 },
  'fitness': { min: 49.99, max: 299.99 },
  
  // Software
  'software': { min: 49.99, max: 499.99 },
  'antivirus': { min: 29.99, max: 99.99 },
  'office': { min: 99.99, max: 399.99 },
  
  // Food
  'food': { min: 4.99, max: 29.99 },
  'coffee': { min: 12.99, max: 39.99 },
  'beverage': { min: 2.99, max: 19.99 },
  
  // Default
  'default': { min: 14.99, max: 99.99 }
};

// Convert filename to product name
function filenameToProductName(filename) {
  // Remove file extension
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // Remove trailing numbers (1, 2, 3, etc.)
  name = name.replace(/\s*\(\d+\)$/, ''); // Remove (1), (2) etc
  name = name.replace(/\s*\d+$/, ''); // Remove trailing numbers
  
  // Remove duplicate suffixes
  name = name.replace(/_duplicate\d*$/, '');
  name = name.replace(/_copy\d*$/, '');
  
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  
  // Replace hyphens with spaces
  name = name.replace(/-/g, ' ');
  
  // Capitalize each word
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Clean up extra spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  return name;
}

// Generate slug from name
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Get price based on product name
function getPriceForProduct(productName) {
  const lowerName = productName.toLowerCase();
  
  for (const [keyword, range] of Object.entries(priceRanges)) {
    if (keyword !== 'default' && lowerName.includes(keyword)) {
      const min = range.min;
      const max = range.max;
      const price = min + Math.random() * (max - min);
      return Math.round(price * 100) / 100; // Round to 2 decimal places
    }
  }
  
  // Default price
  const min = priceRanges.default.min;
  const max = priceRanges.default.max;
  const price = min + Math.random() * (max - min);
  return Math.round(price * 100) / 100;
}

// Generate description
function generateDescription(productName, category) {
  return `High-quality ${productName} from our ${category} collection. Perfect for everyday use with durable materials and excellent craftsmanship.`;
}

async function scanAllImages() {
  try {
    console.log('🔍 Scanning all images in product-images bucket...\n');
    
    const { data: files, error } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 1000 });
    
    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }
    
    const actualItems = files.filter(file => 
      file.name !== '.emptyFolderPlaceholder' && 
      !file.name.includes('.emptyFolderPlaceholder')
    );
    
    const allImages = [];
    const folderCounts = {};
    
    for (const item of actualItems) {
      if (item.metadata?.mimetype) {
        // It's a file in root
        const extension = item.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
          allImages.push({
            path: item.name,
            folder: 'root',
            filename: item.name
          });
          folderCounts['root'] = (folderCounts['root'] || 0) + 1;
        }
      } else {
        // It's a folder, list its contents
        const { data: folderFiles, error: folderError } = await supabase
          .storage
          .from('product-images')
          .list(item.name, { limit: 1000 });
        
        if (folderError) {
          console.error(`   ❌ Error listing ${item.name}:`, folderError.message);
        } else if (folderFiles) {
          const actualFolderFiles = folderFiles.filter(f => 
            f.name !== '.emptyFolderPlaceholder' && 
            !f.name.includes('.emptyFolderPlaceholder')
          );
          
          actualFolderFiles.forEach(f => {
            const extension = f.name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
              allImages.push({
                path: `${item.name}/${f.name}`,
                folder: item.name,
                filename: f.name
              });
              folderCounts[item.name] = (folderCounts[item.name] || 0) + 1;
            }
          });
        }
      }
    }
    
    console.log(`📊 Total image files found: ${allImages.length}\n`);
    
    // Generate report
    const report = {
      totalImages: allImages.length,
      folders: folderCounts,
      images: allImages.map(img => {
        const productName = filenameToProductName(img.filename);
        const category = folderToCategory[img.folder] || 'General';
        const price = getPriceForProduct(productName);
        const slug = nameToSlug(productName);
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${img.path}`;
        
        return {
          path: img.path,
          folder: img.folder,
          filename: img.filename,
          productName: productName,
          slug: slug,
          category: category,
          price: price,
          description: generateDescription(productName, category),
          publicUrl: publicUrl
        };
      })
    };
    
    // Save report to file
    fs.writeFileSync('image-scan-report.json', JSON.stringify(report, null, 2));
    console.log('✅ Report saved to image-scan-report.json\n');
    
    // Print summary
    console.log('📁 Folder Summary:');
    Object.keys(folderCounts).sort().forEach(folder => {
      console.log(`  ${folder}: ${folderCounts[folder]} images`);
    });
    
    console.log(`\n✅ Scan complete. Total images: ${allImages.length}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scanAllImages();
