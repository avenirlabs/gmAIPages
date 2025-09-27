import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

/**
 * Simple nav model.
 * If you already load nav items from your backend, replace NAV with that data.
 */
const NAV: Array<{ label: string; to: string }> = [
  { label: "Home", to: "/" },
  { label: "Corporate Gifts", to: "/corporate-gifts" },
  { label: "Gifts for Him", to: "/gifts-him" },
  { label: "Diwali Gifts", to: "/diwali-gifts" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "text-sm font-medium transition",
                  isActive
                    ? "text-[#155ca5]"
                    : "text-slate-700 hover:text-slate-900"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
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
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center justify-between py-3 text-base",
                      isActive
                        ? "font-semibold text-[#155ca5]"
                        : "text-slate-800"
                    )
                  }
                >
                  <span>{item.label}</span>
                  {/* chevron could be added here if you have nested items */}
                </NavLink>
              </li>
            ))}
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