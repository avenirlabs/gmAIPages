import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Page, Section, SiteHeader, SiteFooter } from "@/components/layout";
import { FeaturedGrid } from "@/components/woocommerce/FeaturedGrid";
import { ChatInterface } from "@/components/gifts/ChatInterface";
import HeroCTA from "@/components/home/HeroCTA";
import ProductGrid from "@/components/gifts/ProductGrid";

interface HomePageRow {
  title: string | null;
  page_description: string | null;
  long_description: string | null;
  chips: string[];
  content?: any;
}

export default function Index() {
  const navigate = useNavigate();
  const [home, setHome] = useState<HomePageRow | null>(null);
  const [showChat, setShowChat] = useState(false);
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

  const handleHeroSubmit = (query: string) => {
    setShowChat(true);
    // In a real app, you might want to navigate or trigger the chat interface
    // For now, we'll show the chat interface below
  };

  if (showChat) {
    return (
      <Page className="bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
        <SiteHeader />
        <main className="flex flex-col">
          <Section variant="default" size="sm" as="div" className="w-full">
            <ChatInterface starterPrompts={home?.chips} />
          </Section>
        </main>
        <SiteFooter />
      </Page>
    );
  }

  return (
    <>
      {/* Hero CTA above the fold */}
      <HeroCTA
        onSubmit={handleHeroSubmit}
        placeholder={home?.page_description ? `Try: ${home.page_description}` : undefined}
        starterPrompts={home?.chips}
      />

      <Page className="bg-[radial-gradient(60%_60%_at_50%_0%,rgba(21,92,165,0.12),transparent)]">
        <SiteHeader />

        <main className="flex flex-col">
          <Section variant="feature" size="lg" as="div">
            <div className="container">
              <h2 className="text-2xl font-bold text-brand-secondary-800 mb-8">Featured Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {home?.content?.productGrid?.enabled ? (
                  <FeaturedGrid
                    source={home.content.productGrid.source}
                    categorySlug={home.content.productGrid.categorySlug}
                    limit={home.content.productGrid.limit}
                  />
                ) : (
                  <FeaturedGrid />
                )}
              </div>
            </div>
          </Section>

          {home?.long_description ? (
            <Section variant="content" size="lg" className="container">
              <div className="max-w-4xl mx-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: home.long_description }}
                />
              </div>
            </Section>
          ) : null}
        </main>

        <SiteFooter />
      </Page>
    </>
  );
}
