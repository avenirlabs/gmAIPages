import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ChatInterface } from "@/components/gifts/ChatInterface";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeaturedGrid } from "@/components/woocommerce/FeaturedGrid";
import { SiteFooter } from "@/components/layout/SiteFooter";

interface PageRow {
  id: string;
  slug: string;
  title: string | null;
  page_description: string | null;
  long_description: string | null;
  chips: string[];
  content?: any;
}

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageRow | null>(null);

  useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
          signal: ac.signal,
        });
        if (!r.ok) {
          setPage(null);
          return;
        }
        const d = (await r.json()) as PageRow | null;
        setPage(d || null);
      } catch (_) {
        setPage(null);
      }
    })();
    return () => ac.abort();
  }, [slug]);

  // SEO
  useEffect(() => {
    if (page) {
      import("@/lib/seo").then(({ setSeo }) =>
        setSeo(page.title || page.slug, page.page_description || undefined),
      );
    }
  }, [page?.title, page?.page_description, page?.slug]);

  if (!page) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
      <SiteHeader />

      <main className="container mx-auto grid min-h-[calc(100vh-5rem)] grid-rows-[auto_1fr] gap-8 pb-10 pt-8">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#222529] md:text-6xl">
            {page.title || slug}
          </h1>
          {page.page_description ? (
            <p className="mx-auto mt-4 max-w-2xl text-balance text-[#777]">
              {page.page_description}
            </p>
          ) : null}
        </section>

        <section className="mx-auto w-full max-w-5xl px-2 sm:px-0">
          <ChatInterface starterPrompts={page?.chips} />
        </section>

        {page?.content?.productGrid?.enabled ? (
          <FeaturedGrid
            source={page.content.productGrid.source}
            categorySlug={page.content.productGrid.categorySlug}
            limit={page.content.productGrid.limit}
            title={
              page.content.productGrid.source === "category"
                ? `Products: ${page.content.productGrid.categorySlug || "Category"}`
                : page.content.productGrid.source === "best_sellers"
                  ? "Best Sellers"
                  : "Featured Products"
            }
          />
        ) : null}

        {page.long_description ? (
          <section className="mx-auto w-full max-w-4xl px-2 sm:px-0">
            <div className="prose prose-lg max-w-none text-[#333] leading-7 md:leading-8">
              <div
                className="font-mono lg:font-sans"
                dangerouslySetInnerHTML={{ __html: page.long_description }}
              />
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
