import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { SectionHeading, TrustBadge, Reveal, RevealItem } from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { useSellers } from "@/lib/hooks/useSellers";
import { mapSeller } from "@/lib/mappers";

export function VillagesPage() {
  const { data: dbSellers = [], isLoading } = useSellers();
  const sellers = dbSellers.map(mapSeller);

  return (
    <div className="container-page py-token-md">
      <SectionHeading
        eyebrow="The Network"
        title="Browse villages & stores"
        subtitle="Verified producers and trusted kirana stores across the grid."
      />

      {isLoading ? (
        <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-surface-low" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="mt-token-md py-16 text-center text-on-surface-variant">No sellers found.</div>
      ) : (
      // key on count forces a fresh mount once data arrives so the reveal plays with items present
      <Reveal key={sellers.length} as="div" stagger={0.08} className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((s) => (
          <RevealItem key={s.id} as="article">
            <Link
              to={`/seller/${s.id}`}
              className="group block overflow-hidden rounded-lg border border-surface-highest bg-surface-lowest transition-all hover:border-primary hover:shadow-tinted"
            >
              <div className="relative aspect-[16/9]" style={{ backgroundImage: gradientFor(s.id) }}>
                <div className="absolute inset-0 grid place-items-center">
                  <Icon name="cottage" size={52} className="text-surface-lowest/40" />
                </div>
                {s.verified && <TrustBadge kind="verified" compact className="absolute right-3 top-3" />}
                <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface backdrop-blur">
                  Producer
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
                    <Icon name="grade" size={16} className="text-tertiary-fixed-dim" filled /> {s.rating ?? "—"}
                  </span>
                  <span className="font-semibold text-secondary">{s.traceabilityScore}% traced</span>
                </div>
              </div>
            </Link>
          </RevealItem>
        ))}
      </Reveal>
      )}
    </div>
  );
}
