// Cleanup script for expired admin tokens
// Run this script to clear expired tokens from localStorage and cookies

function cleanupExpiredTokens() {
  console.log('🧹 Cleaning up expired admin tokens...');
  
  // Check current token
  const currentToken = localStorage.getItem('adminToken');
  if (currentToken) {
    console.log('Found token:', currentToken.substring(0, 30) + '...');
    
    // Validate token
    const tokenManager = window.tokenManager;
    if (tokenManager) {
      const isValid = tokenManager.validateToken(currentToken);
      console.log('Token validation result:', isValid);
      
      if (!isValid) {
        console.log('⚠️ Token is expired, removing...');
        tokenManager.removeToken();
        console.log('✅ Expired token removed');
      } else {
        console.log('✅ Token is still valid');
      }
    } else {
      // Manual token validation if tokenManager not available
      if (currentToken.startsWith('prod-jwt-token-')) {
        const tokenParts = currentToken.split('-');
        let timestamp;
        
        if (tokenParts[3] && !isNaN(parseInt(tokenParts[3]))) {
          timestamp = tokenParts[3];
        } else if (tokenParts[4] && !isNaN(parseInt(tokenParts[4]))) {
          timestamp = tokenParts[4];
        }
        
        if (timestamp) {
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          const isExpired = (currentTime - tokenTime) > 30 * 24 * 60 * 1000;
          
          if (isExpired) {
            console.log('⚠️ Token is expired, removing...');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            console.log('✅ Expired token removed manually');
          } else {
            console.log('✅ Token is still valid');
          }
        }
      }
    }
  } else {
    console.log('ℹ️ No admin token found');
  }
  
  // Check for any other admin-related data
  const adminUser = localStorage.getItem('adminUser');
  if (adminUser) {
    console.log('Found admin user data');
    try {
      const userData = JSON.parse(adminUser);
      console.log('User:', userData.email);
    } catch (error) {
      console.log('⚠️ Invalid admin user data, removing...');
      localStorage.removeItem('adminUser');
    }
  }
  
  console.log('🎉 Cleanup completed!');
}

// Auto-cleanup function that runs on page load
function autoCleanupOnLoad() {
  // Only run on admin pages
  if (window.location.pathname.startsWith('/admin')) {
    cleanupExpiredTokens();
  }
}

// Run cleanup immediately
cleanupExpiredTokens();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanupExpiredTokens, autoCleanupOnLoad };
}
