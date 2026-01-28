# Create missing category images for admin panel

# Copy existing images to match the requested names
Copy-Item "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\women.png" "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\clothing.jpg"
Copy-Item "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\home.png" "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\home-decor.jpg"
Copy-Item "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\Jewelry.png" "c:\Users\smens\OneDrive\Desktop\asca_ecom-main\ecommerce-platform\frontend\public\images\categories\accessories.jpg"

Write-Host "Created missing category images:"
Write-Host "- clothing.jpg (copied from women.png)"
Write-Host "- home-decor.jpg (copied from home.png)"
Write-Host "- accessories.jpg (copied from Jewelry.png)"
