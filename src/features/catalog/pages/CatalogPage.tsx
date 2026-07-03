import { useState } from "react";
import { Chip } from "@/components/ui";
import { ProductCard, SectionHeading, Reveal, RevealItem, LocationBadge } from "@/components/shared";
import { useCart } from "@/features/cart/CartContext";
import { useProducts } from "@/lib/hooks/useProducts";
import { mapProduct } from "@/lib/mappers";
import { groupByCatalog } from "@/features/catalog/grouping";
import type { ProductCategory } from "@/shared/types";

const FILTERS: { value: ProductCategory | "ALL"; label: string }[] = [
  { value: "ALL",      label: "All"      },
  { value: "GROCERY",  label: "Grocery"  },
  { value: "HONEY",    label: "Honey"    },
  { value: "OILS",     label: "Oils"     },
  { value: "DAIRY",    label: "Dairy"    },
  { value: "GRAINS",   label: "Grains"   },
  { value: "POTTERY",  label: "Pottery"  },
  { value: "TEXTILES", label: "Textiles" },
  { value: "SPICES",   label: "Spices"   },
  { value: "CRAFTS",   label: "Crafts"   },
];

export function CatalogPage() {
  const { add } = useCart();
  const [filter, setFilter] = useState<ProductCategory | "ALL">("ALL");

  const { data: dbProducts = [], isLoading } = useProducts({
    category: filter !== "ALL" ? filter : undefined,
  });

  const entries = groupByCatalog(dbProducts.map(mapProduct));

  return (
    <div className="container-page py-token-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          eyebrow="The Marketplace"
          title="Shop the heritage grid"
          subtitle="Every item is made or grown by a verified village producer, kirana store, FPO, or SHG."
        />
        <LocationBadge className="mt-1" />
      </div>

      <div className="mt-token-md flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onClick={() => setFilter(filter === f.value && f.value !== "ALL" ? "ALL" : f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-token-lg grid grid-cols-2 gap-token-md md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-surface-high" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-16 text-center text-on-surface-variant">
          No products in this category yet.
        </div>
      ) : (
        <Reveal
          as="div"
          stagger={0.05}
          className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-3 xl:grid-cols-4"
        >
          {entries.map((e) => (
            <RevealItem key={e.product.catalogItemId ?? e.product.id}>
              <ProductCard product={e.product} storesCount={e.offerCount} onAdd={add} />
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  );
}
