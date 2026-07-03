import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, ButtonLink, Badge, Icon, Rating } from "@/components/ui";
import {
  Breadcrumbs,
  ProductCard,
  SectionHeading,
  SellerBadge,
  TrustBadge,
  QuantityStepper,
  useCurrentLocation,
} from "@/components/shared";
import { formatPrice, formatDate } from "@/lib/format";
import { categoryIcon, gradientFor } from "@/lib/placeholder";
import { useCart } from "@/features/cart/CartContext";
import { whatsappProductLink } from "@/features/whatsapp/whatsapp";
import { WhatsAppButton } from "@/features/whatsapp/WhatsAppButton";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { useProduct, useProducts } from "@/lib/hooks/useProducts";
import { useProductOffers } from "@/lib/hooks/useCatalog";
import { useSeller } from "@/lib/hooks/useSellers";
import { useProductReviews } from "@/lib/hooks/useReviews";
import { mapProduct, mapSeller } from "@/lib/mappers";
import { rankOffers, type OfferSort } from "@/features/catalog/offers";

const TRUST_ROW = [
  { icon: "verified",        label: "Verified Producer" },
  { icon: "qr_code_2",      label: "QR-Traceable" },
  { icon: "local_shipping",  label: "Carbon-Neutral" },
];

export function ProductDetailPage() {
  const { productId } = useParams();
  const { data: dbProduct, isLoading, error } = useProduct(productId);
  const { data: dbSeller } = useSeller(dbProduct?.seller_id ?? undefined);
  const { data: dbRelated = [] } = useProducts({ sellerId: dbProduct?.seller_id });
  const { data: reviews = [] } = useProductReviews(productId);
  const { add, lines } = useCart();
  const { data: offers = [] } = useProductOffers(dbProduct?.catalog_item_id ?? undefined);
  const buyerLoc = useCurrentLocation();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [offerSort, setOfferSort] = useState<OfferSort>("NEAREST");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const ranked = useMemo(() => rankOffers(offers, buyerLoc, offerSort), [offers, buyerLoc, offerSort]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (!dbProduct || error) return <NotFoundPage />;

  const product = mapProduct(dbProduct);
  const seller  = dbSeller ? mapSeller(dbSeller) : undefined;
  const related = dbRelated
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map(mapProduct);
  const gallery = product.images.length
    ? product.images
    : [undefined, undefined, undefined, undefined];

  // Catalogue products are sold by several stores; the buyer picks one offer.
  // `activeProduct` is that chosen offer (falls back to the page's product).
  const isCatalogue = !!product.catalogItemId;
  const selectedOffer = ranked.find((o) => o.product.id === selectedOfferId) ?? ranked[0];
  const activeProduct = isCatalogue && selectedOffer ? mapProduct(selectedOffer.product) : product;
  const inCart = lines.find((l) => l.product.id === activeProduct.id)?.quantity ?? 0;

  function handleAdd() {
    add(activeProduct, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <div className="container-page py-token-md">
      <Breadcrumbs
        className="mb-token-md"
        items={[
          { label: "Shop", to: "/shop" },
          { label: seller?.village ?? "Village", to: seller ? `/producer/${seller.id}` : undefined },
          { label: product.name },
        ]}
      />

      <div className="grid gap-token-lg lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-square overflow-hidden rounded-xl border border-surface-highest"
            style={gallery[activeImg] ? undefined : { backgroundImage: gradientFor(product.id + activeImg) }}
          >
            {gallery[activeImg] ? (
              <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <Icon name={categoryIcon(product.category)} size={96} className="text-surface-lowest/40" />
              </div>
            )}
            {product.organic && <TrustBadge kind="organic" className="absolute left-4 top-4" />}
          </motion.div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
                className={`aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                  i === activeImg ? "border-primary" : "border-surface-highest hover:border-outline"
                }`}
                style={img ? undefined : { backgroundImage: gradientFor(product.id + i) }}
              >
                {img ? (
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center">
                    <Icon name={categoryIcon(product.category)} size={22} className="text-surface-lowest/50" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="green" icon="category">{product.category.toLowerCase()}</Badge>
            {product.tags?.slice(0, 2).map((t) => (
              <Badge key={t} tone="turmeric">{t}</Badge>
            ))}
          </div>

          <h1 className="mt-3 font-serif text-display-lg text-[2.25rem] font-semibold leading-tight text-on-surface">
            {product.name}
          </h1>

          {product.rating ? <Rating value={product.rating} count={product.reviewCount} className="mt-3" size={18} /> : null}

          <div className="mt-4 flex items-end gap-2">
            <span className="font-serif text-display-lg text-[2.5rem] font-semibold text-primary">
              {formatPrice(activeProduct.price, activeProduct.currency)}
            </span>
            <span className="mb-2 text-body-md text-on-surface-variant">per {activeProduct.unit}</span>
          </div>

          {product.description && (
            <p className="mt-4 text-body-lg text-on-surface-variant">{product.description}</p>
          )}

          {/* Multi-seller buy-box: same product, pick which store to buy from */}
          {isCatalogue && ranked.length > 0 ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-label-md font-semibold text-on-surface">
                  Available from {ranked.length} {ranked.length === 1 ? "store" : "stores"}
                </p>
                <div className="inline-flex rounded-full border border-outline-variant p-0.5">
                  {([
                    ["NEAREST", "Nearest"],
                    ["CHEAPEST", "Cheapest"],
                    ["RATING", "Top-rated"],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setOfferSort(val)}
                      className={`rounded-full px-3 py-1 text-label-sm font-semibold transition-colors ${
                        offerSort === val ? "bg-secondary text-secondary-on" : "text-on-surface-variant"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {ranked.map((o) => {
                  const chosen = o.product.id === activeProduct.id;
                  const soldOut = (o.product.stock ?? 0) <= 0;
                  return (
                    <button
                      key={o.product.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => setSelectedOfferId(o.product.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                        chosen ? "border-secondary bg-secondary-container/20" : "border-outline-variant hover:border-secondary/50"
                      } ${soldOut ? "opacity-50" : ""}`}
                    >
                      <Icon
                        name={chosen ? "radio_button_checked" : "radio_button_unchecked"}
                        size={20}
                        className={chosen ? "text-secondary" : "text-outline"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-medium text-on-surface">
                          {o.seller?.name ?? "Store"}
                          {o.seller?.verified && <Icon name="verified" size={14} className="text-secondary" filled />}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-label-sm text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="location_on" size={13} /> {o.distanceLabel}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="local_shipping" size={13} /> {o.deliveryLabel}
                          </span>
                          {o.seller?.rating ? (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="star" size={13} filled /> {o.seller.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-serif text-headline-md font-semibold text-primary">
                          {formatPrice(o.product.price, o.product.currency)}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {soldOut ? "Out of stock" : `${o.product.stock} in stock`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            seller && (
              <div className="mt-5 rounded-lg border border-surface-highest bg-surface-low p-token-sm">
                <SellerBadge seller={seller} size="md" />
              </div>
            )
          )}

          {/* Buy box */}
          {(activeProduct.stock ?? 1) <= 0 ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-surface-high px-4 py-3 text-body-md font-medium text-on-surface-variant">
              <Icon name="production_quantity_limits" size={20} /> Out of stock — check back soon
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} max={activeProduct.stock ?? 99} />
              <Button onClick={handleAdd} size="lg" icon={added ? "check" : "add_shopping_cart"} className="flex-1">
                {added
                  ? `Added! · ${inCart} in basket`
                  : inCart > 0
                    ? `Add more · ${inCart} in basket`
                    : isCatalogue && selectedOffer?.seller
                      ? `Add from ${selectedOffer.seller.name}`
                      : "Add to basket"}
              </Button>
            </div>
          )}
          {(activeProduct.stock ?? 0) > 0 && (activeProduct.stock ?? 0) <= 10 && (
            <p className="mt-2 text-label-sm font-semibold text-primary">
              Only {activeProduct.stock} left in stock
            </p>
          )}

          {!isCatalogue && seller && (
            <WhatsAppButton
              href={whatsappProductLink(seller, product, qty)}
              size="lg"
              fullWidth
              className="mt-3"
            />
          )}

          {/* Trust row */}
          <div className="mt-5 flex flex-wrap gap-4 border-t border-surface-highest pt-5">
            {TRUST_ROW.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant">
                <Icon name={t.icon} size={18} className="text-secondary" filled={t.icon === "verified"} />
                {t.label}
              </span>
            ))}
          </div>

          {product.traceable && (
            <ButtonLink to={`/product/${product.id}/passport`} variant="ghost" className="mt-3" icon="qr_code_2">
              View product passport{product.batchId ? ` · ${product.batchId}` : ""}
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Heritage story */}
      {product.story && (
        <section className="mt-token-lg grid gap-token-md rounded-xl bg-surface-low p-token-md md:grid-cols-[1fr_1.4fr] md:p-8">
          <div>
            <p className="text-label-md uppercase tracking-[0.1em] text-primary">Heritage &amp; Purity</p>
            <h2 className="mt-2 font-serif text-headline-lg font-medium text-on-surface">The story in every batch</h2>
          </div>
          <p className="text-body-lg leading-relaxed text-on-surface-variant">{product.story}</p>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-token-lg">
          <SectionHeading eyebrow="From verified buyers" title="What buyers say" />
          <div className="mt-token-md grid gap-token-md md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-surface-highest bg-surface-lowest p-token-sm">
                <div className="flex items-center justify-between">
                  <Rating value={r.rating} size={15} />
                  <span className="text-label-sm text-on-surface-variant">{formatDate(r.created_at)}</span>
                </div>
                {r.review && (
                  <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">{r.review}</p>
                )}
                <p className="mt-2 inline-flex items-center gap-1 text-label-sm text-outline">
                  <Icon name="verified_user" size={13} /> Verified purchase
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-token-lg">
          <SectionHeading
            eyebrow="From the same producer"
            title={`More from ${seller?.name ?? "this producer"}`}
            action={seller ? { label: "Visit storefront", to: `/producer/${seller.id}` } : undefined}
          />
          <div className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={add} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
