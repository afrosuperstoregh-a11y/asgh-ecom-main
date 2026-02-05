# Setup Product Videos in Supabase

## Step 1: Add Videos Column to Products Table

Go to your Supabase Dashboard and run this SQL in the SQL Editor:

```sql
ALTER TABLE products ADD COLUMN videos JSONB DEFAULT '[]';
```

## Step 2: Add Videos to Products

Update your products with actual video URLs. Here are some example updates:

### Girls Dashiki
```sql
UPDATE products 
SET videos = '["https://your-cdn.com/videos/girls-dashiki-demo.mp4"]'
WHERE slug = 'girls-dashiki';
```

### Boys Dashiki  
```sql
UPDATE products 
SET videos = '["https://your-cdn.com/videos/boys-dashiki-demo.mp4"]'
WHERE slug = 'boys-dashiki';
```

### Banku Flour
```sql
UPDATE products 
SET videos = '["https://your-cdn.com/videos/banku-flour-demo.mp4"]'
WHERE slug = 'banku-flour';
```

### Banku Mix
```sql
UPDATE products 
SET videos = '["https://your-cdn.com/videos/banku-mix-demo.mp4"]'
WHERE slug = 'banku-mix';
```

### Barbeque
```sql
UPDATE products 
SET videos = '["https://your-cdn.com/videos/barbeque-demo.mp4"]'
WHERE slug = 'barbeque';
```

## Step 3: Upload Your Videos

1. **Option A: Supabase Storage**
   - Go to Supabase Storage
   - Create a `videos` bucket
   - Upload your video files
   - Get the public URLs and update the SQL above

2. **Option B: External CDN**
   - Upload videos to YouTube, Vimeo, or your own CDN
   - Use the embed URLs or direct video URLs
   - Update the SQL with your actual video URLs

## Step 4: Verify the Updates

Run this SQL to check which products have videos:

```sql
SELECT id, name, slug, videos 
FROM products 
WHERE videos != '[]' 
ORDER BY name;
```

## Step 5: Test in Production

After updating the database:
1. Visit your product pages
2. You should see video thumbnails in the gallery
3. Click video thumbnails to play videos
4. Test the video controls (play/pause/mute)

## Video File Recommendations

- **Format**: MP4 (H.264) for best compatibility
- **Resolution**: 1080p or 720p
- **Duration**: 30-60 seconds for product demos
- **File Size**: Under 50MB per video for fast loading
- **Thumbnail**: Use the first frame as poster image

## Example Video URLs Structure

```json
{
  "videos": [
    "https://cdn.yoursite.com/videos/product-demo.mp4",
    "https://cdn.yoursite.com/videos/product-tutorial.mp4"
  ]
}
```

The videos will automatically appear in the product gallery alongside images!
