import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL', supabaseUrl);
console.log('HAS_ANON_KEY', Boolean(supabaseAnonKey));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
