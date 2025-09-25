import { useEffect, useState } from "react";

interface NavLink {
  label: string;
  href: string;
  position: number;
}
const FALLBACK_LINKS: NavLink[] = [
  { label: "Home", href: "/", position: 0 },
  { label: "Diwali Gifts", href: "/diwali", position: 1 },
  { label: "Anniversary", href: "/anniversary", position: 2 },
  { label: "Gifts for Father", href: "/gifts-for-father", position: 3 },
  { label: "Admin", href: "/admin", position: 999 },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<NavLink[]>(FALLBACK_LINKS);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/nav/links", { signal: ac.signal })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.text())))
      .then((d) => {
        const list = (d?.links as NavLink[]) || [];
        if (list.length) setLinks(list);
      })
      .catch(() => {})
      .finally(() => {});
    return () => ac.abort();
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b bg-[#DBEBFF]">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center gap-4">
          <a href="/" className="inline-flex items-center">
            <img
              src="https://www.giftsmate.net/wp-content/uploads/2025/06/giftsmate-logo.png"
              alt="GiftsMate"
              className="h-20 w-auto object-contain p-[5px]"
            />
          </a>

          <nav className="ml-2 hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-[#155ca5] hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>

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
          <div className="container mx-auto flex flex-col px-4 py-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-[#155ca5] hover:bg-[#DBEBFF]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
