import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { Icon, Rating } from "@/components/ui";
import { TrustBadge } from "./TrustBadge";
import { ProductThumb } from "./ProductThumb";
import { getSellerById } from "@/shared/mocks";
import type { Product } from "@/shared/types";

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  className?: string;
}

/**
 * The catalog/search workhorse: image, trust badge, name, producer, rating,
 * price + add-to-cart. 16px radius, stroke → terracotta on hover with a
 * tinted ambient lift (DESIGN.md).
 */
export function ProductCard({ product, onAdd, className }: ProductCardProps) {
  const seller = getSellerById(product.sellerId);
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
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-token-sm">
        {seller && (
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            {seller.verified && <Icon name="verified" size={13} filled className="text-secondary" />}
            {seller.name}
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
          {onAdd && (
            <button
              type="button"
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to basket`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-on transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <Icon name="add_shopping_cart" size={18} />
            </button>
          )}
        </div>
        <span className="text-label-sm text-outline">per {product.unit}</span>
      </div>
    </motion.article>
  );
}
