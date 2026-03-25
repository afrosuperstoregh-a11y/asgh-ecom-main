#!/bin/bash

# Admin Permission Fix - Quick Setup Script
echo "🔧 Admin Permission Fix Setup"
echo "================================"

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not found in environment"
    echo "Please add it to your .env.local file:"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here"
    echo ""
    echo "Get the key from: Supabase Dashboard → Settings → API → service_role (secret)"
    exit 1
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY found"
fi

# Check if other required env vars are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found"
    exit 1
else
    echo "✅ NEXT_PUBLIC_SUPABASE_URL found"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found"
    exit 1
else
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found"
fi

echo ""
echo "🚀 Environment check complete!"
echo ""
echo "Next steps:"
echo "1. Run the SQL fix in Supabase SQL Editor"
echo "2. Restart your development server"
echo "3. Test product creation in admin panel"
