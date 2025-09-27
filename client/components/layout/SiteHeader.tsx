import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { fetchStaticFirst } from "@/lib/staticFirst";

type NavItem =
  | { type: "link"; label: string; to: string }
  | {
      type: "mega";
      label: string;
      columns: Array<{
        heading: string;
        links: Array<{ label: string; to: string; badge?: string }>;
      }>;
      promo?: { title: string; text: string; to: string };
    };

// Fallback NAV used if static JSON is missing
const FALLBACK_NAV: NavItem[] = [
  { type: "link", label: "Home", to: "/" },
  {
    type: "mega",
    label: "Shop",
    columns: [
      {
        heading: "By Relationship",
        links: [
          { label: "Gifts for Him", to: "/gifts-him" },
          { label: "Gifts for Her", to: "/gifts-her" },
          { label: "For Parents", to: "/parents" },
          { label: "For Kids", to: "/kids" }
        ]
      },
      {
        heading: "By Occasion",
        links: [
          { label: "Diwali Gifts", to: "/diwali-gifts", badge: "Trending" },
          { label: "Birthday", to: "/birthday" },
          { label: "Anniversary", to: "/anniversary" },
          { label: "Housewarming", to: "/housewarming" }
        ]
      },
      {
        heading: "By Category",
        links: [
          { label: "Personalized", to: "/personalized" },
          { label: "Home & Decor", to: "/home-decor" },
          { label: "Office & Desk", to: "/office-desk" },
          { label: "Accessories", to: "/accessories" }
        ]
      }
    ],
    promo: {
      title: "Corporate Gifting",
      text: "Curated catalog, bulk pricing, brand-ready.",
      to: "/corporate-gifts"
    }
  },
  { type: "link", label: "Corporate Gifts", to: "/corporate-gifts" },
  { type: "link", label: "Diwali Gifts", to: "/diwali-gifts" }
];

function MegaPanel({
  id,
  columns,
  promo,
}: {
  id: string;
  columns: Array<{ heading: string; links: Array<{ label: string; to: string; badge?: string }> }>;
  promo?: { title: string; text: string; to: string };
}) {
  return (
    <div
      id={id}
      role="menu"
      aria-label="Shop menu"
      tabIndex={-1}
      className="absolute left-1/2 top-full z-[60] w-[min(1100px,90vw)] -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white/98 p-6 shadow-2xl backdrop-blur-sm supports-[backdrop-filter]:bg-white/90"
    >
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col, idx) => (
          <div key={idx} className="min-w-0">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {col.heading}
            </h4>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <a
                    href={l.to}
                    role="menuitem"
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-slate-800 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155ca5]/30"
                  >
                    <span className="truncate">{l.label}</span>
                    {l.badge ? (
                      <span className="ml-2 rounded-full bg-[#DBEBFF] px-2 py-0.5 text-[11px] font-medium text-[#155ca5]">
                        {l.badge}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {promo ? (
          <div className="col-span-3 mt-4 rounded-xl border border-slate-200/70 bg-gradient-to-br from-[#DBEBFF]/60 to-white p-4 sm:col-span-1 sm:mt-0">
            <div className="text-sm font-semibold text-slate-900">{promo.title}</div>
            <p className="mt-1 text-sm text-slate-700">{promo.text}</p>
            <a
              href={promo.to}
              className="mt-3 inline-flex rounded-full bg-[#155ca5] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#134a93]"
            >
              Explore
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaHover, setMegaHover] = useState(false);
  // Runtime NAV state
  const [nav, setNav] = useState<NavItem[]>(FALLBACK_NAV);

  // Close mega on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile menu on route change (optional safety if you use router navigation elsewhere)
  useEffect(() => {
    const closeOnHash = () => setOpen(false);
    window.addEventListener("hashchange", closeOnHash);
    return () => window.removeEventListener("hashchange", closeOnHash);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
  }, [open]);

  // Load navigation menu (static-first)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // Static-first: try CDN JSON, fallback (optional) to /api/menus/main
        const data = await fetchStaticFirst<{ items: NavItem[] }>(
          "/content/menus/main.json",
          "/api/menus/main",
          ac.signal
        );
        if (data?.items?.length) setNav(data.items);
      } catch {
        // ignore, fallback already in state
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          {/* If you have a logo image, drop it here */}
          {/* <img src="/logo.svg" alt="Giftsmate" className="h-7 w-auto" /> */}
          <span className="text-lg font-extrabold tracking-tight text-slate-900">Giftsmate</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="relative hidden items-center gap-6 lg:flex"
          onMouseLeave={() => {
            setMegaHover(false);
            setTimeout(() => !megaHover && setMegaOpen(false), 60);
          }}
        >
          {nav.map((item, idx) => {
            if (item.type === "link") {
              return (
                <a
                  key={idx}
                  href={item.to}
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
                >
                  {item.label}
                </a>
              );
            }

            // type === 'mega'
            return (
              <div
                key={idx}
                className="relative"
                onMouseEnter={() => {
                  setMegaHover(true);
                  setMegaOpen(true);
                }}
              >
                <button
                  type="button"
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155ca5]/40 rounded-md px-1"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  aria-controls="mega-shop"
                  onFocus={() => setMegaOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      setMegaOpen(true);
                      // move focus into panel on ArrowDown
                      const first = document.querySelector<HTMLAnchorElement>('#mega-shop a, #mega-shop button');
                      first?.focus();
                    }
                  }}
                >
                  {item.label}
                </button>

                {/* Mega dropdown (desktop only) */}
                {megaOpen && (
                  <div
                    onMouseEnter={() => setMegaHover(true)}
                    onMouseLeave={() => {
                      setMegaHover(false);
                      setTimeout(() => !megaHover && setMegaOpen(false), 80);
                    }}
                  >
                    <MegaPanel id="mega-shop" columns={item.columns} promo={item.promo} />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop right-side actions (optional placeholder) */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* e.g., account/cart buttons can go here */}
          {/* <Link to="/cart" className="rounded-full border px-3 py-1.5 text-sm">Cart</Link> */}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex items-center justify-center rounded-full border border-slate-300/70 bg-white/80 p-2 text-slate-700 shadow-sm transition hover:bg-white/90 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      {/* Desktop overlay to close mega menu on outside click */}
      {megaOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] hidden bg-black/10 lg:block"
          aria-label="Close menu overlay"
          onClick={() => setMegaOpen(false)}
        />
      )}

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        className={clsx(
          "lg:hidden border-t border-slate-200/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-[max-height,opacity] duration-200 ease-out overflow-hidden",
          open ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container mx-auto px-4 py-3 sm:px-6">
          <ul className="flex flex-col divide-y divide-slate-200/60">
            {nav.map((item, i) => {
              if (item.type === "link") {
                return (
                  <li key={i}>
                    <a
                      href={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-3 text-base text-slate-800"
                    >
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              }

              // type === 'mega' -> flatten
              return (
                <li key={i} className="py-2">
                  <div className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {item.columns.map((col, ci) => (
                      <div key={ci}>
                        <div className="py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {col.heading}
                        </div>
                        <ul className="divide-y divide-slate-200/60 rounded-lg border border-slate-200/60">
                          {col.links.map((l) => (
                            <li key={l.to}>
                              <a
                                href={l.to}
                                onClick={() => setOpen(false)}
                                className="flex items-center justify-between px-3 py-2 text-[15px] text-slate-800"
                              >
                                <span>{l.label}</span>
                                {l.badge ? (
                                  <span className="ml-2 rounded-full bg-[#DBEBFF] px-2 py-0.5 text-[11px] font-medium text-[#155ca5]">
                                    {l.badge}
                                  </span>
                                ) : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {item.promo ? (
                      <a
                        href={item.promo.to}
                        onClick={() => setOpen(false)}
                        className="mt-2 rounded-lg border border-slate-200/60 bg-[#DBEBFF]/40 p-3 text-slate-800"
                      >
                        <div className="text-sm font-semibold">{item.promo.title}</div>
                        <div className="text-sm">{item.promo.text}</div>
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Optional: sticky actions at bottom of sheet */}
          {/* <div className="mt-3 flex gap-3">
            <Link to="/cart" className="flex-1 rounded-full border px-4 py-2 text-sm text-slate-700">Cart</Link>
            <Link to="/account" className="flex-1 rounded-full bg-[#155ca5] px-4 py-2 text-sm font-semibold text-white">Account</Link>
          </div> */}
        </nav>
      </div>
    </header>
  );
}