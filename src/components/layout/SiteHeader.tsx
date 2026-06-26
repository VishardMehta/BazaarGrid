import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";
import { Logo } from "./Logo";
import { useCart } from "@/features/cart/CartContext";
import { currentBuyer } from "@/shared/mocks";
import { Avatar } from "@/components/ui";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/villages", label: "Villages" },
  { to: "/become-a-producer", label: "Become a Producer" },
];

/** Public marketplace header — logo, nav, search, cart, account. */
export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-highest bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded px-3 py-2 text-body-md font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Icon
              name="search"
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search heritage goods…"
              aria-label="Search products"
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-lowest pl-10 pr-4 text-body-md placeholder:text-outline focus:border-primary focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 md:ml-0">
          <Link
            to="/rewards"
            aria-label="Harvest rewards"
            className="hidden h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-high hover:text-on-surface sm:grid"
          >
            <Icon name="favorite" size={22} />
          </Link>
          <Link
            to="/cart"
            aria-label={`Basket, ${count} items`}
            className="relative grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
          >
            <Icon name="shopping_cart" size={22} />
            {count > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-on">
                {count}
              </span>
            )}
          </Link>
          <Link to="/account" aria-label="My account" className="ml-1 hidden sm:block">
            <Avatar name={currentBuyer.name} src={currentBuyer.avatarUrl} size="sm" />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full text-on-surface lg:hidden"
          >
            <Icon name={mobileOpen ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-surface-highest bg-surface lg:hidden">
          <div className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded px-3 py-3 text-body-md font-medium",
                    isActive ? "bg-surface-high text-primary" : "text-on-surface-variant",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
