import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon, Avatar } from "@/components/ui";
import { Logo } from "./Logo";
import { useCart } from "@/features/cart/CartContext";
import { useAuth } from "@/features/auth/AuthContext";
import { redirectPathForRole } from "@/features/auth/redirectForRole";
import { SearchBar } from "@/features/search/components/SearchBar";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/villages", label: "Villages" },
  { to: "/become-a-producer", label: "Become a Producer" },
];

/** Public marketplace header — logo, nav, search, favorites, cart, account. */
export function SiteHeader() {
  const { count } = useCart();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const portalPath = profile ? redirectPathForRole(profile.role, profile.status) : "/";
  const showPortalLink = profile && profile.role !== "BUYER" && profile.status === "ACTIVE";

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/");
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
                  isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
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
            to="/favorites"
            aria-label="My favorites"
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

          {/* Account menu */}
          {user ? (
            <div className="relative ml-1 hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="grid place-items-center rounded-full ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Avatar name={profile?.name ?? user.email ?? "Me"} src={profile?.avatar_url ?? undefined} size="sm" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-surface-highest bg-surface shadow-tinted"
                >
                  <div className="border-b border-surface-highest px-4 py-3">
                    <p className="truncate text-body-md font-semibold text-on-surface">{profile?.name ?? "My account"}</p>
                    <p className="truncate text-label-sm text-on-surface-variant">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <MenuLink to="/account" icon="person"       label="My profile"       onClick={() => setMenuOpen(false)} />
                    <MenuLink to="/orders"  icon="receipt_long" label="My orders"         onClick={() => setMenuOpen(false)} />
                    <MenuLink to="/rewards" icon="redeem"       label="Harvest rewards"   onClick={() => setMenuOpen(false)} />
                    {showPortalLink && (
                      <MenuLink to={portalPath} icon="dashboard" label="My portal" onClick={() => setMenuOpen(false)} />
                    )}
                  </div>
                  <div className="border-t border-surface-highest py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-md text-error hover:bg-surface-low"
                    >
                      <Icon name="logout" size={18} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 hidden rounded-full bg-primary px-4 py-2 text-label-md font-semibold text-primary-on hover:opacity-90 sm:block"
            >
              Sign in
            </Link>
          )}

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
            <div className="my-1 h-px bg-surface-highest" />
            {user ? (
              <>
                <MobileLink to="/account" label="My profile" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/orders" label="My orders" onClick={() => setMobileOpen(false)} />
                <MobileLink to="/favorites" label="Favorites" onClick={() => setMobileOpen(false)} />
                {showPortalLink && <MobileLink to={portalPath} label="My portal" onClick={() => setMobileOpen(false)} />}
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="rounded px-3 py-3 text-left text-body-md font-medium text-error"
                >
                  Sign out
                </button>
              </>
            ) : (
              <MobileLink to="/login" label="Sign in" onClick={() => setMobileOpen(false)} />
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MenuLink({ to, icon, label, onClick }: { to: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-low"
    >
      <Icon name={icon} size={18} className="text-on-surface-variant" /> {label}
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="rounded px-3 py-3 text-body-md font-medium text-on-surface-variant">
      {label}
    </Link>
  );
}
