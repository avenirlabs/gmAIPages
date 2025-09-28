export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { slug } = req.query;

  if (req.method === "GET") {
    return res.status(200).json({
      message: "Dynamic route test",
      slug: slug || "no-slug-provided",
      path: req.url,
      query: req.query
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}