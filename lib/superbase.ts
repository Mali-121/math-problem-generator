// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use anon key for both client & server in this prototype (RLS policies allow it)
export const supabase = createClient(supabaseUrl, supabaseAnon);
