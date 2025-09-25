import type { Request, Response } from "express";

interface WCImage {
  src: string;
}
interface WCProduct {
  id: number;
  name: string;
  permalink: string;
  images?: WCImage[];
  price?: string;
  regular_price?: string;
  sale_price?: string;
}

// Cache with TTL and ETag
const cache = new Map<string, { at: number; data: any; etag: string }>();
const TTL_MS = 1000 * 60 * 10; // 10 minutes
export function clearWooCache() {
  cache.clear();
}

function computeEtag(obj: any) {
  const s = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `W/"${h.toString(16)}-${s.length}"`;
}

function mapProducts(data: WCProduct[]) {
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    link: p.permalink,
    image: p.images && p.images.length ? p.images[0].src : undefined,
    price: p.price ? parseFloat(p.price) : undefined,
    regular_price: p.regular_price ? parseFloat(p.regular_price) : undefined,
    sale_price: p.sale_price ? parseFloat(p.sale_price) : undefined,
  }));
}

export async function getProducts(req: Request, res: Response) {
  try {
    const base = (process.env.WOOCOMMERCE_BASE_URL || "").replace(/\/+$/, "");
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!base || !key || !secret) {
      res.status(500).json({ error: "WooCommerce credentials not configured" });
      return;
    }

    const { z } = await import("zod");
    const schema = z.object({
      source: z
        .enum(["featured", "best_sellers", "category"])
        .default("featured"),
      per_page: z.coerce.number().int().min(1).max(50).default(20),
      category_slug: z.string().trim().min(1).max(80).optional(),
    });
    const qp = schema.parse({
      source: req.query.source,
      per_page: req.query.per_page,
      category_slug: req.query.category_slug,
    });

    const cacheKey = JSON.stringify(qp);
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL_MS) {
      const inm = req.headers["if-none-match"];
      if (inm && inm === hit.etag) {
        res.status(304).end();
        return;
      }
      res.setHeader("ETag", hit.etag);
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.json({ products: hit.data });
    }

    async function buildUrl(): Promise<URL> {
      const url = new URL(base + "/wp-json/wc/v3/products");
      url.searchParams.set("per_page", String(qp.per_page));
      url.searchParams.set("status", "publish");
      url.searchParams.set(
        "_fields",
        "id,name,permalink,images,price,regular_price,sale_price",
      );
      url.searchParams.set("consumer_key", key);
      url.searchParams.set("consumer_secret", secret);

      if (qp.source === "featured") {
        url.searchParams.set("featured", "true");
      } else if (qp.source === "best_sellers") {
        url.searchParams.set("orderby", "popularity");
        url.searchParams.set("order", "desc");
      } else if (qp.source === "category" && qp.category_slug) {
        // Need category ID from slug
        const catUrl = new URL(base + "/wp-json/wc/v3/products/categories");
        catUrl.searchParams.set("slug", qp.category_slug);
        catUrl.searchParams.set("per_page", "1");
        catUrl.searchParams.set("consumer_key", key);
        catUrl.searchParams.set("consumer_secret", secret);
        const cr = await fetch(catUrl.toString(), {
          headers: { Accept: "application/json" },
        });
        if (!cr.ok) {
          const text = await cr.text();
          throw new Error(`Category lookup failed: ${text}`);
        }
        const cats = (await cr.json()) as { id: number }[];
        if (!cats.length) {
          return url; // empty result
        }
        url.searchParams.set("category", String(cats[0].id));
      }
      return url;
    }

    const url = await buildUrl();
    const r = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!r.ok) {
      const text = await r.text();
      res
        .status(r.status)
        .json({ error: "WooCommerce API error", details: text });
      return;
    }

    const data = (await r.json()) as WCProduct[];
    const products = mapProducts(data);
    const etag = computeEtag(products);
    cache.set(cacheKey, { at: Date.now(), data: products, etag });
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ products });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch products", details: err?.message });
  }
}

export async function getFeaturedProducts(_req: Request, res: Response) {
  // Back-compat: delegate to generic route
  return getProducts(
    { query: { source: "featured", per_page: "20" } } as any,
    res,
  );
}
