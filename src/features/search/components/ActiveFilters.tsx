import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui";
import type { Filters } from "../hooks/useSearch";

interface Pill {
  label: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  query: string;
  filters: Filters;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onClearQuery: () => void;
}

export function ActiveFilters({ query, filters, onChange, onClearQuery }: ActiveFiltersProps) {
  const pills: Pill[] = [];

  if (query) pills.push({ label: `"${query}"`, onRemove: onClearQuery });

  filters.categories.forEach((c) =>
    pills.push({
      label: c.charAt(0) + c.slice(1).toLowerCase(),
      onRemove: () => onChange("categories", filters.categories.filter((x) => x !== c)),
    }),
  );

  filters.villages.forEach((v) =>
    pills.push({
      label: v,
      onRemove: () => onChange("villages", filters.villages.filter((x) => x !== v)),
    }),
  );

  if (filters.sellerType !== "ALL")
    pills.push({
      label: filters.sellerType === "VILLAGE_PRODUCER" ? "Village Producers" : "Kirana Stores",
      onRemove: () => onChange("sellerType", "ALL"),
    });

  if (filters.organicOnly)
    pills.push({ label: "Organic", onRemove: () => onChange("organicOnly", false) });

  if (filters.traceableOnly)
    pills.push({ label: "QR-Traceable", onRemove: () => onChange("traceableOnly", false) });

  if (filters.verifiedOnly)
    pills.push({ label: "Verified Only", onRemove: () => onChange("verifiedOnly", false) });

  if (filters.minRating > 0)
    pills.push({ label: `${filters.minRating}+ Stars`, onRemove: () => onChange("minRating", 0) });

  if (pills.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <AnimatePresence initial={false}>
        {pills.map(({ label, onRemove }) => (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-3 py-1 text-label-md font-medium text-on-surface"
          >
            {label}
            <button
              onClick={onRemove}
              aria-label={`Remove ${label} filter`}
              className="rounded-full text-outline transition-colors hover:text-on-surface"
            >
              <Icon name="close" size={13} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
