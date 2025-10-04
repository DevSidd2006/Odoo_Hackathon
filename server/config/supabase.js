const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Use service key for all operations to bypass RLS during development
// In production, you should use proper RLS policies
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin client for service operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };