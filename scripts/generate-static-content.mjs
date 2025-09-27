import fs from "node:fs/promises";
import path from "node:path";

// ====== ENV expected ======
// SUPABASE_URL, SUPABASE_SERVICE_ROLE
// WOOCOMMERCE_BASE_URL (your Woo base, e.g. https://store.com)
// WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET
// ==========================

const OUT = path.resolve(process.cwd(), "public/content");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}
async function writeJSON(filePath, obj) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), "utf8");
  console.log("✓", path.relative(process.cwd(), filePath));
}

/* -------------------- Pages (Supabase) -------------------- */
async function fetchAllPages() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/pages?select=*`;
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
    },
  });
  if (!r.ok) throw new Error(`Supabase pages failed: ${r.status}`);
  return await r.json();
}

async function exportPages() {
  const pages = await fetchAllPages();
  for (const p of pages) {
    const row = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      page_description: p.page_description,
      long_description: p.long_description,
      chips: p.chips || [],
      content: p.content || null,
      last_updated: new Date().toISOString(),
    };
    // /content/pages/<slug>.json
    await writeJSON(path.join(OUT, "pages", `${p.slug}.json`), row);
    if (p.slug === "home") {
      await writeJSON(path.join(OUT, "pages", "home.json"), row);
    }
  }
}

/* ----------------- WooCommerce (products) ----------------- */
function authHeader() {
  const token = Buffer.from(
    `${process.env.WOOCOMMERCE_CONSUMER_KEY}:${process.env.WOOCOMMERCE_CONSUMER_SECRET}`
  ).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function fetchWoo(endpoint) {
  const baseUrl = process.env.WOOCOMMERCE_BASE_URL.replace(/\/+$/, "");
  const r = await fetch(`${baseUrl}/wp-json/wc/v3${endpoint}`, {
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Woo fetch failed: ${r.status} ${endpoint}`);
  return await r.json();
}

function mapProduct(p) {
  return {
    id: Number(p.id),
    name: p.name,
    link: p.permalink,
    image: p.images?.[0]?.src || "/placeholder.png",
    price: p.price ? parseFloat(p.price) : undefined,
    regular_price: p.regular_price ? parseFloat(p.regular_price) : undefined,
    sale_price: p.sale_price ? parseFloat(p.sale_price) : undefined,
  };
}

async function exportFeatured(limit = 24) {
  const data = await fetchWoo(`/products?featured=true&per_page=50`);
  const items = data.slice(0, limit).map(mapProduct);
  await writeJSON(path.join(OUT, "products", "featured.json"), { products: items });
}

async function exportBestSellers(limit = 24) {
  // popularity is the usual proxy
  const data = await fetchWoo(`/products?orderby=popularity&per_page=50`);
  const items = data.slice(0, limit).map(mapProduct);
  await writeJSON(path.join(OUT, "products", "best_sellers.json"), { products: items });
}

async function exportCategory(slug, limit = 24) {
  const cats = await fetchWoo(`/products/categories?slug=${encodeURIComponent(slug)}`);
  const cat = cats?.[0];
  if (!cat) {
    console.warn("! category not found:", slug);
    return;
  }
  const data = await fetchWoo(`/products?category=${cat.id}&per_page=50`);
  const items = data.slice(0, limit).map(mapProduct);
  await writeJSON(path.join(OUT, "products", "category", `${slug}.json`), { products: items });
}

/* --------------------- Entry point ------------------------ */
(async () => {
  // 1) Pages
  await exportPages();

  // 2) Core product snapshots
  await exportFeatured();
  await exportBestSellers();

  // 3) Key categories (edit this list or fetch from DB if you store them)
  const categories = ["dad-gifts", "mom-gifts", "anniversary", "diwali"];
  for (const c of categories) {
    await exportCategory(c);
  }

  console.log("All static content exported.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});