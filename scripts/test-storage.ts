#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!serviceKey)

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    // Test basic connection
    console.log('📡 Testing API connection...')
    const { data, error } = await supabase.from('products').select('count').limit(1)
    if (error) {
      console.error('❌ API Error:', error)
    } else {
      console.log('✅ API connection successful')
    }

    // Test storage connection
    console.log('📁 Testing storage connection...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('❌ Storage Error:', bucketError)
    } else {
      console.log('✅ Storage connection successful')
      console.log('Available buckets:', buckets?.map(b => b.name))
      
      // Check if product-images exists
      const productImagesBucket = buckets?.find(b => b.name === 'product-images')
      if (productImagesBucket) {
        console.log('✅ product-images bucket found')
        
        // Try to list files
        const { data: files, error: listError } = await supabase.storage
          .from('product-images')
          .list('', { limit: 10 })
        
        if (listError) {
          console.error('❌ List files error:', listError)
        } else {
          console.log(`✅ Found ${files?.length || 0} files in product-images`)
          files?.forEach(file => console.log(`  - ${file.name}`))
        }
      } else {
        console.log('❌ product-images bucket not found')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()
