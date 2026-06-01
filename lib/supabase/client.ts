import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client or fall back if credentials are missing
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabaseClient = createClient(
  supabaseUrl || 'https://placeholder-rba-fretes.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
