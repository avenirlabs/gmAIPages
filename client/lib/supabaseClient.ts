import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function makeSafeClient() {
  const chain: any = {
    select() {
      return chain;
    },
    eq() {
      return chain;
    },
    order() {
      return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
    },
  };
  return {
    from() {
      return chain;
    },
  } as any;
}

let client: any;
try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn("Supabase env vars missing: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    client = makeSafeClient();
  }
} catch (e) {
  console.error("Failed to init Supabase client, falling back to safe stub:", e);
  client = makeSafeClient();
}

export const supabase = client;
