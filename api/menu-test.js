export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Get slug from query parameter instead of dynamic route
  const { slug } = req.query;

  if (req.method === "GET") {
    return res.status(200).json({
      message: "Menu endpoint test - working without Supabase",
      slug: slug || "no-slug-provided",
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}