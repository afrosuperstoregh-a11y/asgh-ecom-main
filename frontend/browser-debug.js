// Browser console test - paste this into your browser console on your site
async function debugSupabaseData() {
  console.log('🔍 Debugging Supabase data in browser...')
  
  try {
    // Test direct API call
    const response = await fetch('http://127.0.0.1:54321/rest/v1/products?select=*,categories(id,name,slug)&status=eq.active&limit=3', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    })
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Raw products data:', data)
    console.log(`📊 Found ${data.length} products`)
    
    // Test categories
    const catResponse = await fetch('http://127.0.0.1:54321/rest/v1/categories?select=*&limit=3', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    })
    
    if (catResponse.ok) {
      const catData = await catResponse.json()
      console.log('✅ Raw categories data:', catData)
      console.log(`📊 Found ${catData.length} categories`)
    }
    
    // Test storage buckets
    const bucketResponse = await fetch('http://127.0.0.1:54321/storage/v1/bucket', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    })
    
    if (bucketResponse.ok) {
      const bucketData = await bucketResponse.json()
      console.log('✅ Storage buckets:', bucketData)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug function
debugSupabaseData()
