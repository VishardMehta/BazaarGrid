import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { SectionHeading, TrustBadge, Reveal, RevealItem } from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { sellers } from "@/shared/mocks";

export function VillagesPage() {
  return (
    <div className="container-page py-token-md">
      <SectionHeading
        eyebrow="The Network"
        title="Browse villages & stores"
        subtitle="Verified producers and trusted kirana stores across the grid."
      />

      <Reveal as="div" stagger={0.08} className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((s) => (
          <RevealItem key={s.id} as="article">
            <Link
              to={`/seller/${s.id}`}
              className="group block overflow-hidden rounded-lg border border-surface-highest bg-surface-lowest transition-all hover:border-primary hover:shadow-tinted"
            >
              <div className="relative aspect-[16/9]" style={{ backgroundImage: gradientFor(s.id) }}>
                <div className="absolute inset-0 grid place-items-center">
                  <Icon name={s.type === "KIRANA_STORE" ? "storefront" : "cottage"} size={52} className="text-surface-lowest/40" />
                </div>
                {s.verified && <TrustBadge kind="verified" compact className="absolute right-3 top-3" />}
                <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface backdrop-blur">
                  {s.type === "KIRANA_STORE" ? "Kirana" : "Producer"}
                </span>
              </div>
              <div className="p-token-md">
                <h3 className="font-serif text-headline-md font-medium text-on-surface group-hover:text-primary">
                  {s.name}
                </h3>
                <p className="mt-1 inline-flex items-center gap-1 text-label-md text-on-surface-variant">
                  <Icon name="location_on" size={14} /> {s.village}
                </p>
                <p className="mt-2 line-clamp-2 text-body-md text-on-surface-variant">{s.tagline}</p>
                <div className="mt-3 flex items-center justify-between text-label-md">
                  <span className="inline-flex items-center gap-1 text-on-surface-variant">
                    <Icon name="grade" size={16} className="text-tertiary-fixed-dim" filled /> {s.rating}
                  </span>
                  <span className="font-semibold text-secondary">{s.productCount} products</span>
                </div>
              </div>
            </Link>
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}
