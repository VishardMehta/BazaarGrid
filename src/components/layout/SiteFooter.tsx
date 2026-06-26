import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Shop All", to: "/shop" },
      { label: "Villages", to: "/villages" },
      { label: "Become a Producer", to: "/become-a-producer" },
      { label: "Harvest Rewards", to: "/rewards" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About BazaarGrid", to: "/about" },
      { label: "Sustainability Report", to: "/about" },
      { label: "Partner Portal", to: "/operator" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", to: "/help" },
      { label: "Traceability Guide", to: "/help" },
      { label: "Privacy Policy", to: "/help" },
      { label: "Terms of Service", to: "/help" },
    ],
  },
];

/** Marketplace footer with newsletter + sitemap. */
export function SiteFooter() {
  return (
    <footer className="mt-token-xl border-t border-surface-highest bg-surface-low">
      <div className="container-page grid gap-token-lg py-token-lg md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-body-md text-on-surface-variant">
            Connecting heritage craftsmanship with modern precision through a
            decentralised marketplace of verified producers.
          </p>
          <form
            className="mt-4 flex max-w-sm overflow-hidden rounded-full border border-outline-variant bg-surface-lowest"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Join the journey — your email"
              aria-label="Email address"
              className="h-11 flex-1 bg-transparent px-4 text-body-md placeholder:text-outline focus:outline-none"
            />
            <button
              type="submit"
              className="m-1 grid w-11 place-items-center rounded-full bg-primary text-primary-on transition-colors hover:bg-primary-container"
              aria-label="Subscribe"
            >
              <Icon name="arrow_forward" size={18} />
            </button>
          </form>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="mb-3 text-label-md font-semibold uppercase tracking-[0.08em] text-on-surface">
              {col.heading}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-body-md text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-surface-highest">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-label-sm text-on-surface-variant sm:flex-row">
          <p>© {new Date().getFullYear()} BazaarGrid. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Icon name="public" size={18} />
            <Icon name="eco" size={18} />
            <span>Carbon-neutral delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
