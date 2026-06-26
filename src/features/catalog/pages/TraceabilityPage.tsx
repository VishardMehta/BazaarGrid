import { useParams } from "react-router-dom";
import { Button, Card, Icon } from "@/components/ui";
import { Breadcrumbs, SellerBadge, Reveal, RevealItem } from "@/components/shared";
import { formatDate } from "@/lib/format";
import { gradientFor } from "@/lib/placeholder";
import { getProductById, getSellerById, getPassport } from "@/shared/mocks";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

export function TraceabilityPage() {
  const { productId } = useParams();
  const product = productId ? getProductById(productId) : undefined;
  const passport = productId ? getPassport(productId) : undefined;

  if (!product || !passport) return <NotFoundPage />;
  const seller = getSellerById(product.sellerId);

  return (
    <div className="container-page py-token-md">
      <Breadcrumbs
        className="mb-token-md"
        items={[
          { label: "Shop", to: "/shop" },
          { label: product.name, to: `/product/${product.id}` },
          { label: "Passport" },
        ]}
      />

      <Card padding="lg" className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label-md uppercase tracking-[0.15em] text-primary">Official Product Passport</p>
            <h1 className="mt-1 font-serif text-headline-lg font-medium text-on-surface">{product.name}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">Batch No. {passport.batchId}</p>
          </div>
          {passport.verifiedAuthentic && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-label-md font-semibold text-secondary-on-container">
              <Icon name="verified" size={18} filled /> Verified Authentic
            </span>
          )}
        </div>

        {/* Producer / Village / QR */}
        <div className="mt-token-md grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-surface-highest p-token-sm">
            <p className="mb-2 text-label-sm uppercase tracking-wide text-on-surface-variant">Producer</p>
            {seller && <SellerBadge seller={seller} showVillage={false} />}
          </div>
          <div className="rounded-lg border border-surface-highest p-token-sm">
            <p className="mb-2 text-label-sm uppercase tracking-wide text-on-surface-variant">Village</p>
            <p className="inline-flex items-center gap-1 font-serif text-body-lg text-on-surface">
              <Icon name="cottage" size={18} className="text-secondary" />
              {seller?.village}
            </p>
          </div>
          <div
            className="grid place-items-center rounded-lg p-token-sm text-surface-lowest"
            style={{ backgroundImage: gradientFor(passport.batchId) }}
          >
            <Icon name="qr_code_2" size={56} />
          </div>
        </div>

        {/* Journey timeline */}
        <div className="mt-token-md">
          <h2 className="mb-token-sm font-serif text-headline-md font-medium text-on-surface">Journey Timeline</h2>
          <Reveal as="ul" stagger={0.1} className="relative space-y-5 border-l-2 border-surface-highest pl-6">
            {passport.timeline.map((step) => (
              <RevealItem key={step.label} as="li" className="relative">
                <span
                  className={`absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-surface-lowest ${
                    step.done ? "bg-secondary text-secondary-on" : "bg-surface-high text-outline"
                  }`}
                >
                  <Icon name={step.done ? "check" : "schedule"} size={14} />
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <p className="font-serif text-body-lg font-medium text-on-surface">{step.label}</p>
                  <p className="text-label-sm text-on-surface-variant">{formatDate(step.date)}</p>
                </div>
                {step.description && (
                  <p className="mt-0.5 text-body-md text-on-surface-variant">{step.description}</p>
                )}
              </RevealItem>
            ))}
          </Reveal>
        </div>

        {/* Specs + village + report */}
        <div className="mt-token-md grid gap-token-md md:grid-cols-2">
          {passport.specs && (
            <div className="rounded-lg bg-surface-low p-token-sm">
              <h3 className="mb-2 font-serif text-headline-md font-medium text-on-surface">Batch Specifications</h3>
              <dl className="divide-y divide-surface-highest">
                {Object.entries(passport.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-body-md">
                    <dt className="text-on-surface-variant">{k}</dt>
                    <dd className="font-medium text-on-surface">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="flex flex-col justify-between rounded-lg bg-secondary p-token-sm text-secondary-on">
            <div>
              <h3 className="font-serif text-headline-md font-medium">The Village</h3>
              <p className="mt-1 text-body-md text-secondary-on/85">{seller?.story}</p>
            </div>
            <Button variant="tertiary" icon="download" className="mt-4 self-start">
              Download full report
            </Button>
          </div>
        </div>

        <p className="mt-token-md text-center text-label-sm text-outline">
          Scan verified on BazaarGrid · provenance recorded on the trust ledger
        </p>
      </Card>
    </div>
  );
}
