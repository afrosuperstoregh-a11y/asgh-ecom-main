const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzY4MDYzNCwiZXhwIjoyMDUzMjU2NjM0fQ.NP56NYRxQlqpy9TrVFPAUw_6ixe9gP9';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample video URLs - replace with your actual video URLs
const productVideos = {
  'girls-dashiki': [
    'https://your-cdn.com/videos/girls-dashiki-demo.mp4',
    'https://your-cdn.com/videos/girls-dashiki-fashion-show.mp4'
  ],
  'boys-dashiki': [
    'https://your-cdn.com/videos/boys-dashiki-demo.mp4'
  ],
  'banku-flour': [
    'https://your-cdn.com/videos/banku-flour-cooking-demo.mp4'
  ],
  'banku-mix': [
    'https://your-cdn.com/videos/banku-mix-preparation.mp4'
  ],
  'barbeque': [
    'https://your-cdn.com/videos/barbeque-grilling-demo.mp4',
    'https://your-cdn.com/videos/barbeque-recipe.mp4'
  ]
};

async function addVideosToProducts() {
  try {
    console.log('🎬 Adding videos to products...');

    for (const [slug, videos] of Object.entries(productVideos)) {
      console.log(`📹 Adding videos to product: ${slug}`);
      
      const { data, error } = await supabase
        .from('products')
        .update({ videos })
        .eq('slug', slug)
        .select('id, name, slug, videos');

      if (error) {
        console.error(`❌ Error updating ${slug}:`, error);
      } else {
        console.log(`✅ Successfully updated ${slug}:`, data[0]);
      }
    }

    console.log('🎉 Videos added to all products!');
    
    // Verify the updates
    console.log('\n🔍 Verifying video updates...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, videos')
      .not('videos', 'eq', '[]');

    if (error) {
      console.error('❌ Error verifying:', error);
    } else {
      console.log('✅ Products with videos:');
      products.forEach(product => {
        console.log(`  📹 ${product.name}: ${product.videos.length} videos`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
addVideosToProducts();
