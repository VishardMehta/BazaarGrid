import { useParams } from "react-router-dom";
import { Avatar, ButtonLink, Card, Icon } from "@/components/ui";
import {
  ProductCard,
  SectionHeading,
  TrustBadge,
  Reveal,
  RevealItem,
} from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { formatMonthYear } from "@/lib/format";
import { useCart } from "@/features/cart/CartContext";
import { whatsappOrderLink } from "@/features/whatsapp/whatsapp";
import { WhatsAppButton } from "@/features/whatsapp/WhatsAppButton";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { useSeller } from "@/lib/hooks/useSellers";
import { useProducts } from "@/lib/hooks/useProducts";
import { mapProduct, mapSeller } from "@/lib/mappers";

const VALUES = [
  { icon: "verified", label: "Verified Producer" },
  { icon: "handshake", label: "Fair Trade" },
  { icon: "local_shipping", label: "Direct Shipping" },
  { icon: "qr_code_2", label: "Full Traceability" },
];

export function ProducerProfilePage() {
  const { sellerId } = useParams();
  const { data: dbSeller, isLoading } = useSeller(sellerId);
  const { data: dbProducts = [] }     = useProducts({ sellerId });
  const { add } = useCart();

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
    </div>
  );
  if (!dbSeller) return <NotFoundPage />;

  const seller   = mapSeller(dbSeller);
  const products = dbProducts.map(mapProduct);

  return (
    <div className="pb-token-lg">
      {/* Editorial hero — plain banner; identity sits in the row below it */}
      <section
        className="relative h-52 overflow-hidden md:h-60"
        style={{ backgroundImage: gradientFor(seller.id + "profile") }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-on-surface/10 to-on-surface/50" />
      </section>

      <div className="container-page">
        <div className="-mt-14 relative z-10 flex flex-col items-start gap-token-md md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Avatar name={seller.name} src={seller.avatarUrl} size="xl" className="ring-4 ring-surface" />
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-headline-lg font-semibold text-on-surface">{seller.name}</h1>
                {seller.verified && <Icon name="verified" size={22} filled className="text-secondary" />}
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-body-md text-on-surface-variant">
                <Icon name="location_on" size={16} /> {seller.village}, {seller.region}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonLink to={`/seller/${seller.id}`} variant="secondary" icon="reviews">
              Storefront
            </ButtonLink>
            <WhatsAppButton href={whatsappOrderLink(seller, [])} label="Direct support" />
          </div>
        </div>

        {/* Story */}
        <section className="grid gap-token-md py-token-lg md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-label-md uppercase tracking-[0.1em] text-primary">The Heritage Story</p>
            <p className="mt-3 text-body-lg leading-relaxed text-on-surface-variant">{seller.story}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {VALUES.map((v) => (
                <div key={v.label} className="flex flex-col items-center gap-2 rounded-lg bg-surface-low p-token-sm text-center">
                  <Icon name={v.icon} size={26} className="text-secondary" filled={v.icon === "verified"} />
                  <span className="text-label-sm font-medium text-on-surface-variant">{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Card padding="md" className="self-start">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Producer at a glance</h3>
            <dl className="mt-3 space-y-2 text-body-md">
              {[
                ["Total listings", `${seller.productCount ?? products.length}`],
                ["Member since", seller.memberSince ? formatMonthYear(seller.memberSince) : "—"],
                ["Rating", `${seller.rating ?? "—"} ★ (${seller.reviewCount ?? 0})`],
                ["Traceability", `${seller.traceabilityScore ?? "—"}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-surface-highest pb-2">
                  <dt className="text-on-surface-variant">{k}</dt>
                  <dd className="font-medium text-on-surface">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <TrustBadge kind="verified" compact />
              <TrustBadge kind="traceable" compact />
            </div>
          </Card>
        </section>

        {/* Products */}
        <section>
          <SectionHeading eyebrow="Curated Harvest" title={`Goods from ${seller.name}`} action={{ label: "Shop all", to: "/shop" }} />
          <Reveal as="div" stagger={0.06} className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-4">
            {products.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} onAdd={add} />
              </RevealItem>
            ))}
          </Reveal>
        </section>
      </div>
    </div>
  );
}
