import { useEffect, useState } from "react";
import { NavMenu } from "./NavMenu";

interface LegacyNavLink {
  label: string;
  href: string;
  position: number;
}

interface NavLink {
  id: string;
  label: string;
  href?: string;
  children?: NavLink[];
  isMega?: boolean;
}

interface NavResponse {
  links: LegacyNavLink[]; // Legacy format for backward compatibility
  items: NavLink[];      // New nested format
}

const FALLBACK_ITEMS: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "diwali", label: "Diwali Gifts", href: "/diwali" },
  { id: "anniversary", label: "Anniversary", href: "/anniversary" },
  { id: "father", label: "Gifts for Father", href: "/gifts-for-father" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavLink[]>(FALLBACK_ITEMS);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/nav/links", { signal: ac.signal })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.text())))
      .then((d: NavResponse) => {
        // Use new nested format if available, otherwise fallback to legacy
        const items = d?.items || [];
        if (items.length) {
          setNavItems(items);
        } else {
          // Convert legacy format to new format
          const legacyLinks = d?.links || [];
          if (legacyLinks.length) {
            const convertedItems: NavLink[] = legacyLinks.map((link, index) => ({
              id: link.label.toLowerCase().replace(/\s+/g, '-'),
              label: link.label,
              href: link.href === "#" ? undefined : link.href,
            }));
            setNavItems(convertedItems);
          }
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => ac.abort();
  }, []);

  return (
    
<header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">

      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center gap-4">
          <a href="/" className="inline-flex items-center">
            <img
              src="https://www.giftsmate.net/wp-content/uploads/2025/06/giftsmate-logo.png"
              alt="GiftsMate"
              className="h-20 w-auto object-contain p-[5px]"
            />
          </a>

          <NavMenu items={navItems} className="ml-2" />

          <button
            aria-label="Open menu"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-[#155ca5] hover:bg-white/60 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t bg-white md:hidden">
          <div className="container mx-auto px-4 py-2">
            <NavMenu items={navItems} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
