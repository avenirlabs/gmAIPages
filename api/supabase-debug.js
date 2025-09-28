import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0
    };

    // Test Supabase connection with service role key
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const sb = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        // Try a simple query
        const { data, error } = await sb.from("menus").select("slug").limit(1);

        return res.status(200).json({
          status: "success",
          envCheck,
          supabaseTest: {
            success: !error,
            error: error?.message || null,
            dataCount: data?.length || 0,
            sampleSlug: data?.[0]?.slug || null
          }
        });
      } catch (supabaseError) {
        return res.status(200).json({
          status: "supabase_error",
          envCheck,
          supabaseError: supabaseError.message
        });
      }
    }

    return res.status(200).json({
      status: "missing_env",
      envCheck
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}