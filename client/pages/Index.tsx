import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FeaturedGrid } from "@/components/woocommerce/FeaturedGrid";
import { ChatInterface } from "@/components/gifts/ChatInterface";

interface HomePageRow {
  title: string | null;
  page_description: string | null;
  long_description: string | null;
  chips: string[];
  content?: any;
}

export default function Index() {
  const [home, setHome] = useState<HomePageRow | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/pages/home", { signal: ac.signal });
        if (!r.ok) {
          setHome(null);
          return;
        }
        const d = (await r.json()) as HomePageRow | null;
        setHome(d || null);
      } catch (_) {
        setHome(null);
      }
    })();
    return () => ac.abort();
  }, []);

  // SEO
  useEffect(() => {
    const title = home?.title || "Find your gifts with AI";
    const desc = home?.page_description || undefined;
    import("@/lib/seo").then(({ setSeo }) => setSeo(title, desc));
  }, [home?.title, home?.page_description]);

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
      {/* Giftsmate-like header */}
      <SiteHeader />

      <main className="container mx-auto grid min-h-[calc(100vh-5rem)] grid-rows-[auto_1fr] gap-8 pb-10 pt-8">
       <section className="text-center">
  <h1 className="text-balance text-4xl font-black tracking-tight md:text-6xl bg-gradient-to-b from-[#111827] to-[#374151] bg-clip-text text-transparent">
    {home?.title || "Find the perfect gift by chatting"}
  </h1>
  <p className="mt-4 text-balance text-[15px] leading-7 text-[#4b5563] md:text-base">
    {home?.page_description ||
      "Ask in your own words. I’ll parse your request with AI, search Algolia for matching products, and show results inline with refine chips."}
  </p>
</section>

        <section className="w-full">
          <ChatInterface starterPrompts={home?.chips} />
        </section>

        {/* Featured products just above the long description */}
        {home?.content?.productGrid?.enabled ? (
          <FeaturedGrid
            source={home.content.productGrid.source}
            categorySlug={home.content.productGrid.categorySlug}
            limit={home.content.productGrid.limit}
            title={
              home.content.productGrid.source === "category"
                ? `Products: ${home.content.productGrid.categorySlug || "Category"}`
                : home.content.productGrid.source === "best_sellers"
                  ? "Best Sellers"
                  : "Featured Products"
            }
          />
        ) : (
          <FeaturedGrid title="Featured Products" />
        )}

        {home?.long_description ? (
          <section className="mx-auto w-full max-w-4xl px-2 sm:px-0">
            <div className="prose prose-lg max-w-none text-[#333] leading-7 md:leading-8">
              <div
                dangerouslySetInnerHTML={{ __html: home.long_description }}
              />
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
