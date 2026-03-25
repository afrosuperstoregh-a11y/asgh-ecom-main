// Debug script to check admin authentication state
// Run this in browser console on any admin page

function debugAdminAuth() {
  console.log('🔍 === Admin Authentication Debug ===');
  
  // Check token
  const token = localStorage.getItem('adminToken');
  console.log('📍 Token from localStorage:', token ? token.substring(0, 30) + '...' : 'NULL');
  
  // Check cookie
  const cookies = document.cookie.split('; ');
  const adminCookie = cookies.find(row => row.startsWith('admin-token='));
  console.log('📍 Token from cookie:', adminCookie ? adminCookie.substring(0, 40) + '...' : 'NULL');
  
  // Check user data
  const userData = localStorage.getItem('adminUser');
  console.log('📍 User data:', userData ? JSON.parse(userData) : 'NULL');
  
  // Check current path
  console.log('📍 Current path:', window.location.pathname);
  
  // Check if token manager exists
  if (typeof window.tokenManager !== 'undefined') {
    console.log('✅ Token manager available');
    const validation = window.tokenManager.validateToken(token);
    console.log('📍 Token validation:', validation);
  } else {
    console.log('❌ Token manager not available');
  }
  
  // Check for authentication redirects
  console.log('📍 Page title:', document.title);
  console.log('📍 URL:', window.location.href);
  
  // Check if we're on login page
  if (window.location.pathname === '/admin/login') {
    console.log('⚠️ Currently on login page - authentication failed');
  } else {
    console.log('✅ Not on login page');
    
    // Check if sidebar elements exist
    const desktopSidebar = document.querySelector('.lg\\:fixed');
    const mobileSidebar = document.querySelector('.fixed.inset-y-0');
    
    console.log('📍 Desktop sidebar found:', !!desktopSidebar);
    console.log('📍 Mobile sidebar found:', !!mobileSidebar);
    
    if (desktopSidebar) {
      console.log('📍 Desktop sidebar classes:', desktopSidebar.className);
    }
  }
}

// Auto-run debug
debugAdminAuth();

// Make function available globally
window.debugAdminAuth = debugAdminAuth;
