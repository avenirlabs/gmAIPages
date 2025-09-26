import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Page, Section, SiteHeader, SiteFooter } from "@/components/layout";
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
    <Page className="bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
      <SiteHeader />

      <main className="flex flex-col">
        <Section variant="hero" size="lg" className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-secondary-800 md:text-6xl">
            {home?.title || "Find the perfect gift by chatting"}
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-brand-secondary-600">
            {home?.page_description ||
              "Ask in your own words. I'll parse your request with AI, search Algolia for matching products, and show results inline with refine chips."}
          </p>
        </Section>

        <Section variant="default" size="sm" as="div" className="w-full">
          <ChatInterface starterPrompts={home?.chips} />
        </Section>

        <Section variant="feature" size="md" as="div">
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
        </Section>

        {home?.long_description ? (
          <Section variant="content" size="lg" className="max-w-4xl mx-auto">
            <div
              dangerouslySetInnerHTML={{ __html: home.long_description }}
            />
          </Section>
        ) : null}
      </main>

      <SiteFooter />
    </Page>
  );
}
