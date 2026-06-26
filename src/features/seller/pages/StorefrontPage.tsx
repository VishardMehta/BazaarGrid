import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ButtonLink, Card, Icon } from "@/components/ui";
import {
  ProductCard,
  SectionHeading,
  TrustBadge,
  TraceabilityScore,
  Reveal,
  RevealItem,
} from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { getSellerById, getProductsBySeller } from "@/shared/mocks";
import { useCart } from "@/features/cart/CartContext";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

const REVIEWS = [
  { name: "Priya N.", text: "The honey tastes like the meadow it came from. Scanning the passport sealed my trust.", rating: 5 },
  { name: "Daniel R.", text: "Fast village pickup and genuinely traceable. This is how local commerce should feel.", rating: 5 },
  { name: "Aisha K.", text: "Beautiful packaging, honest sourcing. I've reordered three times now.", rating: 4 },
];

export function StorefrontPage() {
  const { sellerId } = useParams();
  const seller = sellerId ? getSellerById(sellerId) : undefined;
  const { add } = useCart();

  if (!seller) return <NotFoundPage />;
  const products = getProductsBySeller(seller.id).filter((p) => p.status === "LIVE");
  const isKirana = seller.type === "KIRANA_STORE";

  return (
    <div className="pb-token-lg">
      {/* Hero banner */}
      <section
        className="relative h-64 md:h-80"
        style={{ backgroundImage: gradientFor(seller.id + "banner") }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent" />
        <div className="container-page relative flex h-full flex-col justify-end pb-token-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface/90 px-3 py-1 text-label-md font-semibold text-on-surface backdrop-blur">
              {isKirana ? "Kirana Store" : "Heritage Village"}
            </span>
            {seller.verified && <TrustBadge kind="verified" />}
          </div>
          <h1 className="mt-3 font-serif text-display-lg text-[2.75rem] font-semibold leading-none text-surface">
            {seller.name}
          </h1>
          <p className="mt-2 max-w-xl text-body-lg text-surface/90">{seller.tagline}</p>
        </div>
      </section>

      {/* Stats + actions */}
      <section className="container-page -mt-8 relative">
        <Card padding="md" className="flex flex-wrap items-center justify-between gap-token-md shadow-tinted">
          <div className="flex flex-wrap gap-token-lg">
            {[
              [String(products.length), "Live products"],
              [`${seller.traceabilityScore ?? "—"}%`, "Traceability"],
              [`${seller.rating ?? "—"}★`, `${seller.reviewCount ?? 0} reviews`],
              [seller.region ?? seller.village, "Region"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-serif text-headline-md font-semibold text-on-surface">{n}</p>
                <p className="text-label-sm text-on-surface-variant">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <ButtonLink to={`/producer/${seller.id}`} variant="secondary" icon="person">
              Meet the producer
            </ButtonLink>
            <ButtonLink to="/shop" icon="storefront">Shop all</ButtonLink>
          </div>
        </Card>
      </section>

      {/* Living legacy / story */}
      <section className="container-page grid gap-token-md py-token-lg md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-label-md uppercase tracking-[0.1em] text-primary">The Living Legacy</p>
          <h2 className="mt-2 font-serif text-headline-lg font-medium text-on-surface">
            Rooted in {seller.village}
          </h2>
          <p className="mt-4 text-body-lg leading-relaxed text-on-surface-variant">{seller.story}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {seller.certifications?.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-low px-3 py-1.5 text-label-md text-on-surface-variant"
              >
                <Icon name={c.icon ?? "verified"} size={16} className="text-secondary" />
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <TraceabilityScore score={seller.traceabilityScore ?? 90} className="self-start" />
      </section>

      {/* Products */}
      <section className="bg-surface-low py-token-lg">
        <div className="container-page">
          <SectionHeading eyebrow="Curated Collections" title="From this storefront" />
          <Reveal as="div" stagger={0.06} className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} onAdd={add} />
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Community trust */}
      <section className="container-page py-token-lg">
        <SectionHeading eyebrow="Community Trust" title="What buyers are saying" />
        <div className="mt-token-md grid gap-token-md md:grid-cols-3">
          {REVIEWS.map((r) => (
            <motion.blockquote
              key={r.name}
              whileHover={{ y: -3 }}
              className="rounded-lg border border-surface-highest bg-surface-lowest p-token-md"
            >
              <div className="flex text-tertiary-fixed-dim">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={16} filled={i < r.rating} />
                ))}
              </div>
              <p className="mt-3 text-body-md text-on-surface">“{r.text}”</p>
              <footer className="mt-3 inline-flex items-center gap-1 text-label-md font-semibold text-on-surface-variant">
                <Icon name="verified" size={14} className="text-secondary" filled /> {r.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
        <div className="mt-token-md text-center">
          <Link to="/become-a-producer" className="text-label-md font-semibold text-secondary hover:text-primary">
            Want a storefront like this? Become a producer →
          </Link>
        </div>
      </section>
    </div>
  );
}
