import type { ProductOffer } from "@/lib/hooks/useCatalog";
import type { LocationValue } from "@/components/shared";

export type OfferSort = "NEAREST" | "CHEAPEST" | "RATING";

export interface RankedOffer extends ProductOffer {
  /** 0 = same district as buyer, 1 = same state, 2 = elsewhere. */
  proximity: 0 | 1 | 2;
  distanceLabel: string;
  deliveryLabel: string;
}

function annotate(o: ProductOffer, buyer: LocationValue): RankedOffer {
  const sameDistrict = !!buyer.district && o.seller?.district === buyer.district;
  const sameState = !!buyer.state && o.seller?.state === buyer.state;
  const proximity: 0 | 1 | 2 = sameDistrict ? 0 : sameState ? 1 : 2;
  const place = o.seller?.district ?? o.seller?.region ?? "Other region";
  const distanceLabel = sameDistrict ? "In your district" : sameState ? `${place} · same state` : place;
  const deliveryLabel = proximity === 0 ? "Same-day delivery" : proximity === 1 ? "1–2 days" : "2–4 days";
  return { ...o, proximity, distanceLabel, deliveryLabel };
}

/** Annotate offers with distance/delivery vs the buyer's location, then sort by
 *  the buyer's chosen preference. Ties break toward nearer/cheaper. */
export function rankOffers(offers: ProductOffer[], buyer: LocationValue, sort: OfferSort): RankedOffer[] {
  const ranked = offers.map((o) => annotate(o, buyer));
  ranked.sort((a, b) => {
    if (sort === "CHEAPEST") return a.product.price - b.product.price || a.proximity - b.proximity;
    if (sort === "RATING") return (b.seller?.rating ?? 0) - (a.seller?.rating ?? 0) || a.proximity - b.proximity;
    return a.proximity - b.proximity || a.product.price - b.product.price; // NEAREST
  });
  return ranked;
}
