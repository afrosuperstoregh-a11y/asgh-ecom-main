#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function exploreBucket() {
  try {
    console.log('🔍 Exploring product-images bucket structure...')
    
    // List root level
    const { data: rootItems, error: rootError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100 })
    
    if (rootError) {
      console.error('❌ Error listing root:', rootError)
      return
    }
    
    console.log(`📁 Found ${rootItems?.length || 0} items in root:`)
    
    for (const item of rootItems || []) {
      console.log(`  - ${item.name} (${item.id ? 'file' : 'folder'})`)
      
      if (!item.id) { // It's a folder
        // List contents of folder
        const { data: folderContents, error: folderError } = await supabase.storage
          .from('product-images')
          .list(item.name, { limit: 100 })
        
        if (folderError) {
          console.error(`❌ Error listing ${item.name}:`, folderError)
        } else {
          console.log(`    📂 Contents of ${item.name}:`)
          for (const file of folderContents || []) {
            if (file.id) { // It's a file
              console.log(`      - ${file.name}`)
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

exploreBucket()
