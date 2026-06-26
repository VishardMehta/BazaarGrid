import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar, Icon } from "@/components/ui";
import type { Seller } from "@/shared/types";

interface SellerBadgeProps {
  seller: Seller;
  /** Link to the seller's public profile. */
  link?: boolean;
  size?: "sm" | "md";
  showVillage?: boolean;
  className?: string;
}

/** Producer/store identity chip: avatar + name + verified check (+ village). */
export function SellerBadge({
  seller,
  link = true,
  size = "sm",
  showVillage = true,
  className,
}: SellerBadgeProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Avatar name={seller.name} src={seller.avatarUrl} size={size === "sm" ? "sm" : "md"} />
      <span className="flex flex-col leading-tight">
        <span className="inline-flex items-center gap-1 text-body-md font-medium text-on-surface">
          {seller.name}
          {seller.verified && <Icon name="verified" size={15} filled className="text-secondary" />}
        </span>
        {showVillage && (
          <span className="inline-flex items-center gap-0.5 text-label-sm text-on-surface-variant">
            <Icon name="location_on" size={13} />
            {seller.village}
          </span>
        )}
      </span>
    </span>
  );

  if (!link) return inner;
  return (
    <Link to={`/seller/${seller.id}`} className="rounded transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}
