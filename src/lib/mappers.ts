/**
 * Maps Supabase DB rows → domain types used by UI components.
 * Keeps DB column_case separate from camelCase domain types.
 */

import type { Product, Seller, ProductCategory, ProductStatus } from "@/shared/types";
import type { DbProduct, DbSeller } from "@/lib/supabase";

export function mapProduct(p: DbProduct): Product {
  return {
    id:            p.id,
    sellerId:      p.seller_id,
    catalogItemId: p.catalog_item_id ?? undefined,
    name:          p.name,
    category:    p.category as ProductCategory,
    price:       p.price,
    currency:    p.currency,
    unit:        p.unit ?? "each",
    status:      p.status as ProductStatus,
    stock:       p.stock,
    images:      p.images ?? [],
    description: p.description ?? undefined,
    story:       p.story ?? undefined,
    tags:        p.tags ?? [],
    organic:     p.organic,
    traceable:   p.traceable,
    batchId:     p.batch_id ?? undefined,
    rating:      p.rating,
    reviewCount: p.review_count,
    createdAt:   p.created_at,
  };
}

export function mapSeller(s: DbSeller): Seller {
  return {
    id:                s.id,
    type:              s.type,
    name:              s.name,
    tagline:           s.tagline ?? undefined,
    village:           s.village ?? "",
    region:            s.region ?? undefined,
    story:             s.story ?? undefined,
    phone:             s.phone ?? "",
    email:             s.email ?? undefined,
    avatarUrl:         s.avatar_url ?? undefined,
    bannerUrl:         s.banner_url ?? undefined,
    verified:          s.verified,
    traceabilityScore: s.traceability_score,
    rating:            s.rating,
    reviewCount:       s.review_count,
    productCount:      s.product_count,
    memberSince:       s.member_since ?? undefined,
    brandAccents:      s.brand_accents ?? [],
    memberCount:       s.member_count ?? undefined,
  };
}
