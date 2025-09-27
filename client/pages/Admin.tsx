import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageRow {
  id: string;
  slug: string;
  title?: string | null;
  seo_title: string | null;
  seo_description: string | null;
  page_description: string | null;
  long_description?: string | null;
  chips: string[];
  content: any;
  published: boolean;
  is_home?: boolean;
  created_at: string;
  updated_at: string;
}

interface NavLinkRow {
  id?: string;
  label: string;
  href: string;
  position: number;
  visible: boolean;
}

export default function Admin() {
  const [session, setSession] = useState<null | { user: any }>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [active, setActive] = useState<PageRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chipDraft, setChipDraft] = useState("");
  const [navLinks, setNavLinks] = useState<NavLinkRow[]>([]);
  const [navLoading, setNavLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pages">("pages");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) =>
        setSession(data.session ? { user: data.session.user } : null),
      );
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess ? { user: sess.user } : null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) {
        setError(error.message);
      } else {
        setPages(data as PageRow[]);
        if (!active && data && data.length) setActive(data[0] as PageRow);
      }

      setNavLoading(true);
      const nav = await supabase
        .from("nav_links")
        .select("id, label, href, position, visible")
        .order("position", { ascending: true });
      setNavLoading(false);
      if (!nav.error && nav.data) setNavLinks(nav.data as NavLinkRow[]);
    })();
  }, [session]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPages([]);
    setActive(null);
  };

  const startNew = () => {
    setActive({
      id: "",
      slug: "",
      title: "",
      seo_title: "",
      seo_description: "",
      page_description: "",
      long_description: "",
      chips: [],
      content: null,
      published: true,
      is_home: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setChipDraft("");
  };

  const saveActive = async () => {
    if (!active) return;
    if (!active.slug.trim()) {
      setError("Slug is required");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = {
      slug: active.slug.trim(),
      title: active.title?.trim() || null,
      seo_title: active.seo_title?.trim() || null,
      seo_description: active.seo_description?.trim() || null,
      page_description: active.page_description?.trim() || null,
      long_description: active.long_description?.trim() || null,
      chips: active.chips ?? [],
      content: active.content ?? null,
      published: !!active.published,
      is_home: !!active.is_home,
      ...(active.id ? { id: active.id } : {}),
    };
    const { data, error } = await supabase
      .from("pages")
      .upsert(payload, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    const row = data as PageRow;

    // Ensure only one home page
    if (row.is_home) {
      await supabase
        .from("pages")
        .update({ is_home: false })
        .neq("id", row.id)
        .eq("is_home", true);
    }

    setLoading(false);
    // refresh list
    const newList = [row, ...pages.filter((p) => p.id !== row.id)];
    setPages(newList);
    setActive(row);
  };

  const removeActive = async () => {
    if (!active || !active.id) return;
    setLoading(true);
    const { error } = await supabase.from("pages").delete().eq("id", active.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPages(pages.filter((p) => p.id !== active.id));
    setActive(null);
  };

  if (!session) {
    return (
      <div className="mx-auto grid min-h-screen max-w-md place-items-center p-6">
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-center text-xl font-bold text-[#155ca5]">
            Admin Login
          </h1>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Use your Supabase auth credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl grid-rows-[auto_auto_1fr] gap-4 p-4">
      <header className="flex items-center justify-between rounded-xl border bg-[#DBEBFF] px-4 py-3">
        <h1 className="text-lg font-semibold text-[#155ca5]">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={startNew}>
            New Page
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border bg-white p-3">
            <input
            placeholder="Filter by slug..."
            className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
            onChange={(e) => {
              const q = e.target.value.toLowerCase();
              supabase
                .from("pages")
                .select("*")
                .ilike("slug", `%${q}%`)
                .order("updated_at", { ascending: false })
                .limit(100)
                .then(({ data }) => setPages((data || []) as PageRow[]));
            }}
          />
          <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-[#DBEBFF]",
                  active?.id === p.id && "bg-[#DBEBFF]",
                )}
              >
                <span className="truncate">{p.slug}</span>
                <span
                  className={cn(
                    "ml-2 rounded px-1.5 py-0.5 text-[10px]",
                    p.published
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600",
                  )}
                >
                  {p.published ? "Published" : "Draft"}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border bg-white p-4">
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {active ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Slug
                  </label>
                  <input
                    value={active.slug}
                    onChange={(e) =>
                      setActive({ ...active, slug: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. about-us"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Published
                  </label>
                  <select
                    value={active.published ? "1" : "0"}
                    onChange={(e) =>
                      setActive({
                        ...active,
                        published: e.target.value === "1",
                      })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Page Title
                  </label>
                  <input
                    value={active.title ?? ""}
                    onChange={(e) =>
                      setActive({ ...active, title: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="e.g. Anniversary Gifts"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    SEO Title
                  </label>
                  <input
                    value={active.seo_title ?? ""}
                    onChange={(e) =>
                      setActive({ ...active, seo_title: e.target.value })
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    SEO Description
                  </label>
                  <textarea
                    value={active.seo_description ?? ""}
                    onChange={(e) =>
                      setActive({ ...active, seo_description: e.target.value })
                    }
                    className="h-20 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Page Description
                  </label>
                  <textarea
                    value={active.page_description ?? ""}
                    onChange={(e) =>
                      setActive({ ...active, page_description: e.target.value })
                    }
                    className="h-24 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Long Description (shown under chat)
                  </label>
                  <textarea
                    value={active.long_description ?? ""}
                    onChange={(e) =>
                      setActive({ ...active, long_description: e.target.value })
                    }
                    className="h-40 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Chips
                  </label>
                  <div className="flex flex-wrap gap-2 rounded-md border px-2 py-2">
                    {(active.chips || []).map((c, i) => (
                      <span
                        key={`${c}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-[#DBEBFF] px-2 py-0.5 text-xs text-[#155ca5]"
                      >
                        {c}
                        <button
                          type="button"
                          className="text-[#155ca5]/70 hover:text-[#155ca5]"
                          onClick={() =>
                            setActive({
                              ...active!,
                              chips: (active!.chips || []).filter(
                                (x, idx) => idx !== i,
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={chipDraft}
                      onChange={(e) => setChipDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          const parts = chipDraft
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (parts.length) {
                            const next = Array.from(
                              new Set([...(active?.chips || []), ...parts]),
                            );
                            setActive({ ...active!, chips: next });
                            setChipDraft("");
                          }
                        }
                        if (
                          e.key === "Backspace" &&
                          chipDraft === "" &&
                          (active?.chips?.length || 0) > 0
                        ) {
                          setActive({
                            ...active!,
                            chips: active!.chips.slice(0, -1),
                          });
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        if (text && text.includes(",")) {
                          e.preventDefault();
                          const parts = text
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const next = Array.from(
                            new Set([...(active?.chips || []), ...parts]),
                          );
                          setActive({ ...active!, chips: next });
                        }
                      }}
                      className="min-w-[10ch] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Type and press Enter or comma"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Multi-word chips supported. Use comma or Enter to add.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Product Grid
                  </label>
                  <div className="grid gap-2 md:grid-cols-3">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={!!active.content?.productGrid?.enabled}
                        onChange={(e) =>
                          setActive({
                            ...active!,
                            content: {
                              ...(active.content || {}),
                              productGrid: {
                                source:
                                  active.content?.productGrid?.source ||
                                  "featured",
                                categorySlug:
                                  active.content?.productGrid?.categorySlug ||
                                  "",
                                limit: active.content?.productGrid?.limit ?? 20,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                      />
                      Show grid on this page
                    </label>
                    <div>
                      <select
                        value={
                          active.content?.productGrid?.source || "featured"
                        }
                        onChange={(e) =>
                          setActive({
                            ...active!,
                            content: {
                              ...(active.content || {}),
                              productGrid: {
                                enabled:
                                  active.content?.productGrid?.enabled ?? true,
                                source: e.target.value,
                                categorySlug:
                                  active.content?.productGrid?.categorySlug ||
                                  "",
                                limit: active.content?.productGrid?.limit ?? 20,
                              },
                            },
                          })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      >
                        <option value="featured">Featured</option>
                        <option value="best_sellers">Best Sellers</option>
                        <option value="category">Category</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
                      <input
                        value={active.content?.productGrid?.categorySlug || ""}
                        onChange={(e) =>
                          setActive({
                            ...active!,
                            content: {
                              ...(active.content || {}),
                              productGrid: {
                                enabled:
                                  active.content?.productGrid?.enabled ?? true,
                                source:
                                  active.content?.productGrid?.source ||
                                  "featured",
                                categorySlug: e.target.value,
                                limit: active.content?.productGrid?.limit ?? 20,
                              },
                            },
                          })
                        }
                        placeholder="Category slug (e.g. aprons)"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={active.content?.productGrid?.limit ?? 20}
                        onChange={(e) =>
                          setActive({
                            ...active!,
                            content: {
                              ...(active.content || {}),
                              productGrid: {
                                enabled:
                                  active.content?.productGrid?.enabled ?? true,
                                source:
                                  active.content?.productGrid?.source ||
                                  "featured",
                                categorySlug:
                                  active.content?.productGrid?.categorySlug ||
                                  "",
                                limit: Number(e.target.value) || 20,
                              },
                            },
                          })
                        }
                        placeholder="Limit"
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Grid is cached until you click Refresh Site Cache in
                    Settings.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!active.is_home}
                    onChange={(e) =>
                      setActive({ ...active!, is_home: e.target.checked })
                    }
                  />
                  Set as Home page
                </label>
                <div className="flex items-center gap-2">
                  <Button onClick={saveActive} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  {active.id ? (
                    <Button
                      variant="destructive"
                      onClick={removeActive}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a page or create a new one.
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#155ca5]">Settings</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                await fetch("/api/admin/cache/refresh", { method: "POST" });
              }}
            >
              Refresh Site Cache
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#155ca5]">Navigation</h2>
            <Button
            variant="secondary"
            onClick={() =>
              setNavLinks([
                ...navLinks,
                {
                  label: "New Link",
                  href: "/",
                  position: navLinks.length,
                  visible: true,
                },
              ])
            }
          >
            Add Link
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-2">Label</th>
                <th className="p-2">Href</th>
                <th className="p-2">Position</th>
                <th className="p-2">Visible</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {navLinks.map((r, i) => (
                <tr key={r.id || i} className="border-t">
                  <td className="p-2">
                    <input
                      value={r.label}
                      onChange={(e) => {
                        const next = [...navLinks];
                        next[i] = { ...r, label: e.target.value } as NavLinkRow;
                        setNavLinks(next);
                      }}
                      className="w-full rounded-md border px-2 py-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={r.href}
                      onChange={(e) => {
                        const next = [...navLinks];
                        next[i] = { ...r, href: e.target.value } as NavLinkRow;
                        setNavLinks(next);
                      }}
                      className="w-full rounded-md border px-2 py-1"
                    />
                  </td>
                  <td className="p-2 w-28">
                    <input
                      type="number"
                      value={r.position}
                      onChange={(e) => {
                        const next = [...navLinks];
                        next[i] = {
                          ...r,
                          position: Number(e.target.value),
                        } as NavLinkRow;
                        setNavLinks(next);
                      }}
                      className="w-full rounded-md border px-2 py-1"
                    />
                  </td>
                  <td className="p-2 w-24">
                    <input
                      type="checkbox"
                      checked={r.visible}
                      onChange={(e) => {
                        const next = [...navLinks];
                        next[i] = {
                          ...r,
                          visible: e.target.checked,
                        } as NavLinkRow;
                        setNavLinks(next);
                      }}
                    />
                  </td>
                  <td className="p-2 w-40 text-right">
                    <Button
                      size="sm"
                      onClick={async () => {
                        const payload: any = {
                          label: r.label?.trim() || "",
                          href: r.href?.trim() || "/",
                          position: r.position ?? 0,
                          visible: !!r.visible,
                        };
                        if (r.id) payload.id = r.id;
                        const { data, error } = await supabase
                          .from("nav_links")
                          .upsert(payload)
                          .select("id, label, href, position, visible")
                          .single();
                        if (!error && data) {
                          const next = [...navLinks];
                          next[i] = data as NavLinkRow;
                          setNavLinks(next);
                        }
                      }}
                    >
                      Save
                    </Button>
                    {r.id ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={async () => {
                          await supabase
                            .from("nav_links")
                            .delete()
                            .eq("id", r.id);
                          setNavLinks(navLinks.filter((x) => x !== r));
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {navLinks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-xs text-muted-foreground"
                  >
                    {navLoading ? "Loading..." : "No links yet. Add one."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
        </div>
    </div>
  );
}
