const { createClient } = require('@supabase/supabase-js');

// Use anon key for read operations, service role for writes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://azpgqsmgyorjbqsgxuxw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cGdxc21neW9yamJxc2d4dXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTg1NjAsImV4cCI6MjA4NDg3NDU2MH0.cxHD8ihT9E5ZAxtkfGa2VjYxYmadbYxyl3xVDPtgh9Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Replace these with your actual video URLs
const productVideos = {
  'girls-dashiki': [
    '/videos/girls-dashiki-demo.mp4'
  ],
  'boys-dashiki': [
    '/videos/boys-dashiki-demo.mp4'
  ],
  'banku-flour': [
    '/videos/banku-flour-demo.mp4'
  ],
  'banku-mix': [
    '/videos/banku-mix-demo.mp4'
  ],
  'barbeque': [
    '/videos/barbeque-demo.mp4'
  ]
};

async function updateProductVideos() {
  try {
    console.log('🎬 Updating product videos...');

    for (const [slug, videos] of Object.entries(productVideos)) {
      console.log(`📹 Updating ${slug} with ${videos.length} video(s)`);
      
      const { data, error } = await supabase
        .from('products')
        .update({ videos })
        .eq('slug', slug)
        .select('id, name, slug, videos');

      if (error) {
        if (error.message.includes('column "videos" does not exist')) {
          console.log(`❌ Videos column doesn't exist. Please run the SQL from setup_videos_guide.md first.`);
          return;
        }
        console.error(`❌ Error updating ${slug}:`, error);
      } else {
        console.log(`✅ Updated ${slug}:`, data[0]?.name);
      }
    }

    console.log('🎉 Product videos updated successfully!');
    
    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, videos')
      .in('slug', Object.keys(productVideos));

    console.log('✅ Updated products:');
    products.forEach(product => {
      console.log(`  📹 ${product.name}: ${product.videos?.length || 0} videos`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateProductVideos();
