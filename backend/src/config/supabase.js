const { createClient } = require('@supabase/supabase-js');

// Singleton Supabase client for server-side operations
let supabaseServer = null;

function getSupabaseServer() {
  if (!supabaseServer) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseServer;
}

// Test Supabase connection
async function testConnection() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

module.exports = {
  testConnection,
  getSupabaseServer
};
