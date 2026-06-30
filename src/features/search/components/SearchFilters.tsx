import { Chip, Icon } from "@/components/ui";
import { sellers } from "@/shared/mocks";
import type { ProductCategory, SellerType } from "@/shared/types";
import type { Filters } from "../hooks/useSearch";

const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: "HONEY",    label: "Honey",    icon: "local_florist" },
  { value: "OILS",     label: "Oils",     icon: "water_drop" },
  { value: "DAIRY",    label: "Dairy",    icon: "egg" },
  { value: "GRAINS",   label: "Grains",   icon: "grass" },
  { value: "POTTERY",  label: "Pottery",  icon: "sports_baseball" },
  { value: "TEXTILES", label: "Textiles", icon: "checkroom" },
  { value: "CRAFTS",   label: "Crafts",   icon: "brush" },
  { value: "SPICES",   label: "Spices",   icon: "spa" },
];

const VILLAGES = Array.from(new Set(sellers.map((s) => s.village)));

const SELLER_TYPES: { value: SellerType | "ALL"; label: string }[] = [
  { value: "ALL",              label: "All" },
  { value: "VILLAGE_PRODUCER", label: "Village" },
  { value: "KIRANA_STORE",     label: "Kirana" },
];

const RATINGS = [4, 3, 2] as const;

const QUALITY_TOGGLES = [
  { key: "organicOnly"   as const, icon: "eco",          label: "Organic certified" },
  { key: "traceableOnly" as const, icon: "qr_code_2",    label: "QR Traceable passport" },
  { key: "verifiedOnly"  as const, icon: "verified",      label: "Verified producers only" },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

interface SearchFiltersProps {
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  activeCount: number;
}

export function SearchFilters({ filters, onChange, onReset, activeCount }: SearchFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-headline-md font-medium text-on-surface">Filters</h2>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-label-md font-semibold text-primary hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Category */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Category
        </h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              selected={filters.categories.includes(c.value)}
              icon={c.icon}
              onClick={() => onChange("categories", toggle(filters.categories, c.value))}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </section>

      {/* Price range */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Price range
        </h3>
        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-label-sm text-on-surface-variant">Min ($)</span>
            <input
              type="number"
              min={0}
              max={filters.maxPrice - 1}
              step={5}
              value={filters.minPrice}
              onChange={(e) => onChange("minPrice", Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
          <span className="mb-2.5 text-outline">—</span>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-label-sm text-on-surface-variant">Max ($)</span>
            <input
              type="number"
              min={filters.minPrice + 1}
              max={500}
              step={5}
              value={filters.maxPrice}
              onChange={(e) => onChange("maxPrice", Number(e.target.value))}
              className="w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-body-md text-on-surface focus:border-primary focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Seller type */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Seller type
        </h3>
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-outline-variant text-center">
          {SELLER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange("sellerType", t.value)}
              className={`py-2 text-label-md font-semibold transition-colors ${
                filters.sellerType === t.value
                  ? "bg-secondary text-secondary-on"
                  : "text-on-surface-variant hover:bg-surface-low"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Origin village */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Origin village
        </h3>
        <div className="flex flex-wrap gap-2">
          {VILLAGES.map((v) => (
            <Chip
              key={v}
              selected={filters.villages.includes(v)}
              onClick={() => onChange("villages", toggle(filters.villages, v))}
            >
              {v}
            </Chip>
          ))}
        </div>
      </section>

      {/* Min rating */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Minimum rating
        </h3>
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => onChange("minRating", filters.minRating === r ? 0 : r)}
              className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-label-md font-semibold transition-colors ${
                filters.minRating === r
                  ? "border-primary bg-primary-fixed/30 text-primary"
                  : "border-outline-variant text-on-surface-variant hover:border-outline"
              }`}
            >
              <Icon name="star" size={14} className="text-amber-500" filled />
              {r}+
            </button>
          ))}
        </div>
      </section>

      {/* Quality toggles */}
      <section>
        <h3 className="mb-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-secondary">
          Quality &amp; trust
        </h3>
        <div className="space-y-2">
          {QUALITY_TOGGLES.map(({ key, icon, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-surface-highest bg-surface-low p-3 transition-colors hover:border-outline"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => onChange(key, e.target.checked)}
                className="h-4 w-4 accent-secondary"
              />
              <Icon name={icon} size={16} className="text-secondary" />
              <span className="text-label-md text-on-surface">{label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
