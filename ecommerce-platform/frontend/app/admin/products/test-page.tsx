'use client';

import { useEffect } from 'react';

export default function TestProductsPage() {
  useEffect(() => {
    console.log('🧪 TestProductsPage component mounted!');
    console.log('🍪 Document cookies:', document.cookie);
    console.log('🌐 Current URL:', window.location.href);
    
    // Test the API directly
    fetch('/api/admin/products', {
      credentials: 'include'
    })
    .then(response => {
      console.log('📊 Test API response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📊 Test API response data:', data);
    })
    .catch(error => {
      console.error('❌ Test API error:', error);
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Products Page</h1>
      <p>This is a minimal test version to check if the page loads and API works.</p>
      <p>Check the console for debugging logs.</p>
    </div>
  );
}
