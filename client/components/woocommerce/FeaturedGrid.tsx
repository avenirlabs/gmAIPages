import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { CARD_IMAGE_ASPECT } from "@/config/ui";

interface FeaturedProduct {
  id: number;
  name: string;
  link: string;
  image?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
}

interface GridProps {
  source?: "featured" | "best_sellers" | "category";
  categorySlug?: string;
  limit?: number;
  title?: string;
}

export function FeaturedGrid({
  source = "featured",
  categorySlug,
  limit = 20,
  title = "Products",
}: GridProps) {
  const [items, setItems] = useState<FeaturedProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams();
    params.set("source", source);
    if (categorySlug) params.set("category_slug", categorySlug);
    params.set("per_page", String(limit));
    fetch(`/api/woocommerce/products?${params.toString()}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((d) => {
        if (!mounted) return;
        setItems((d?.products as FeaturedProduct[]) || []);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Could not load products");
        setItems([]);
      });
    return () => {
      mounted = false;
    };
  }, [source, categorySlug, limit]);

  return (
    <section className="mx-auto w-full max-w-6xl px-2 sm:px-0">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-[#222529]">{title}</h2>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {(
          items ?? Array.from({ length: 8 }).map((_, i) => ({ id: i }) as any)
        ).map((p: FeaturedProduct) => (
          <article
            key={p.id}
            className="group overflow-hidden rounded-md border bg-white shadow hover:shadow-md transition-shadow"
          >
            <div className="bg-white p-2">
              <AspectRatio ratio={CARD_IMAGE_ASPECT === 'square' ? 1 : 4/5}>
                {p?.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-gray-100" />
                )}
              </AspectRatio>
            </div>
            <div className="space-y-2 p-3 text-center">
              <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-[#222529] group-hover:text-[#155ca5]">
                {p?.name || (
                  <span className="inline-block h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                )}
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm">
                {p?.sale_price && p.sale_price !== "0" ? (
                  <>
                    <span className="font-semibold text-red-600">
                      ₹{p.sale_price}
                    </span>
                    {p.regular_price ? (
                      <span className="text-xs text-[#777] line-through">
                        ₹{p.regular_price}
                      </span>
                    ) : null}
                  </>
                ) : p?.price ? (
                  <span className="font-semibold text-red-600">₹{p.price}</span>
                ) : (
                  <span className="inline-block h-4 w-16 animate-pulse rounded bg-gray-100" />
                )}
              </div>
              {p?.link ? (
                <Button asChild variant="outline" className="w-full">
                  <a href={p.link} target="_blank" rel="noreferrer">
                    Shop Now
                  </a>
                </Button>
              ) : (
                <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
