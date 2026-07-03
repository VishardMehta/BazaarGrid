import { Link } from "react-router-dom";
import { Icon } from "@/components/ui";
import { SectionHeading, TrustBadge, Reveal, RevealItem, LocationBadge, useCurrentLocation } from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { useSellers } from "@/lib/hooks/useSellers";
import { useVillages } from "@/lib/hooks/useVillages";
import { mapSeller } from "@/lib/mappers";
import type { DbSeller } from "@/lib/supabase";

const TYPE_LABEL: Record<DbSeller["type"], string> = {
  VILLAGE_PRODUCER: "Village Producer",
  KIRANA_STORE:      "Kirana Store",
  FPO:                "FPO",
  SHG:                "Self Help Group",
};

export function VillagesPage() {
  const { data: dbSellers = [], isLoading } = useSellers();
  const { data: villages = [] } = useVillages();
  const loc = useCurrentLocation();

  const villageById = new Map(villages.map((v) => [v.id, v]));
  const sellers = dbSellers
    .map((s) => ({ seller: mapSeller(s), type: s.type, villageId: s.village_id }))
    .sort((a, b) => {
      if (!loc.state || !loc.district) return 0;
      const va = a.villageId ? villageById.get(a.villageId) : undefined;
      const vb = b.villageId ? villageById.get(b.villageId) : undefined;
      const aNear = va?.state === loc.state && va?.district === loc.district ? 1 : 0;
      const bNear = vb?.state === loc.state && vb?.district === loc.district ? 1 : 0;
      return bNear - aNear;
    });
  const nearCount = loc.state && loc.district
    ? sellers.filter(({ villageId }) => {
        const v = villageId ? villageById.get(villageId) : undefined;
        return v?.state === loc.state && v?.district === loc.district;
      }).length
    : 0;

  return (
    <div className="container-page py-token-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          eyebrow="The Network"
          title="Browse villages & stores"
          subtitle="Verified producers, kirana stores, FPOs, and SHGs across the grid."
        />
        <LocationBadge className="mt-1" />
      </div>
      {nearCount > 0 && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-label-md font-semibold text-secondary">
          <Icon name="near_me" size={16} /> {nearCount} in {loc.district}, {loc.state} — shown first
        </p>
      )}

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
        {sellers.map(({ seller: s, type }) => (
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
                  {TYPE_LABEL[type]}
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
