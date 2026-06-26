import { Fragment } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

export interface Crumb {
  label: string;
  to?: string;
}

/** Simple breadcrumb trail. The last crumb is rendered as plain text. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-label-md", className)}>
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={c.label}>
            {c.to && !last ? (
              <Link to={c.to} className="text-on-surface-variant transition-colors hover:text-primary">
                {c.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-on-surface" : "text-on-surface-variant"}>
                {c.label}
              </span>
            )}
            {!last && <Icon name="chevron_right" size={16} className="text-outline" />}
          </Fragment>
        );
      })}
    </nav>
  );
}
