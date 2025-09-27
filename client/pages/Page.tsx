import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ChatInterface } from "@/components/gifts/ChatInterface";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { FeaturedGrid } from "@/components/woocommerce/FeaturedGrid";
import { SiteFooter } from "@/components/layout/SiteFooter";
import PageContainer from "@/components/layout/PageContainer";

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
        const { fetchStaticFirst } = await import("@/lib/staticFirst");
        const d = await fetchStaticFirst<PageRow>(
          `/content/pages/${encodeURIComponent(slug)}.json`,
          `/api/pages/${encodeURIComponent(slug)}`,
          ac.signal
        );
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
    <div className="min-h-screen bg-gradient-to-b from-[#DBEBFF]/40 via-white to-white">

      <SiteHeader />

      <main className="container mx-auto grid min-h-[calc(100vh-5rem)] grid-rows-[auto_1fr] gap-8 pb-10 pt-8">
       <section className="text-center">
  <h1 className="text-balance text-4xl font-black tracking-tight md:text-6xl bg-gradient-to-b from-[#111827] to-[#374151] bg-clip-text text-transparent">
    {page.title || slug}
  </h1>
  {page.page_description ? (
    <p className="mt-4 text-balance text-[15px] leading-7 text-[#4b5563] md:text-base">
      {page.page_description}
    </p>
  ) : null}
</section>


<section className="w-full">
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
  <PageContainer>
    <div
      className="font-mono lg:font-sans"
      dangerouslySetInnerHTML={{ __html: page.long_description }}
    />
  </PageContainer>
) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
