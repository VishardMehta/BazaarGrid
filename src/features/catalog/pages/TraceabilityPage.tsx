import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Icon, Rating, Avatar } from "@/components/ui";
import {
  Breadcrumbs,
  Reveal,
  RevealItem,
  TraceabilityScore,
  TrustBadge,
  ProductThumb,
} from "@/components/shared";
import { formatDate, formatMonthYear } from "@/lib/format";
import { useProduct } from "@/lib/hooks/useProducts";
import { useSeller } from "@/lib/hooks/useSellers";
import { useVillage } from "@/lib/hooks/useVillages";
import { mapProduct, mapSeller } from "@/lib/mappers";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildTimeline(createdAt: string, category: string) {
  const harvestLabel =
    category === "HONEY" ? "Harvested from hives" :
    category === "OILS"  ? "Harvested & cold-pressed" :
    category === "DAIRY" ? "Sourced from farm" :
    category === "GRAINS" ? "Harvested from fields" :
    category === "TEXTILES" ? "Yarn sourced & dyed" :
    "Sourced";

  return [
    {
      label: harvestLabel,
      date: addDays(createdAt, -30),
      description: "Raw material collected by the producer at the source.",
      done: true,
      icon: "agriculture",
    },
    {
      label: "Processed",
      date: addDays(createdAt, -22),
      description: "Cleaned, processed and prepared using traditional methods.",
      done: true,
      icon: "factory",
    },
    {
      label: "Packed & Sealed",
      date: addDays(createdAt, -15),
      description: "Batch packed, labelled, and sealed for freshness.",
      done: true,
      icon: "inventory_2",
    },
    {
      label: "Quality Verified",
      date: addDays(createdAt, -7),
      description: "Inspected and approved by the village quality council.",
      done: true,
      icon: "verified",
    },
    {
      label: "Listed on BazaarGrid",
      date: createdAt,
      description: "Provenance recorded on the trust ledger. Available to order.",
      done: true,
      icon: "storefront",
    },
  ];
}

export function TraceabilityPage() {
  const { productId } = useParams();
  const { data: dbProduct, isLoading: loadingProduct } = useProduct(productId);
  const { data: dbSeller, isLoading: loadingSeller } = useSeller(dbProduct?.seller_id ?? undefined);
  const { data: dbVillage } = useVillage(dbSeller?.village_id ?? undefined);

  const loading = loadingProduct || loadingSeller;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (!dbProduct || !dbProduct.traceable) return <NotFoundPage />;

  const product = mapProduct(dbProduct);
  const seller  = dbSeller ? mapSeller(dbSeller) : undefined;
  const timeline = buildTimeline(dbProduct.created_at, dbProduct.category);
  const batchId  = dbProduct.batch_id ?? `BG-${dbProduct.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="container-page py-token-md">
      <Breadcrumbs
        className="mb-token-md"
        items={[
          { label: "Shop", to: "/shop" },
          { label: product.name, to: `/product/${product.id}` },
          { label: "Product Passport" },
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-surface-highest bg-surface-low"
      >
        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="p-token-md md:p-10">
            <p className="text-label-md uppercase tracking-[0.15em] text-primary">
              Official Product Passport
            </p>
            <h1 className="mt-2 font-serif text-[2rem] font-semibold leading-tight text-on-surface md:text-[2.5rem]">
              {product.name}
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">Batch · {batchId}</p>

            <div className="mt-token-sm flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-label-md font-semibold text-secondary-on-container">
                <Icon name="verified" size={16} filled /> Verified Authentic
              </span>
              {product.organic && <TrustBadge kind="organic" />}
              {product.traceable && <TrustBadge kind="traceable" />}
            </div>

            <div className="mt-token-md flex flex-wrap gap-token-sm text-label-md text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="category" size={16} className="text-secondary" />
                {product.category.charAt(0) + product.category.slice(1).toLowerCase()}
              </span>
              {seller && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="location_on" size={16} className="text-secondary" />
                  {seller.village}{seller.region ? `, ${seller.region}` : ""}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar_today" size={16} className="text-secondary" />
                Listed {formatDate(dbProduct.created_at)}
              </span>
            </div>
          </div>

          <div className="hidden w-56 md:block">
            <ProductThumb
              product={product}
              rounded="rounded-none"
              className="h-full w-full"
              iconSize={72}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Meet the Producer + Origin Village ───────────────────────── */}
      <div className="mt-token-md grid gap-token-md md:grid-cols-2">

        {/* Meet the Producer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-token-sm rounded-2xl border border-surface-highest bg-surface-lowest p-token-md"
        >
          <p className="text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
            Meet the Producer
          </p>

          {seller ? (
            <>
              <div className="flex items-start gap-4">
                <Avatar name={seller.name} src={seller.avatarUrl} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-headline-lg font-semibold text-on-surface">
                      {seller.name}
                    </h2>
                    {seller.verified && (
                      <Icon name="verified" size={20} filled className="text-secondary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-body-md text-on-surface-variant">
                    {seller.type === "VILLAGE_PRODUCER" ? "Village Producer" : "Kirana Store"}
                  </p>
                  {seller.tagline && (
                    <p className="mt-1 text-body-md italic text-on-surface-variant">
                      "{seller.tagline}"
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-low p-3">
                  <p className="text-label-sm text-on-surface-variant">Village</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-serif text-body-lg font-medium text-on-surface">
                    <Icon name="cottage" size={16} className="text-primary" />
                    {seller.village}
                  </p>
                </div>
                {seller.memberSince && (
                  <div className="rounded-lg bg-surface-low p-3">
                    <p className="text-label-sm text-on-surface-variant">Member since</p>
                    <p className="mt-0.5 font-serif text-body-lg font-medium text-on-surface">
                      {formatMonthYear(seller.memberSince)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {seller.rating ? (
                  <Rating value={seller.rating} count={seller.reviewCount} size={16} />
                ) : null}
                {seller.traceabilityScore != null && (
                  <TraceabilityScore score={seller.traceabilityScore} variant="ring" caption="Traceability" />
                )}
              </div>

              {seller.story && (
                <p className="border-t border-surface-highest pt-token-sm text-body-md leading-relaxed text-on-surface-variant">
                  {seller.story}
                </p>
              )}

              <Link
                to={`/producer/${seller.id}`}
                className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg border border-surface-highest px-4 py-2 text-label-md font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="storefront" size={16} />
                Visit storefront
              </Link>
            </>
          ) : (
            <div className="grid h-40 place-items-center text-on-surface-variant">
              <span className="text-body-md">Producer info unavailable</span>
            </div>
          )}
        </motion.div>

        {/* Origin Village */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="flex flex-col gap-token-sm rounded-2xl bg-primary p-token-md text-primary-on"
        >
          <p className="text-label-sm uppercase tracking-[0.12em] text-primary-on/75">
            Origin Village
          </p>

          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-on/10">
              <Icon name="cottage" size={24} className="text-primary-on" />
            </span>
            <div>
              <h2 className="font-serif text-headline-lg font-semibold text-primary-on">
                {dbVillage?.name ?? seller?.village ?? "—"}
              </h2>
              {(dbVillage?.region ?? seller?.region) && (
                <p className="text-label-md text-primary-on/80">
                  {dbVillage?.region ?? seller?.region}
                </p>
              )}
            </div>
          </div>

          {dbVillage ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-primary-on/10 p-3 text-center">
                  <p className="font-serif text-headline-md font-semibold text-primary-on">
                    {dbVillage.producer_count}
                  </p>
                  <p className="text-label-sm text-primary-on/75">Producers</p>
                </div>
                <div className="rounded-lg bg-primary-on/10 p-3 text-center">
                  <p className="font-serif text-headline-md font-semibold text-primary-on">
                    {dbVillage.product_count}
                  </p>
                  <p className="text-label-sm text-primary-on/75">Products</p>
                </div>
                <div className="rounded-lg bg-primary-on/10 p-3 text-center">
                  <p className="font-serif text-headline-md font-semibold text-primary-on">
                    {dbVillage.traceability_score}%
                  </p>
                  <p className="text-label-sm text-primary-on/75">Traceability</p>
                </div>
              </div>
              {dbVillage.description && (
                <p className="text-body-md leading-relaxed text-primary-on/85">
                  {dbVillage.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-body-md leading-relaxed text-primary-on/85">
              {seller?.story ??
                "A rural village committed to sustainable farming and traditional craft. Every product carries the spirit of the land it was made in."}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-3 border-t border-primary-on/20 pt-token-sm">
            <span className="inline-flex items-center gap-1.5 text-label-md text-primary-on/80">
              <Icon name="eco" size={16} filled /> Sustainable sourcing
            </span>
            <span className="inline-flex items-center gap-1.5 text-label-md text-primary-on/80">
              <Icon name="handshake" size={16} /> Fair trade
            </span>
            <span className="inline-flex items-center gap-1.5 text-label-md text-primary-on/80">
              <Icon name="location_on" size={16} filled /> Geo-verified
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Product Journey ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26 }}
        className="mt-token-md rounded-2xl border border-surface-highest bg-surface-lowest p-token-md"
      >
        <h2 className="font-serif text-headline-md font-medium text-on-surface">
          Product Journey
        </h2>
        <p className="text-body-md text-on-surface-variant">
          From source to your door — every step verified.
        </p>

        <Reveal as="ul" stagger={0.08} className="mt-token-md relative">
          {/* connecting line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-surface-highest" />

          {timeline.map((step, i) => (
            <RevealItem
              key={step.label}
              as="div"
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              <span
                className={`relative z-10 mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-surface-lowest ${
                  step.done
                    ? i === timeline.length - 1
                      ? "bg-primary text-primary-on"
                      : "bg-secondary text-secondary-on"
                    : "bg-surface-high text-outline"
                }`}
              >
                <Icon name={step.icon} size={18} filled={step.done} />
              </span>
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="font-serif text-body-lg font-medium text-on-surface">
                    {step.label}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {formatDate(step.date)}
                  </p>
                </div>
                <p className="mt-0.5 text-body-md text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </motion.div>

      {/* ── Batch Specs + QR ─────────────────────────────────────────── */}
      <div className="mt-token-md grid gap-token-md md:grid-cols-[1fr_auto]">

        {/* Batch Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="rounded-2xl border border-surface-highest bg-surface-lowest p-token-md"
        >
          <h2 className="font-serif text-headline-md font-medium text-on-surface">
            Batch Specifications
          </h2>
          <dl className="mt-token-sm divide-y divide-surface-highest">
            {[
              { label: "Batch ID",    value: batchId },
              { label: "Category",    value: product.category.charAt(0) + product.category.slice(1).toLowerCase() },
              { label: "Unit",        value: product.unit },
              { label: "Organic",     value: product.organic ? "Yes — certified" : "No" },
              { label: "Traceable",   value: product.traceable ? "Full chain" : "Partial" },
              ...(product.tags?.length ? [{ label: "Tags", value: product.tags.join(", ") }] : []),
              { label: "Listed",      value: formatDate(dbProduct.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 text-body-md">
                <dt className="text-on-surface-variant">{label}</dt>
                <dd className="font-medium text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Heritage & craft */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="flex w-full flex-col gap-3 rounded-2xl bg-secondary p-token-md text-secondary-on md:w-80"
        >
          <p className="text-label-sm uppercase tracking-[0.12em] text-secondary-on/75">
            Heritage &amp; Purity
          </p>
          <p className="text-body-md leading-relaxed text-secondary-on/90">
            {product.story ??
              product.description ??
              "Crafted in small batches using traditional methods passed down through generations."}
          </p>
          <div className="mt-auto border-t border-secondary-on/20 pt-3">
            <p className="inline-flex items-center gap-1.5 text-label-md text-secondary-on/85">
              <Icon name="qr_code_2" size={16} />
              The QR on your product label opens this passport
            </p>
            <p className="mt-1 text-label-sm text-secondary-on/70">
              Batch {batchId} · verified on the trust ledger
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-token-md text-center text-label-sm text-outline">
        Provenance verified by BazaarGrid · trust ledger entry {batchId}
      </p>
    </div>
  );
}
