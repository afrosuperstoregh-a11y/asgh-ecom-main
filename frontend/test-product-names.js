// Test script to demonstrate product name generation from image filenames

// Enhanced product name generation function
function cleanProductName(filename) {
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
    .replace(/\b\w/g, (l) => l.toUpperCase())
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

// Test cases
const testCases = [
  'red-shoes.jpg',
  'nike_air_max_90.png', 
  'mens-black-tshirt.webp',
  'african-print-dress-001.jpg',
  'leather_bag_brown_large.png',
  'dashiki-shirt-red-123.jpg',
  'h&bproduct1.jpg',
  'dell-latitude-e5440-1.jpg',
  'banku-flour.jpg',
  'traditional-necklace-abc123.jpg'
];

console.log('🧪 Product Name Generation Test Results:\n');

testCases.forEach(filename => {
  const generatedName = cleanProductName(filename);
  console.log(`📁 "${filename}" → 🏷️ "${generatedName}"`);
});

console.log('\n✅ Test completed!');
