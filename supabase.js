/**
 * Supabase Client & Cloud Storage Integration for Digital Sathi (ڈیجیٹل ساتھی)
 * Cloud-native persistence across Vercel serverless environments & worldwide visitors
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://shprkgqgkzehdconvmtf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_g6ckebWQyhCpaWpG6RLWaw_g9VKJYMh';

let supabase = null;

try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('✔ Supabase Cloud Client Initialized:', SUPABASE_URL);
  }
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

module.exports = {
  supabase,
  isAvailable: () => !!supabase
};
