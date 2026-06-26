import { useState } from "react";
import { Chip } from "@/components/ui";
import { ProductCard, SectionHeading, Reveal, RevealItem } from "@/components/shared";
import { useCart } from "@/features/cart/CartContext";
import { getLiveProducts } from "@/shared/mocks";
import type { ProductCategory } from "@/shared/types";

const FILTERS: { value: ProductCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HONEY", label: "Honey" },
  { value: "OILS", label: "Oils" },
  { value: "DAIRY", label: "Dairy" },
  { value: "GRAINS", label: "Grains" },
  { value: "POTTERY", label: "Pottery" },
  { value: "TEXTILES", label: "Textiles" },
];

export function CatalogPage() {
  const { add } = useCart();
  const [filter, setFilter] = useState<ProductCategory | "ALL">("ALL");
  const all = getLiveProducts();
  const shown = filter === "ALL" ? all : all.filter((p) => p.category === filter);

  return (
    <div className="container-page py-token-md">
      <SectionHeading
        eyebrow="The Marketplace"
        title="Shop the heritage grid"
        subtitle="Every item is made or grown by a verified village producer or trusted kirana store."
      />

      <div className="mt-token-md flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <Reveal
        as="div"
        stagger={0.06}
        className="mt-token-md grid grid-cols-2 gap-token-md md:grid-cols-3 xl:grid-cols-4"
      >
        {shown.map((p) => (
          <RevealItem key={p.id}>
            <ProductCard product={p} onAdd={add} />
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}
