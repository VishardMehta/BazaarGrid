import { useState } from "react";
import { Chip } from "@/components/ui";
import { ProductCard, SectionHeading, Reveal, RevealItem } from "@/components/shared";
import { useCart } from "@/features/cart/CartContext";
import { useProducts } from "@/lib/hooks/useProducts";
import { mapProduct } from "@/lib/mappers";
import type { ProductCategory } from "@/shared/types";

const FILTERS: { value: ProductCategory | "ALL"; label: string }[] = [
  { value: "ALL",      label: "All"      },
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

  const products = dbProducts.map(mapProduct);

  return (
    <div className="container-page py-token-md">
      <SectionHeading
        eyebrow="The Marketplace"
        title="Shop the heritage grid"
        subtitle="Every item is made or grown by a verified village producer or trusted kirana store."
      />

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
      ) : products.length === 0 ? (
        <div className="mt-16 text-center text-on-surface-variant">
          No products in this category yet.
        </div>
      ) : (
        <Reveal
          as="div"
          stagger={0.05}
          className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((p) => (
            <RevealItem key={p.id}>
              <ProductCard product={p} onAdd={add} />
            </RevealItem>
          ))}
        </Reveal>
      )}
    </div>
  );
}
