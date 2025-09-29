// api/_services/supabase.ts (author in TS, import as .js)
// NodeNext ESM: local imports must end with .js when used.
import { createClient } from '@supabase/supabase-js';

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // Service role for server-only use. NEVER expose to client.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'gmAIPages-admin-api' } }
  });
}