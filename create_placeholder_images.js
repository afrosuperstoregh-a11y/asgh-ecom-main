// Create placeholder images script
const fs = require('fs');
const path = require('path');

// Create a simple SVG placeholder for each product
const placeholders = [
  { filename: 'girls-dashiki.jpg', color: '#FF69B4', text: 'Girls Dashiki' },
  { filename: 'boys-dashiki.jpg', color: '#4169E1', text: 'Boys Dashiki' },
  { filename: 'banku-flour.jpg', color: '#FFD700', text: 'Banku Flour' },
  { filename: 'banku-mix.jpg', color: '#FF8C00', text: 'Banku Mix' },
  { filename: 'barbeque.jpg', color: '#DC143C', text: 'Barbeque' }
];

const productImagesDir = path.join(__dirname, 'product_images');

// Ensure directory exists
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir);
}

// Create SVG placeholders (we'll save as .jpg but they're actually SVG)
placeholders.forEach(placeholder => {
  const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${placeholder.color}"/>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">
    ${placeholder.text}
  </text>
  <text x="200" y="220" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">
    Product Image
  </text>
</svg>
`;

  const filePath = path.join(productImagesDir, placeholder.filename.replace('.jpg', '.svg'));
  fs.writeFileSync(filePath, svg.trim());
  
  console.log(`✅ Created placeholder: ${placeholder.filename}`);
});

console.log('\n🎉 Placeholder images created!');
console.log('💡 Note: These are SVG files saved with .jpg extension for compatibility');
console.log('📁 Location:', productImagesDir);
