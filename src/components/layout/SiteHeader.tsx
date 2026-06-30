import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";
import { Logo } from "./Logo";
import { useCart } from "@/features/cart/CartContext";
import { currentBuyer } from "@/shared/mocks";
import { Avatar } from "@/components/ui";
import { SearchBar } from "@/features/search/components/SearchBar";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/villages", label: "Villages" },
  { to: "/become-a-producer", label: "Become a Producer" },
];

/** Public marketplace header — logo, nav, search, cart, account. */
export function SiteHeader() {
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

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

        <SearchBar className="ml-auto hidden max-w-xs flex-1 md:block" />

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
