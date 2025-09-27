import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

// ----------- Types (match your header) -----------
type LinkItem = { type: "link"; label: string; to: string };
type MegaLink = { label: string; to: string; badge?: string };
type MegaColumn = { heading: string; links: MegaLink[] };
type MegaItem = {
  type: "mega";
  label: string;
  columns: MegaColumn[];
  promo?: { title: string; text: string; to: string };
};
type NavItem = LinkItem | MegaItem;
type MenuPayload = { items: NavItem[] };

// ----------- Helpers -----------
const emptyMenu: MenuPayload = { items: [] };
const emptyLink: LinkItem = { type: "link", label: "", to: "" };
const emptyMega: MegaItem = {
  type: "mega",
  label: "",
  columns: [{ heading: "", links: [{ label: "", to: "" }] }],
};

// Basic validation (lightweight)
function validateMenu(menu: MenuPayload): string[] {
  const errs: string[] = [];
  menu.items.forEach((it, idx) => {
    if (it.type === "link") {
      if (!it.label.trim()) errs.push(`Item #${idx + 1}: Link label is required`);
      if (!it.to.trim()) errs.push(`Item #${idx + 1}: Link URL is required`);
    } else {
      if (!it.label.trim()) errs.push(`Item #${idx + 1}: Mega label is required`);
      if (!it.columns.length) errs.push(`Item #${idx + 1}: Mega must have at least one column`);
      it.columns.forEach((c, ci) => {
        if (!c.heading.trim()) errs.push(`Item #${idx + 1}, Column #${ci + 1}: Heading is required`);
        if (!c.links.length) errs.push(`Item #${idx + 1}, Column #${ci + 1}: Needs at least one link`);
        c.links.forEach((l, li) => {
          if (!l.label.trim()) errs.push(`Item #${idx + 1}, Column #${ci + 1}, Link #${li + 1}: Label required`);
          if (!l.to.trim()) errs.push(`Item #${idx + 1}, Column #${ci + 1}, Link #${li + 1}: URL required`);
        });
      });
    }
  });
  return errs;
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function MenuEditor() {
  const [menu, setMenu] = useState<MenuPayload>(emptyMenu);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Load current menu (API fallback already in place server-side)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/menus/main");
        const d = (await r.json()) as MenuPayload;
        // Normalize: some APIs may store {items:{items:[]}}
        const normalized = (Array.isArray((d as any)?.items) ? d : { items: (d as any)?.items?.items ?? (d as any)?.items }) as MenuPayload;
        setMenu(normalized?.items ? normalized : emptyMenu);
      } catch {
        setMenu(emptyMenu);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const jsonPreview = useMemo(() => JSON.stringify(menu, null, 2), [menu]);

  // ----------- Top-level item operations -----------
  const addLink = () => setMenu((m) => ({ items: [...m.items, clone(emptyLink)] }));
  const addMega = () => setMenu((m) => ({ items: [...m.items, clone(emptyMega)] }));
  const removeItem = (index: number) =>
    setMenu((m) => ({ items: m.items.filter((_, i) => i !== index) }));
  const moveItemUp = (index: number) =>
    setMenu((m) => {
      if (index <= 0) return m;
      const next = clone(m);
      [next.items[index - 1], next.items[index]] = [next.items[index], next.items[index - 1]];
      return next;
    });
  const moveItemDown = (index: number) =>
    setMenu((m) => {
      if (index >= m.items.length - 1) return m;
      const next = clone(m);
      [next.items[index + 1], next.items[index]] = [next.items[index], next.items[index + 1]];
      return next;
    });

  // ----------- Link item editing -----------
  const updateLink = (index: number, patch: Partial<LinkItem>) =>
    setMenu((m) => {
      const next = clone(m);
      const it = next.items[index] as LinkItem;
      Object.assign(it, patch);
      return next;
    });

  // ----------- Mega item editing -----------
  const updateMega = (index: number, patch: Partial<MegaItem>) =>
    setMenu((m) => {
      const next = clone(m);
      const it = next.items[index] as MegaItem;
      Object.assign(it, patch);
      return next;
    });

  const addColumn = (i: number) =>
    setMenu((m) => {
      const next = clone(m);
      (next.items[i] as MegaItem).columns.push({ heading: "", links: [{ label: "", to: "" }] });
      return next;
    });

  const removeColumn = (i: number, ci: number) =>
    setMenu((m) => {
      const next = clone(m);
      const cols = (next.items[i] as MegaItem).columns;
      cols.splice(ci, 1);
      return next;
    });

  const updateColumn = (i: number, ci: number, patch: Partial<MegaColumn>) =>
    setMenu((m) => {
      const next = clone(m);
      Object.assign((next.items[i] as MegaItem).columns[ci], patch);
      return next;
    });

  const moveColumn = (i: number, ci: number, dir: "up" | "down") =>
    setMenu((m) => {
      const next = clone(m);
      const cols = (next.items[i] as MegaItem).columns;
      const ni = dir === "up" ? ci - 1 : ci + 1;
      if (ni < 0 || ni >= cols.length) return next;
      [cols[ci], cols[ni]] = [cols[ni], cols[ci]];
      return next;
    });

  const addMegaLink = (i: number, ci: number) =>
    setMenu((m) => {
      const next = clone(m);
      (next.items[i] as MegaItem).columns[ci].links.push({ label: "", to: "" });
      return next;
    });

  const removeMegaLink = (i: number, ci: number, li: number) =>
    setMenu((m) => {
      const next = clone(m);
      (next.items[i] as MegaItem).columns[ci].links.splice(li, 1);
      return next;
    });

  const updateMegaLink = (i: number, ci: number, li: number, patch: Partial<MegaLink>) =>
    setMenu((m) => {
      const next = clone(m);
      Object.assign((next.items[i] as MegaItem).columns[ci].links[li], patch);
      return next;
    });

  const setPromoField = (i: number, field: "title" | "text" | "to", value: string) =>
    setMenu((m) => {
      const next = clone(m);
      const mi = next.items[i] as MegaItem;
      mi.promo = mi.promo ?? { title: "", text: "", to: "" };
      (mi.promo as any)[field] = value;
      return next;
    });

  const clearPromo = (i: number) =>
    setMenu((m) => {
      const next = clone(m);
      (next.items[i] as MegaItem).promo = undefined;
      return next;
    });

  // ----------- Save -----------
  const onSave = async () => {
    setMsg(null);
    const errors = validateMenu(menu);
    if (errors.length) {
      setMsg("❌ Please fix the following:\n- " + errors.join("\n- "));
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/menus/main", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      if (!r.ok) {
        const t = await r.json().catch(() => ({}));
        throw new Error(t?.error || `HTTP ${r.status}`);
      }
      setMsg("✅ Saved. Header will reflect this via API immediately. Regenerate static JSON later for CDN.");
    } catch (e: any) {
      setMsg(`❌ Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#155ca5]">Navigation Editor</h1>
        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={saving} className="bg-[#155ca5] hover:bg-[#134a93] rounded-full px-6">
            {saving ? "Saving..." : "Save Menu"}
          </Button>
          <button
            className="text-sm text-slate-600 underline hover:text-[#155ca5]"
            onClick={() => setShowJson((s) => !s)}
          >
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
      </div>

      <p className="mb-6 text-sm text-slate-600">
        Edit your navigation JSON visually. Header loads static JSON first (CDN), then API fallback.
        This editor updates the API data immediately for preview.
      </p>

      {/* Top-level actions */}
      <div className="mb-6 flex gap-2">
        <Button variant="outline" className="rounded-full" onClick={addLink}>
          + Add Link
        </Button>
        <Button variant="outline" className="rounded-full" onClick={addMega}>
          + Add Mega Menu
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-6">
        {menu.items.map((it, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-[#155ca5]">
                  {it.type === "link" ? "🔗 Link Item" : "📋 Mega Menu"}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  #{i + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => moveItemUp(i)}
                  disabled={i === 0}
                >
                  ↑ Up
                </button>
                <button
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => moveItemDown(i)}
                  disabled={i === menu.items.length - 1}
                >
                  ↓ Down
                </button>
                <button
                  className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(i)}
                >
                  🗑 Remove
                </button>
              </div>
            </div>

            {it.type === "link" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Label</label>
                  <input
                    value={it.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                    placeholder="e.g., Home"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">URL</label>
                  <input
                    value={it.to}
                    onChange={(e) => updateLink(i, { to: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                    placeholder="/"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Mega header */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Mega Menu Label (top-level)
                  </label>
                  <input
                    value={it.label}
                    onChange={(e) => updateMega(i, { label: e.target.value })}
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                    placeholder="e.g., Shop"
                  />
                </div>

                {/* Columns */}
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-medium text-slate-700">📂 Columns</div>
                    <button
                      className="rounded-full border border-[#155ca5] bg-[#155ca5] px-4 py-2 text-xs text-white hover:bg-[#134a93]"
                      onClick={() => addColumn(i)}
                    >
                      + Add Column
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {it.columns.map((col, ci) => (
                      <div key={ci} className="rounded-lg border border-slate-300 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-semibold text-slate-700">
                            Column {ci + 1}
                          </div>
                          <div className="flex gap-1">
                            <button
                              className="rounded-full border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-50"
                              onClick={() => moveColumn(i, ci, "up")}
                              disabled={ci === 0}
                            >
                              ↑
                            </button>
                            <button
                              className="rounded-full border border-slate-300 px-2 py-1 text-[11px] hover:bg-slate-50"
                              onClick={() => moveColumn(i, ci, "down")}
                              disabled={ci === it.columns.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              className="rounded-full border border-red-300 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                              onClick={() => removeColumn(i, ci)}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Heading
                          </label>
                          <input
                            value={col.heading}
                            onChange={(e) => updateColumn(i, ci, { heading: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                            placeholder="e.g., By Category"
                          />
                        </div>

                        <div className="rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-xs font-medium text-slate-700">🔗 Links</div>
                            <button
                              className="rounded-full border border-slate-300 px-2 py-1 text-[11px] hover:bg-white"
                              onClick={() => addMegaLink(i, ci)}
                            >
                              + Add Link
                            </button>
                          </div>

                          <div className="divide-y divide-slate-200">
                            {col.links.map((lnk, li) => (
                              <div key={li} className="space-y-2 p-3">
                                <input
                                  value={lnk.label}
                                  onChange={(e) =>
                                    updateMegaLink(i, ci, li, { label: e.target.value })
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                                  placeholder="Label"
                                />
                                <input
                                  value={lnk.to}
                                  onChange={(e) => updateMegaLink(i, ci, li, { to: e.target.value })}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                                  placeholder="/path"
                                />
                                <input
                                  value={lnk.badge ?? ""}
                                  onChange={(e) =>
                                    updateMegaLink(i, ci, li, {
                                      badge: e.target.value || undefined,
                                    })
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                                  placeholder="Badge (optional, e.g., Trending)"
                                />
                                <div className="flex justify-end">
                                  <button
                                    className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                                    onClick={() => removeMegaLink(i, ci, li)}
                                  >
                                    Remove link
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-medium text-slate-700">🎯 Promotional Section (optional)</div>
                    {it.promo ? (
                      <button
                        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => clearPromo(i)}
                      >
                        Remove Promo
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                      <input
                        value={it.promo?.title ?? ""}
                        onChange={(e) => setPromoField(i, "title", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                        placeholder="Corporate Gifting"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Text</label>
                      <input
                        value={it.promo?.text ?? ""}
                        onChange={(e) => setPromoField(i, "text", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                        placeholder="Curated catalog, bulk pricing, brand-ready."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">URL</label>
                      <input
                        value={it.promo?.to ?? ""}
                        onChange={(e) => setPromoField(i, "to", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                        placeholder="/corporate-gifts"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {menu.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="text-lg font-medium text-slate-500 mb-2">No menu items yet</div>
          <div className="text-sm text-slate-400 mb-4">Add your first navigation item to get started</div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={addLink}>+ Add Link</Button>
            <Button variant="outline" onClick={addMega}>+ Add Mega Menu</Button>
          </div>
        </div>
      )}

      {/* Optional JSON power panel */}
      {showJson && (
        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold text-slate-700">JSON Preview (read-only)</div>
          <textarea
            value={jsonPreview}
            readOnly
            className="h-80 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm bg-slate-50"
            spellCheck={false}
          />
        </div>
      )}

      {/* Message */}
      {msg ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="whitespace-pre-wrap text-sm">{msg}</div>
        </div>
      ) : null}
    </div>
  );
}