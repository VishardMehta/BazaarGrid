import { cn } from "@/lib/cn";
import { categoryIcon, gradientFor } from "@/lib/placeholder";
import { Icon } from "@/components/ui";
import type { Product } from "@/shared/types";

interface ProductThumbProps {
  product: Pick<Product, "id" | "name" | "category" | "images">;
  className?: string;
  rounded?: string;
  /** Show the large category icon watermark (default true when no image). */
  iconSize?: number;
}

/**
 * Square product image area. Renders the real first image if present,
 * otherwise a deterministic on-brand gradient with the category icon.
 */
export function ProductThumb({ product, className, rounded = "rounded-md", iconSize = 40 }: ProductThumbProps) {
  const img = product.images?.[0];
  return (
    <div
      className={cn("relative overflow-hidden", rounded, className)}
      style={img ? undefined : { backgroundImage: gradientFor(product.id) }}
    >
      {img ? (
        <img src={img} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <Icon name={categoryIcon(product.category)} size={iconSize} className="text-surface-lowest/55" />
        </div>
      )}
    </div>
  );
}
