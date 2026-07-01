import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(url, key);

// ── DB row types (mirrors schema.sql) ────────────────────────────────────────

export type UserRole   = "BUYER" | "PRODUCER" | "VILLAGE_ADMIN" | "OPERATOR";
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface DbProfile {
  id:         string;
  role:       UserRole;
  status:     UserStatus;
  name:       string | null;
  phone:      string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVillage {
  id:                 string;
  name:               string;
  region:             string | null;
  description:        string | null;
  status:             "ACTIVE" | "PENDING";
  traceability_score: number;
  producer_count:     number;
  product_count:      number;
  created_at:         string;
}

export interface DbSeller {
  id:                 string;
  profile_id:         string | null;
  village_id:         string | null;
  type:               "VILLAGE_PRODUCER" | "KIRANA_STORE";
  name:               string;
  tagline:            string | null;
  story:              string | null;
  village:            string | null;
  region:             string | null;
  phone:              string | null;
  email:              string | null;
  verified:           boolean;
  traceability_score: number;
  rating:             number;
  review_count:       number;
  product_count:      number;
  member_since:       string | null;
  avatar_url:         string | null;
  banner_url:         string | null;
  brand_accents:      string[];
  status:             "ACTIVE" | "PENDING" | "SUSPENDED";
  created_at:         string;
}

export interface DbProduct {
  id:           string;
  seller_id:    string;
  name:         string;
  description:  string | null;
  story:        string | null;
  price:        number;
  currency:     string;
  unit:         string | null;
  category:     string;
  status:       "LIVE" | "DRAFT" | "PENDING_APPROVAL";
  stock:        number;
  traceable:    boolean;
  organic:      boolean;
  batch_id:     string | null;
  tags:         string[];
  images:       string[];
  rating:       number;
  review_count: number;
  created_at:   string;
  updated_at:   string;
}

export interface DbOrder {
  id:               string;
  buyer_id:         string;
  seller_id:        string | null;
  status:           string;
  channel:          "APP" | "WHATSAPP";
  subtotal:         number | null;
  delivery_fee:     number;
  rewards_discount: number;
  total:            number;
  fulfillment:      "DELIVERY" | "PICKUP";
  payment_method:   string | null;
  promo_code:       string | null;
  pickup_location:  string | null;
  delivery_address: Record<string, unknown> | null;
  placed_at:        string;
  updated_at:       string;
}

export interface DbOrderItem {
  id:         string;
  order_id:   string;
  product_id: string | null;
  seller_id:  string | null;
  name:       string;
  unit:       string | null;
  quantity:   number;
  price:      number;
  subtotal:   number;
  traceable:  boolean;
  batch_id:   string | null;
  image_url:  string | null;
}

export interface DbAddress {
  id:          string;
  profile_id:  string;
  label:       string | null;
  line1:       string;
  line2:       string | null;
  city:        string | null;
  region:      string | null;
  postal_code: string | null;
  country:     string | null;
  is_default:  boolean;
  created_at:  string;
}

export interface DbPaymentMethod {
  id:         string;
  profile_id: string;
  type:       "CARD" | "UPI" | "NETBANKING";
  label:      string | null;
  last_four:  string | null;
  brand:      string | null;
  upi_id:     string | null;
  is_default: boolean;
  created_at: string;
}

export interface DbRewardTransaction {
  id:          string;
  profile_id:  string;
  type:        "EARN" | "REDEEM";
  points:      number;
  description: string | null;
  order_id:    string | null;
  created_at:  string;
}

export interface DbCampaign {
  id:          string;
  village_id:  string | null;
  title:       string;
  type:        string | null;
  audience:    string | null;
  start_date:  string | null;
  end_date:    string | null;
  description: string | null;
  status:      "ACTIVE" | "SCHEDULED" | "ENDED";
  reach:       number;
  created_at:  string;
}
