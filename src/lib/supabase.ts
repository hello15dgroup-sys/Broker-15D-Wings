import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const rawKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://mhplukffgcxiorpfunyy.supabase.co';
const supabaseAnonKey = rawKey || 'sb_publishable_fmCwwyGOguTjtD7z0CO62Q_6yVE_XDh';

// Singleton Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

