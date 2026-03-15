#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function verifyProducts() {
  try {
    console.log('🔍 Verifying created products...')
    
    const { data: products, error } = await supabase
      .from('products')
      .select('name, slug, price, status, images')
      .limit(10)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log(`✅ Found ${products?.length || 0} products:`)
    products?.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`)
      console.log(`   Slug: ${product.slug}`)
      console.log(`   Price: $${product.price}`)
      console.log(`   Status: ${product.status}`)
      console.log(`   Image: ${product.images ? '✅' : '❌'}`)
    })
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting:', countError)
    } else {
      console.log(`\n📊 Total products in database: ${count}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifyProducts()
