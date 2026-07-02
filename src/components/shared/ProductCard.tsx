import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { Icon, Rating } from "@/components/ui";
import { TrustBadge } from "./TrustBadge";
import { ProductThumb } from "./ProductThumb";
import { FavoriteButton } from "./FavoriteButton";
import type { Product } from "@/shared/types";

interface ProductCardProps {
  product: Product;
  /** Optional seller name shown below the product card */
  sellerName?: string;
  onAdd?: (product: Product) => void;
  className?: string;
}

export function ProductCard({ product, sellerName, onAdd, className }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAdd?.(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-surface-highest bg-surface-lowest transition-colors duration-200 hover:border-primary hover:shadow-tinted",
        className,
      )}
    >
      <Link to={`/product/${product.id}`} className="relative block">
        <ProductThumb product={product} rounded="rounded-none" className="aspect-square w-full" iconSize={56} />
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
          {product.organic && <TrustBadge kind="organic" compact />}
          {product.traceable && <TrustBadge kind="traceable" compact />}
        </div>
        <FavoriteButton productId={product.id} className="absolute left-2.5 top-2.5" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-token-sm">
        {sellerName && (
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            {sellerName}
          </span>
        )}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-serif text-body-lg font-medium leading-snug text-on-surface group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        {product.rating ? <Rating value={product.rating} count={product.reviewCount} /> : null}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-serif text-headline-md font-semibold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {onAdd && ((product.stock ?? 1) <= 0 ? (
            <span
              title="Out of stock"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-outline"
            >
              <Icon name="production_quantity_limits" size={18} />
            </span>
          ) : (
            <motion.button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to basket`}
              animate={justAdded ? { scale: [1, 1.28, 1] } : {}}
              transition={{ duration: 0.22 }}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150",
                justAdded
                  ? "bg-primary text-primary-on"
                  : "bg-secondary text-secondary-on hover:scale-105 active:scale-95",
              )}
            >
              <Icon name={justAdded ? "check" : "add_shopping_cart"} size={18} />
            </motion.button>
          ))}
        </div>
        <span className="text-label-sm text-outline">per {product.unit}</span>
      </div>
    </motion.article>
  );
}
