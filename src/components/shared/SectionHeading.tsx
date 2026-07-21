import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";

interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional "view all" style link on the right. */
  action?: { label: string; to: string };
  align?: "left" | "center";
  className?: string;
}

/** Editorial section header: eyebrow + serif title + optional action link. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <p className="mb-1.5 text-label-md font-semibold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-headline-lg font-medium text-on-surface">{title}</h2>
        {subtitle && <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1 self-start text-label-md font-semibold text-secondary transition-colors hover:text-primary md:self-auto"
        >
          {action.label}
          <Icon name="arrow_forward" size={16} />
        </Link>
      )}
    </div>
  );
}
