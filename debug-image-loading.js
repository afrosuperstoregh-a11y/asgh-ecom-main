// Debug script to check if fixImageUrlWithFallback is being used
console.log('🔍 Debugging image loading...');

// Check if fixImageUrlWithFallback function exists
if (typeof window.fixImageUrlWithFallback !== 'undefined') {
    console.log('✅ fixImageUrlWithFallback function is available');
} else {
    console.log('❌ fixImageUrlWithFallback function NOT found - still using old cached version');
}

// Check current page URLs
console.log('📍 Current page:', window.location.href);
console.log('🕐 Timestamp:', new Date().toISOString());

// Test image URL conversion
const testUrls = [
    'food&beverages/banku-mix.png',
    'https://azpgqsmgyorjbqsgxuxw.supabase.co/storage/v1/object/public/product-images/food%26beverages/banku-mix.png'
];

console.log('🧪 Testing image URL conversions:');
testUrls.forEach(url => {
    console.log(`  Input: ${url}`);
    // This would be called by the fixImageUrlWithFallback function
    if (url.endsWith('.png')) {
        const converted = url.replace(/\.png$/, '.jpg');
        console.log(`  Output: ${converted} ✅`);
    } else {
        console.log(`  Output: ${url} (no conversion needed)`);
    }
});

console.log('🔍 Debug complete - check console for results');
