# Admin Permission Fix - Windows PowerShell Setup Script
Write-Host "🔧 Admin Permission Fix Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if service role key is set
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY not found in environment" -ForegroundColor Red
    Write-Host "Please add it to your .env.local file:" -ForegroundColor Yellow
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Get the key from: Supabase Dashboard - Settings - API - service_role (secret)" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "✅ SUPABASE_SERVICE_ROLE_KEY found" -ForegroundColor Green
}

# Check if other required env vars are set
if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL not found" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_URL found" -ForegroundColor Green
}

if (-not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Environment check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run the SQL fix in Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Restart your development server" -ForegroundColor White
Write-Host "3. Test product creation in admin panel" -ForegroundColor White
