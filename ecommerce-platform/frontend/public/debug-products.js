// Add this to the browser console to test if the products page loads
console.log('🧪 Testing if products page can load...');

// Try to navigate to products page
window.location.href = '/admin/products';

// Also add a global error handler to catch any errors
window.addEventListener('error', function(e) {
    console.error('❌ Global error caught:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Unhandled promise rejection:', e.reason);
});
