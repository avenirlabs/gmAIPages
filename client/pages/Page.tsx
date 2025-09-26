import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ChatInterface } from "@/components/gifts/ChatInterface";
import { Page as PageLayout, Section, SiteHeader, SiteFooter } from "@/components/layout";
import { FeaturedGrid } from "@/components/woocommerce/FeaturedGrid";

interface PageRow {
  id: string;
  slug: string;
  title: string | null;
  page_description: string | null;
  long_description: string | null;
  chips: string[];
  content?: any;
}

export default function DynamicPage() {
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
    <PageLayout className="bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
      <SiteHeader />

      <main className="flex flex-col">
        <Section variant="hero" size="lg" className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-secondary-800 md:text-6xl">
            {page.title || slug}
          </h1>
          {page.page_description ? (
            <p className="mx-auto max-w-2xl text-balance text-brand-secondary-600">
              {page.page_description}
            </p>
          ) : null}
        </Section>

        <Section variant="default" size="sm" as="div" className="w-full max-w-5xl mx-auto">
          <ChatInterface starterPrompts={page?.chips} />
        </Section>

        {page?.content?.productGrid?.enabled ? (
          <Section variant="feature" size="md" as="div">
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
          </Section>
        ) : null}

        {page.long_description ? (
          <Section variant="content" size="lg" className="max-w-4xl mx-auto">
            <div
              dangerouslySetInnerHTML={{ __html: page.long_description }}
            />
          </Section>
        ) : null}
      </main>

      <SiteFooter />
    </PageLayout>
  );
}
