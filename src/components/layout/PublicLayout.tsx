import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PageTransition } from "./PageTransition";

/** Shell for all public marketplace pages: header + animated outlet + footer. */
export function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="flex-1">
        {/* key by path so the enter transition replays on each navigation */}
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
